import "dotenv/config";
import mongoose from "mongoose";
import { google } from "googleapis";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import Integration from "../models/integration.model.js";

await mongoose.connect(process.env.MONGO_URI);

console.log("=================================================");
console.log("🏛️ AGENTRA-AI: EXECUTIVE ZERO-EMOJI MEMO DISPATCH");
console.log("=================================================");

const integration = await Integration.findOne({
  provider: "gmail",
  isConnected: true,
});
if (!integration) {
  console.log("❌ No active Google Integration found!");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL ||
    "http://localhost:8000/api/integration/google/callback",
);
oauth2Client.setCredentials({
  access_token: integration.tokens.accessToken,
  refresh_token: integration.tokens.refreshToken,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// 1. Scan Calendar
console.log("⏳ Scanning Calendar...");
let calendarEvents = [];
try {
  const now = new Date();
  const resCal = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: "startTime",
  });
  calendarEvents = resCal.data.items || [];
} catch (e) {
  console.log("Calendar note:", e.message);
}

// 2. Scan Gmail
console.log("⏳ Scanning Gmail...");
let emailList = [];
try {
  const resMail = await gmail.users.messages.list({
    userId: "me",
    maxResults: 5,
    q: "label:INBOX",
  });
  const msgIds = resMail.data.messages || [];
  for (const item of msgIds.slice(0, 5)) {
    const msgData = await gmail.users.messages.get({
      userId: "me",
      id: item.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const headers = msgData.data.payload?.headers || [];
    const from =
      headers.find((h) => h.name.toLowerCase() === "from")?.value || "Unknown";
    const subject =
      headers.find((h) => h.name.toLowerCase() === "subject")?.value ||
      "(No Subject)";
    emailList.push({
      from: from.split("<")[0].replace(/"/g, "").trim(),
      subject,
      snippet: msgData.data.snippet || "",
    });
  }
} catch (e) {
  console.log("Gmail note:", e.message);
}

// 3. Groq AI Synthesis (Zero Emojis, Pure Professionalism)
console.log("⏳ Synthesizing Executive Briefing with Groq AI...");
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0.3,
});

const prompt = `You are the Executive Chief of Staff for Sandesh.
Today is ${new Date().toDateString()}.

Calendar: ${JSON.stringify(calendarEvents.map((e) => ({ title: e.summary, start: e.start, meet: e.hangoutLink })))}
Recent Emails: ${JSON.stringify(emailList)}

CRITICAL INSTRUCTION:
Do NOT use ANY emojis whatsoever. No icons, no symbols. Keep the tone sophisticated, direct, and executive.

Return ONLY valid JSON:
{
  "quote": "Short thoughtful quote on leadership or focus",
  "quoteAuthor": "Author Name",
  "hasMeetings": true,
  "meetings": [
    { "time": "Time string", "title": "Meeting Title", "meetLink": "URL or null" }
  ],
  "emails": [
    { "sender": "Sender Name", "subject": "Subject", "takeaway": "Actionable takeaway in 1 sentence" }
  ],
  "priorities": [
    { "title": "Priority Title", "action": "Clear concrete step for today" }
  ]
}
If no meetings exist today, set hasMeetings: false and meetings: [].`;

const aiRes = await llm.invoke([new HumanMessage(prompt)]);
let data;
try {
  let cleaned = aiRes.content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```json\s*/, "")
      .replace(/^```\s*/, "")
      .replace(/```$/, "");
  }
  data = JSON.parse(cleaned);
} catch (e) {
  data = {
    quote: "Simplicity is the ultimate sophistication.",
    quoteAuthor: "Leonardo da Vinci",
    hasMeetings: false,
    meetings: [],
    emails: emailList.map((e) => ({
      sender: e.from,
      subject: e.subject,
      takeaway: e.snippet,
    })),
    priorities: [
      {
        title: "Daily Review",
        action: "Review priority items and pending tasks.",
      },
    ],
  };
}

// 4. Ultra-Sophisticated Corporate Memo (ZERO EMOJIS, Elegant Typography)
console.log("⏳ Building Clean Corporate Template & Sending...");

function buildExecutiveMemoHtml(d, userEmail) {
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const meetingsHtml =
    d.hasMeetings && d.meetings && d.meetings.length > 0
      ? d.meetings
          .map(
            (m) => `
        <li style="margin-bottom: 8px; font-size: 14.5px;">
          <strong>${m.time}</strong> — ${m.title}
          ${m.meetLink ? ` (<a href="${m.meetLink}" style="color: #1d4ed8; text-decoration: underline;">Join with Google Meet</a>)` : ""}
        </li>
      `,
          )
          .join("")
      : `<li style="color: #6b7280; font-size: 14px;">No meetings scheduled for today. Focus time available.</li>`;

  const emailsHtml = (d.emails || [])
    .map(
      (e) => `
    <li style="margin-bottom: 12px; font-size: 14.5px;">
      <strong>${e.sender}</strong> — ${e.subject}<br/>
      <span style="color: #4b5563; font-size: 13.5px;">Note: ${e.takeaway}</span>
    </li>
  `,
    )
    .join("");

  const prioritiesHtml = (d.priorities || [])
    .map(
      (p) => `
    <li style="margin-bottom: 8px; font-size: 14.5px;">
      <strong>${p.title}:</strong> ${p.action}
    </li>
  `,
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111827; background-color: #ffffff; margin: 0; padding: 36px 16px;">
    <div style="max-width: 580px; margin: 0 auto;">

      <!-- HEADER -->
      <div style="border-bottom: 2px solid #111827; padding-bottom: 14px; margin-bottom: 24px;">
        <div style="font-size: 10px; font-weight: 800; color: #6b7280; letter-spacing: 1.8px; text-transform: uppercase;">
          AGENTRA-AI &bull; EXECUTIVE BRIEFING
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 6px 0 2px 0; letter-spacing: -0.4px;">
          Good morning, Sandesh
        </h1>
        <div style="font-size: 13px; color: #6b7280;">
          ${todayFormatted}
        </div>
      </div>

      <!-- QUOTE -->
      <div style="margin-bottom: 28px; padding-left: 14px; border-left: 2px solid #111827;">
        <div style="font-size: 13.5px; color: #374151; font-style: italic;">
          "${d.quote}"
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-weight: 600;">
          — ${d.quoteAuthor}
        </div>
      </div>

      <!-- SECTION 1: SCHEDULE -->
      <div style="margin-bottom: 28px;">
        <div style="font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
          SCHEDULE & MEETINGS
        </div>
        <ul style="padding-left: 18px; margin: 0; color: #1f2937;">
          ${meetingsHtml}
        </ul>
      </div>

      <!-- SECTION 2: COMMUNICATIONS -->
      <div style="margin-bottom: 28px;">
        <div style="font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
          KEY COMMUNICATIONS
        </div>
        <ul style="padding-left: 18px; margin: 0; color: #1f2937;">
          ${emailsHtml}
        </ul>
      </div>

      <!-- SECTION 3: PRIORITIES -->
      <div style="margin-bottom: 32px;">
        <div style="font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
          PRIORITIES FOR TODAY
        </div>
        <ol style="padding-left: 18px; margin: 0; color: #1f2937;">
          ${prioritiesHtml}
        </ol>
      </div>

      <!-- FOOTER / SIGN-OFF -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #6b7280;">
        Delivered autonomously by Agentra-AI Chief of Staff &bull; ${userEmail}
      </div>

    </div>
  </body>
  </html>
  `;
}

const finalHtml = buildExecutiveMemoHtml(data, integration.accountEmail);

const todayShort = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const subject = `Executive Briefing: ${todayShort}`;
const emailLines = [
  `To: ${integration.accountEmail}`,
  `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
  "Content-Type: text/html; charset=utf-8",
  "MIME-Version: 1.0",
  "",
  finalHtml,
];

const rawMessage = Buffer.from(emailLines.join("\r\n"))
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

const res = await gmail.users.messages.send({
  userId: "me",
  requestBody: {
    raw: rawMessage,
  },
});

console.log("=================================================");
console.log("🏛️ EXECUTIVE ZERO-EMOJI MEMO DISPATCHED!");
console.log("=================================================");
console.log("   Delivered To :", integration.accountEmail);
console.log("   Message ID   :", res.data.id);
console.log("👉 Go refresh your Gmail Inbox now to check!");

process.exit(0);
