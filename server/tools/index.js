import { gmailTool } from "./gmail.tool.js";
import { webSearchTool } from "./webSearch.tool.js";
import { calendarTool } from "./calendar.tool.js";
import { sheetsTool } from "./sheets.tool.js";
import { docsTool } from "./docs.tool.js";

export const toolRegistry = {
  web_search: webSearchTool,
  gmail: gmailTool,
  calendar: calendarTool,
  sheets: sheetsTool,
  docs: docsTool,
};

export const allTools = Object.values(toolRegistry);
