import { tool } from "@langchain/core/tools";
import { z } from "zod";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { google } from "googleapis";
import Integration from "../models/integration.model.js";
import "dotenv/config";

// Creates an authenticated Google OAuth2 Gmail client for a specific user
async function getOAuthGmailClient(userId) {
  try {
    if (!userId) return null;
    const integration = await Integration.findOne({
      userId,
      provider: "gmail",
      isConnected: true,
    });

    if (!integration || !integration.tokens?.refreshToken) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:8000/api/integration/google/callback",
    );

    oauth2Client.setCredentials({
      access_token: integration.tokens.accessToken,
      refresh_token: integration.tokens.refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    return { gmail, accountEmail: integration.accountEmail };
  } catch (error) {
    console.error("Error creating OAuth Gmail client:", error.message);
    return null;
  }
}

// Read Emails via Google OAuth REST API (Fast & Reliable)
async function fetchEmailsOAuth(
  gmail,
  accountEmail,
  limit = 5,
  folder = "inbox",
) {
  const q = folder === "sent" ? "in:sent" : "in:inbox";
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: limit,
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) {
    return `Your ${folder === "sent" ? "Sent Mail" : "INBOX"} is empty.`;
  }

  const emailItems = await Promise.all(
    messages.map(async (item, idx) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: item.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });

      const headers = msg.data.payload?.headers || [];
      const getHeader = (name) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
          ?.value || "";

      const from = getHeader("From") || "Unknown Sender";
      const to = getHeader("To") || "Unknown Recipient";
      const subject = getHeader("Subject") || "(No Subject)";
      const rawDate = getHeader("Date");
      const date = rawDate
        ? new Date(rawDate).toLocaleString()
        : "Unknown date";
      const snippet = msg.data.snippet || "";

      return {
        seq: idx + 1,
        id: item.id,
        from,
        to,
        subject,
        date,
        snippet,
      };
    }),
  );

  const formattedList = emailItems.map((mail) => {
    if (folder === "sent") {
      return `[${mail.seq}] To: ${mail.to}\n    Subject: ${mail.subject}\n    Date: ${mail.date}\n    Snippet: ${mail.snippet}`;
    }
    return `[${mail.seq}] From: ${mail.from}\n    Subject: ${mail.subject}\n    Date: ${mail.date}\n    Snippet: ${mail.snippet}`;
  });

  return `Found ${emailItems.length} recent email(s) in ${
    folder === "sent" ? "Sent Mail" : "INBOX"
  } (Account: ${accountEmail}):\n\n${formattedList.join("\n\n")}`;
}

// Email via Google OAuth REST API
async function sendEmailOAuth(gmail, accountEmail, { to, subject, body }) {
  const emailLines = [
    `From: <${accountEmail}>`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    "",
    body,
  ];
  const raw = Buffer.from(emailLines.join("\r\n")).toString("base64url");

  const sendRes = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return `[SUCCESS] Email successfully sent to ${to} via connected Google account (${accountEmail})!
Subject: ${subject}
Message ID: ${sendRes.data.id}`;
}

// Delete Email via Google OAuth REST API (Safe Trash)

async function deleteEmailOAuth(
  gmail,
  accountEmail,
  { emailIndex, query, folder = "inbox" },
) {
  const q = folder === "sent" ? "in:sent" : "in:inbox";
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: 10,
  });

  const messages = listRes.data.messages || [];
  if (messages.length === 0) {
    return `Cannot delete: Your ${folder === "sent" ? "Sent Mail" : "INBOX"} is empty.`;
  }

  let targetId = null;
  let targetSubject = "";

  if (emailIndex && emailIndex > 0 && emailIndex <= messages.length) {
    targetId = messages[emailIndex - 1].id;
  } else if (query) {
    const searchRes = await gmail.users.messages.list({
      userId: "me",
      q: `${q} ${query}`,
      maxResults: 1,
    });
    if (searchRes.data.messages?.length > 0) {
      targetId = searchRes.data.messages[0].id;
    }
  } else {
    targetId = messages[0].id; // default to latest
  }

  if (!targetId) {
    return `Could not find any email matching criteria to delete.`;
  }

  try {
    const meta = await gmail.users.messages.get({
      userId: "me",
      id: targetId,
      format: "metadata",
      metadataHeaders: ["Subject"],
    });
    targetSubject =
      meta.data.payload?.headers?.find(
        (h) => h.name.toLowerCase() === "subject",
      )?.value || "(No Subject)";
  } catch {}

  // Move directly to Gmail Trash
  await gmail.users.messages.trash({
    userId: "me",
    id: targetId,
  });

  return `[SUCCESS] Email "${targetSubject}" (ID: ${targetId}) has been successfully deleted and moved to Gmail Trash!`;
}

// Fallback: Read recent emails via IMAP (App Password)
async function fetchRecentEmails(
  gmailUser,
  gmailPass,
  limit = 5,
  folder = "inbox",
) {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
    logger: false,
  });

  await client.connect();

  let mailboxPath = "INBOX";
  let folderLabel = "INBOX";

  if (folder === "sent") {
    try {
      const mailboxes = await client.list();
      const sentBox = mailboxes.find(
        (b) =>
          b.specialUse === "\\Sent" ||
          (b.path && b.path.toLowerCase().includes("sent")),
      );
      mailboxPath = sentBox ? sentBox.path : "[Gmail]/Sent Mail";
      folderLabel = "Sent Mail";
    } catch {
      mailboxPath = "[Gmail]/Sent Mail";
      folderLabel = "Sent Mail";
    }
  }

  const lock = await client.getMailboxLock(mailboxPath);

  try {
    const status = await client.status(mailboxPath, {
      messages: true,
      unseen: true,
    });
    const totalMessages = status.messages || 0;

    if (totalMessages === 0) {
      return `Your Gmail ${folderLabel} is completely empty.`;
    }

    const fromSeq = Math.max(1, totalMessages - limit + 1);
    const range = `${fromSeq}:${totalMessages}`;

    const emails = [];
    for await (const msg of client.fetch(range, { envelope: true })) {
      const from =
        msg.envelope?.from?.[0]?.address ||
        msg.envelope?.from?.[0]?.name ||
        "Unknown Sender";
      const to =
        msg.envelope?.to?.[0]?.address ||
        msg.envelope?.to?.[0]?.name ||
        "Unknown Recipient";
      const subject = msg.envelope?.subject || "(No Subject)";
      const date = msg.envelope?.date
        ? new Date(msg.envelope.date).toLocaleString()
        : "Unknown date";

      emails.unshift({
        seq: msg.seq,
        from,
        to,
        subject,
        date,
      });
    }

    const formattedList = emails.map((mail, idx) => {
      if (folder === "sent") {
        return `[${idx + 1}] (Seq: #${mail.seq}) To: ${mail.to}\n    Subject: ${mail.subject}\n    Date: ${mail.date}`;
      }
      return `[${idx + 1}] (Seq: #${mail.seq}) From: ${mail.from}\n    Subject: ${mail.subject}\n    Date: ${mail.date}`;
    });

    return `Found ${emails.length} recent email(s) in ${folderLabel} (Total: ${totalMessages}${
      folder !== "sent" ? `, Unread: ${status.unseen || 0}` : ""
    }):\n\n${formattedList.join("\n\n")}`;
  } finally {
    lock.release();
    await client.logout();
  }
}

// Fallback: Delete email via IMAP (App Password)
async function deleteEmailFromInbox(
  gmailUser,
  gmailPass,
  { emailIndex, query },
) {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    const status = await client.status("INBOX", { messages: true });
    const totalMessages = status.messages || 0;

    if (totalMessages === 0) {
      return "Cannot delete: Your INBOX is already empty.";
    }

    let targetSeq = null;
    let targetSubject = "";

    if (emailIndex && emailIndex > 0) {
      targetSeq = totalMessages - (emailIndex - 1);
      if (targetSeq < 1 || targetSeq > totalMessages) {
        return `Invalid index ${emailIndex}. There are currently ${totalMessages} emails in your inbox.`;
      }

      for await (const msg of client.fetch(targetSeq, { envelope: true })) {
        targetSubject = msg.envelope?.subject || "(No Subject)";
      }
    } else if (query) {
      const searchRange = `${Math.max(1, totalMessages - 20)}:${totalMessages}`;
      for await (const msg of client.fetch(searchRange, { envelope: true })) {
        const subj = msg.envelope?.subject || "";
        const from = msg.envelope?.from?.[0]?.address || "";
        if (
          subj.toLowerCase().includes(query.toLowerCase()) ||
          from.toLowerCase().includes(query.toLowerCase())
        ) {
          targetSeq = msg.seq;
          targetSubject = subj;
          break;
        }
      }

      if (!targetSeq) {
        return `Could not find any recent email matching "${query}" in your inbox to delete.`;
      }
    } else {
      return "Please specify which email to delete (e.g., emailIndex: 1 for the latest email, or query: 'subject text').";
    }

    try {
      await client.messageMove(targetSeq, "[Gmail]/Trash");
    } catch {
      await client.messageDelete(targetSeq);
    }

    return `[SUCCESS] Email "${targetSubject}" (Seq #${targetSeq}) has been successfully deleted and moved to Trash!`;
  } finally {
    lock.release();
    await client.logout();
  }
}

/**
 * Gmail Automation Tool for Agentra-AI
 * Supports: Read Inbox/Sent, Delete Emails, Compose Drafts, and Send Emails.
 * Uses: Google OAuth 2.0 (Primary) or App Password (Fallback).
 */
export const gmailTool = tool(
  async (
    {
      action,
      folder = "inbox",
      to,
      subject,
      body,
      limit = 5,
      emailIndex,
      query,
    },
    config,
  ) => {
    try {
      console.log(
        `📧 [GmailTool] Executing Action: "${action}" (Folder: "${folder}")`,
      );

      const userId = config?.configurable?.userId;
      const oauthClient = await getOAuthGmailClient(userId);

      const fallbackUser = process.env.GMAIL_USER;
      const fallbackPass = process.env.GMAIL_APP_PASSWORD;

      // ───────────────────────────────────────────────
      // 1. READ ACTION
      // ───────────────────────────────────────────────
      if (action === "read") {
        if (oauthClient) {
          console.log(
            `📥 [GmailTool] Reading emails via Google OAuth (${oauthClient.accountEmail})...`,
          );
          return await fetchEmailsOAuth(
            oauthClient.gmail,
            oauthClient.accountEmail,
            limit,
            folder,
          );
        }

        if (fallbackUser && fallbackPass) {
          console.log(
            `📥 [GmailTool] Reading emails via IMAP fallback (${fallbackUser})...`,
          );
          return await fetchRecentEmails(
            fallbackUser,
            fallbackPass,
            limit,
            folder,
          );
        }

        return `No Gmail account connected. Please visit the Integrations page (/integration) and click "Connect with Google" to view your emails.`;
      }

      // ───────────────────────────────────────────────
      // 2. DELETE ACTION
      // ───────────────────────────────────────────────
      if (action === "delete") {
        if (oauthClient) {
          console.log(
            `🗑️ [GmailTool] Deleting email via Google OAuth (${oauthClient.accountEmail})...`,
          );
          return await deleteEmailOAuth(
            oauthClient.gmail,
            oauthClient.accountEmail,
            {
              emailIndex,
              query,
              folder,
            },
          );
        }

        if (fallbackUser && fallbackPass) {
          console.log(`🗑️ [GmailTool] Deleting email via IMAP fallback...`);
          return await deleteEmailFromInbox(fallbackUser, fallbackPass, {
            emailIndex,
            query,
          });
        }

        return `No Gmail account connected. Please visit the Integrations page (/integration) and click "Connect with Google" to delete emails safely.`;
      }

      // ───────────────────────────────────────────────
      // 3. DRAFT ACTION (Always first before sending)
      // ───────────────────────────────────────────────
      if (action === "draft") {
        return `[EMAIL DRAFT CREATED]
To: ${to || "Not specified"}
Subject: ${subject || "No Subject"}
Content:
${body || "No Content"}

Status: Draft saved successfully. Ask me to "send this email" whenever you want to dispatch it.`;
      }

      // ───────────────────────────────────────────────
      // 4. SEND ACTION (Only after explicit confirmation)
      // ───────────────────────────────────────────────
      if (action === "send") {
        if (!to || !subject || !body) {
          return "Cannot send email: 'to', 'subject', and 'body' are all required.";
        }

        if (oauthClient) {
          console.log(
            `📤 [GmailTool] Dispatching email via Google OAuth (${oauthClient.accountEmail})...`,
          );
          return await sendEmailOAuth(
            oauthClient.gmail,
            oauthClient.accountEmail,
            {
              to,
              subject,
              body,
            },
          );
        }

        if (fallbackUser && fallbackPass) {
          console.log(
            `📤 [GmailTool] Dispatching email via Nodemailer SMTP fallback...`,
          );
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: fallbackUser,
              pass: fallbackPass,
            },
          });

          const mailOptions = {
            from: `"<${fallbackUser}>`,
            to: to,
            subject: subject,
            text: body,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <p>${body.replace(/\n/g, "<br/>")}</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
              <p style="font-size: 11px; color: #888;">Dispatched autonomously via Agentra-AI</p>
            </div>`,
          };

          const info = await transporter.sendMail(mailOptions);
          return `[SUCCESS] Email successfully sent to ${to}!
Subject: ${subject}
Message ID: ${info.messageId}`;
        }

        return `No Gmail account connected. Please visit the Integrations page (/integration) and click "Connect with Google" to dispatch emails.`;
      }

      return `Unsupported action "${action}". Supported actions are: 'read', 'delete', 'draft', 'send'.`;
    } catch (error) {
      console.error("❌ GmailTool Error:", error.message);
      return `Failed to execute Gmail action "${action}". Error: ${error.message}`;
    }
  },
  {
    name: "gmail",
    description:
      "Automate Gmail tasks: read recent inbox or sent emails, delete specific emails by index or subject, draft new emails, or send emails. IMPORTANT: Always use action 'draft' first when asked to send an email, show the draft to the user, and only use action 'send' after the user explicitly confirms (e.g. says yes/ha/send).",
    schema: z.object({
      action: z
        .enum(["read", "delete", "draft", "send"])
        .describe(
          "Action to perform: 'read' emails (inbox or sent), 'delete' an email, 'draft' to compose an email preview first (ALWAYS do this before sending), or 'send' to dispatch the email (ONLY after user says yes/confirms).",
        ),
      folder: z
        .enum(["inbox", "sent"])
        .optional()
        .describe(
          "When action is 'read', specify folder to read: 'inbox' for received emails or 'sent' for sent emails (defaults to inbox).",
        ),
      limit: z
        .number()
        .optional()
        .describe(
          "When action is 'read', how many emails to fetch (optional, defaults to 5).",
        ),
      emailIndex: z
        .number()
        .optional()
        .describe(
          "When action is 'delete', the 1-based index of the email to delete (1 = latest email).",
        ),
      query: z
        .string()
        .optional()
        .describe(
          "When action is 'delete', the subject keyword or sender email to match for deletion.",
        ),
      to: z
        .string()
        .optional()
        .describe("Recipient email address (for send/draft)."),
      subject: z
        .string()
        .optional()
        .describe("Subject line of the email (for send/draft)."),
      body: z
        .string()
        .optional()
        .describe("Body text content of the email (for send/draft)."),
    }),
  },
);
