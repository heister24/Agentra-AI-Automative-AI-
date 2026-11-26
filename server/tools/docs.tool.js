import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from "googleapis";
import Integration from "../models/integration.model.js";
import "dotenv/config";

// Extract Document ID from full Google Docs URL or raw ID
function extractDocumentId(input) {
  if (!input || !input.trim()) return null;
  const match = input.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

// OAuth Google Docs Client generator
async function getOAuthDocsClient(userId) {
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
      process.env.GOOGLE_REDIRECT_URL ||
        "http://localhost:8000/api/integration/google/callback",
    );

    oauth2Client.setCredentials({
      access_token: integration.tokens.accessToken,
      refresh_token: integration.tokens.refreshToken,
    });

    const docs = google.docs({ version: "v1", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    return { docs, drive, accountEmail: integration.accountEmail };
  } catch (error) {
    console.error("Error creating Docs client:", error.message);
    return null;
  }
}

export const docsTool = tool(
  async ({ action, title, content, documentId }, config) => {
    try {
      const userId = config?.configurable?.userId;
      const clientObj = await getOAuthDocsClient(userId);

      if (!clientObj) {
        return "ERROR: Google account is not connected. Please go to Integrations page (/integration) and connect your Google account.";
      }

      const { docs, drive } = clientObj;

      // ACTION 1: CREATE NEW GOOGLE DOC
      if (action === "create_doc") {
        const docTitle = title || "Agentra-AI Document";
        const res = await docs.documents.create({
          requestBody: { title: docTitle },
        });

        const newDocId = res.data.documentId;
        const docUrl = `https://docs.google.com/document/d/${newDocId}/edit`;

        // If content is provided, insert it into the document body
        if (content && content.trim()) {
          await docs.documents.batchUpdate({
            documentId: newDocId,
            requestBody: {
              requests: [
                {
                  insertText: {
                    location: { index: 1 },
                    text: content.trim() + "\n",
                  },
                },
              ],
            },
          });
        }

        return `✅ Successfully created Google Document!\n- Title: "${docTitle}"\n- Document ID: ${newDocId}\n- Edit URL: ${docUrl}\n\nPresent this clickable URL to the user so they can view and edit the document.`;
      }

      // ACTION 2: APPEND TEXT TO EXISTING DOC
      if (action === "append_text") {
        const docId = extractDocumentId(documentId);
        if (!docId) return "Error: documentId is required to append text.";
        if (!content) return "Error: content is required to append text.";

        // Fetch document to locate current end index
        const docRes = await docs.documents.get({ documentId: docId });
        const bodyContent = docRes.data.body?.content || [];
        const endIndex =
          bodyContent.length > 0
            ? bodyContent[bodyContent.length - 1].endIndex - 1
            : 1;

        await docs.documents.batchUpdate({
          documentId: docId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: Math.max(1, endIndex) },
                  text: "\n" + content.trim() + "\n",
                },
              },
            ],
          },
        });

        return `✅ Content appended successfully to Google Doc (ID: ${docId})!\n- Edit URL: https://docs.google.com/document/d/${docId}/edit`;
      }

      // ACTION 3: READ GOOGLE DOC CONTENT
      if (action === "read_doc") {
        const docId = extractDocumentId(documentId);
        if (!docId) return "Error: documentId is required to read doc.";

        const docRes = await docs.documents.get({ documentId: docId });
        const docTitle = docRes.data.title || "Untitled Document";
        let fullText = "";

        const bodyContent = docRes.data.body?.content || [];
        for (const element of bodyContent) {
          if (element.paragraph?.elements) {
            for (const el of element.paragraph.elements) {
              if (el.textRun?.content) {
                fullText += el.textRun.content;
              }
            }
          }
        }

        return `📄 Document: "${docTitle}" (ID: ${docId})\nLink: https://docs.google.com/document/d/${docId}/edit\n\nContent:\n${fullText.trim() || "(Empty Document)"}`;
      }

      // ACTION 4: DELETE GOOGLE DOC
      if (action === "delete_doc") {
        const docId = extractDocumentId(documentId);
        if (!docId) return "Error: documentId is required to delete doc.";

        await drive.files.update({
          fileId: docId,
          requestBody: { trashed: true },
        });

        return `🗑️ Google Document "${docId}" has been moved to Google Drive Trash.`;
      }

      return "Invalid action. Supported actions: create_doc, append_text, read_doc, delete_doc.";
    } catch (error) {
      console.error("DocsTool Error:", error.message);
      return `Failed to execute Google Docs action: ${error.message}`;
    }
  },
  {
    name: "docs",
    description:
      "Create, format, append, read, and manage Google Docs documents on Google Drive.",
    schema: z.object({
      action: z
        .enum(["create_doc", "append_text", "read_doc", "delete_doc"])
        .describe(
          "Action: 'create_doc' to make a new document with content, 'append_text' to add text to an existing doc, 'read_doc' to view doc content, 'delete_doc' to trash it.",
        ),
      title: z
        .string()
        .optional()
        .describe("Title of document for create_doc (e.g. 'Project Proposal')."),
      content: z
        .string()
        .optional()
        .describe("The formatted content/body text to write or append."),
      documentId: z
        .string()
        .optional()
        .describe("Google Docs Document ID or full URL."),
    }),
  },
);
