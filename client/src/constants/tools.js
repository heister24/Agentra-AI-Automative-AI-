import { Globe, Layers } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";
import {
  SiGmail,
  SiGooglecalendar,
  SiGooglesheets,
  SiGoogledocs,
} from "react-icons/si";

export const availableTools = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Automate DMs, post scheduling, and account engagement.",
    icon: FaInstagram,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Draft, send, read emails, and automate inbox workflows.",
    icon: SiGmail,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description:
      "Schedule meetings with Google Meet, check agenda, and manage events.",
    icon: SiGooglecalendar,
  },
  {
    id: "sheets",
    name: "Google Sheets",
    description:
      "Create spreadsheets, append rows (expenses, leads), and read tabular data.",
    icon: SiGooglesheets,
  },
  {
    id: "docs",
    name: "Google Docs",
    description:
      "Create project proposals, contracts, meeting notes, and formatted documents.",
    icon: SiGoogledocs,
  },
  {
    id: "web_search",
    name: "Web Search",
    description:
      "Real-time internet access, search queries, and content lookup.",
    icon: Globe,
  },
];

export const toolMeta = availableTools.reduce(
  (acc, tool) => {
    acc[tool.id] = {
      name: tool.name,
      icon: tool.icon,
      description: tool.description,
    };
    return acc;
  },
  {
    workspace: {
      id: "workspace",
      name: "Unified Workspace",
      icon: Layers,
      description: "Autonomous multi-tool chaining across Gmail, Calendar, Sheets, and Docs.",
    },
  },
);
