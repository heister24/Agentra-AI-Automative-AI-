import express from "express";
import {
  chat,
  clearChatHistory,
  getChatHistory,
} from "../controllers/chat.controller.js";

const chatRouter = express.Router();

chatRouter.post("/send", chat); // For Sending The Message
chatRouter.get("/history/:agentId/:toolId", getChatHistory); // Fetch Previous Chat History
chatRouter.delete("/delete/:agentId/:toolId", clearChatHistory);

export default chatRouter;
