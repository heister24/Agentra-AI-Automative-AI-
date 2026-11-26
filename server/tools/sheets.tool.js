import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from "googleapis";
import Integration from "../models/integration.model.js";
import "dotenv/config";

// URL Extractor
function extractSpreadsheetId(input) {
  if (!input) return null;
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

// OAuth Sheets Client
async function getOAuthSheetsClient(userId) {
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
        "http://localhost:8000/api/integration/google/callback"
    );

    oauth2Client.setCredentials({
      access_token: integration.tokens.accessToken,
      refresh_token: integration.tokens.refreshToken,
    });

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    return { sheets, drive, accountEmail: integration.accountEmail };
  } catch (error) {
    console.error("Error creating Sheets client:", error.message);
    return null;
  }
}

// Create a New Spreadsheet (with optional headers)
async function createSpreadsheet(sheets, { title, headers }) {
  const sheetTitle = title || "Agentra-AI Spreadsheet";

  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: sheetTitle,
      },
    },
  });

  const spreadsheetId = res.data.spreadsheetId;
  const spreadsheetUrl = res.data.spreadsheetUrl;

  if (headers) {
    const headerRow =
      typeof headers === "string"
        ? headers.split(",").map((h) => h.trim())
        : headers;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headerRow],
      },
    });
  }

  return `[SUCCESS] Google Spreadsheet "${sheetTitle}" created successfully!
Spreadsheet ID: ${spreadsheetId}
Spreadsheet Link: ${spreadsheetUrl}
Headers: ${headers ? headers : "None (Blank Sheet)"}`;
}

/**
 * Action 2: Append Rows of Data to an Existing Sheet
 */
async function appendRows(
  sheets,
  { spreadsheetId, values, sheetName = "Sheet1" }
) {
  // Agar user ne poora link diya hai toh usme se clean ID nikalna
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    return "Error: 'spreadsheetId' (ya Google Sheet ka full URL) dena zaroori hai.";
  }

  let rowData = [];
  if (typeof values === "string") {
    try {
      const parsed = JSON.parse(values);
      if (Array.isArray(parsed)) {
        rowData = Array.isArray(parsed[0]) ? parsed : [parsed];
      }
    } catch {
      rowData = [values.split(",").map((v) => v.trim())];
    }
  } else if (Array.isArray(values)) {
    rowData = Array.isArray(values[0]) ? values : [values];
  }

  if (rowData.length === 0) {
    return "Error: Append karne ke liye koi valid data nahi mila.";
  }

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: cleanId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rowData,
    },
  });

  const updatedRows = res.data.updates?.updatedRows || rowData.length;
  return `[SUCCESS] ${updatedRows} row(s) successfully append ho gayi hain!
Spreadsheet ID: ${cleanId}
Target Range: ${res.data.updates?.updatedRange || sheetName}`;
}

/**
 * Action 3: Read Rows from a Spreadsheet and return as Markdown Table
 */
async function readSpreadsheet(
  sheets,
  { spreadsheetId, range = "Sheet1!A1:Z50", limit = 20 }
) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    return "Error: 'spreadsheetId' (ya Google Sheet ka full URL) dena zaroori hai.";
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: cleanId,
    range,
  });

  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    return `Spreadsheet (ID: ${cleanId}) bilkul empty hai ya range "${range}" me koi data nahi mila.`;
  }

  const displayRows = rows.slice(0, limit);
  const header = displayRows[0];
  const divider = header.map(() => "---");
  const dataRows = displayRows.slice(1);

  const markdownLines = [
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...dataRows.map((r) => `| ${r.join(" | ")} |`),
  ];

  const summary = `Found ${rows.length} total row(s) in spreadsheet (showing ${displayRows.length}):\n\n${markdownLines.join("\n")}`;
  return summary;
}

/**
 * Action 4: Delete / Move Spreadsheet to Google Drive Trash
 */
async function deleteSpreadsheet(drive, { spreadsheetId }) {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    return "Error: 'spreadsheetId' (ya Google Sheet ka full URL) dena zaroori hai delete karne ke liye.";
  }

  let fileName = "Spreadsheet";
  try {
    const fileMeta = await drive.files.get({
      fileId: cleanId,
      fields: "name",
    });
    fileName = fileMeta.data?.name || fileName;
  } catch (err) {
    // Non-blocking if metadata get fails
  }

  await drive.files.update({
    fileId: cleanId,
    requestBody: {
      trashed: true,
    },
  });

  return `[SUCCESS] Google Spreadsheet "${fileName}" (ID: ${cleanId}) has been successfully deleted and moved to Google Drive Trash!`;
}

/**
 * Google Sheets Automation Tool for Agentra-AI
 * Supports: create_sheet, append_row, read_sheet, delete_sheet
 */
export const sheetsTool = tool(
  async (
    {
      action,
      title,
      headers,
      spreadsheetId,
      values,
      range,
      sheetName,
      limit = 20,
    },
    config
  ) => {
    try {
      console.log(`📊 [SheetsTool] Executing Action: "${action}"`);
      const userId = config?.configurable?.userId;
      const oauthClient = await getOAuthSheetsClient(userId);

      if (!oauthClient) {
        return "No Google account connected. Please visit the Integrations page (/integration) and click 'Connect with Google' to manage your spreadsheets.";
      }

      if (action === "create_sheet") {
        return await createSpreadsheet(oauthClient.sheets, { title, headers });
      }

      if (action === "append_row") {
        return await appendRows(oauthClient.sheets, {
          spreadsheetId,
          values,
          sheetName,
        });
      }

      if (action === "read_sheet") {
        return await readSpreadsheet(oauthClient.sheets, {
          spreadsheetId,
          range,
          limit,
        });
      }

      if (action === "delete_sheet") {
        return await deleteSpreadsheet(oauthClient.drive, { spreadsheetId });
      }

      return `Unsupported action "${action}". Supported actions are: 'create_sheet', 'append_row', 'read_sheet', 'delete_sheet'.`;
    } catch (error) {
      console.error("❌ SheetsTool Error:", error.message);
      return `Failed to execute Google Sheets action "${action}". Error: ${error.message}`;
    }
  },
  {
    name: "sheets",
    description:
      "Manage Google Sheets: create new spreadsheets with headers, append rows of data, read existing spreadsheet data in table format, or delete/trash a spreadsheet file.",
    schema: z.object({
      action: z
        .enum(["create_sheet", "append_row", "read_sheet", "delete_sheet"])
        .describe(
          "Action to perform: 'create_sheet' to make a new spreadsheet, 'append_row' to add data rows, 'read_sheet' to view table data, or 'delete_sheet' to move a spreadsheet file to Google Drive Trash."
        ),
      title: z
        .string()
        .optional()
        .describe(
          "Title of the spreadsheet for create_sheet (e.g. 'Monthly Expenses 2026')."
        ),
      headers: z
        .string()
        .optional()
        .describe(
          "Comma-separated column headers for create_sheet (e.g. 'Date, Item, Category, Amount, Status')."
        ),
      spreadsheetId: z
        .string()
        .optional()
        .describe(
          "Google Spreadsheet ID or full Google Sheets URL to append to, read from, or delete."
        ),
      values: z
        .string()
        .optional()
        .describe(
          "Comma-separated values or JSON array string of row values to append (e.g. '2026-11-19, Coffee, Office, 120, Paid')."
        ),
      range: z
        .string()
        .optional()
        .describe(
          "A1 notation range to read for read_sheet (e.g. 'Sheet1!A1:Z50')."
        ),
      sheetName: z
        .string()
        .optional()
        .describe("Sheet tab name to append to (defaults to 'Sheet1')."),
      limit: z
        .number()
        .optional()
        .describe("Maximum rows to return for read_sheet (defaults to 20)."),
    }),
  }
);
