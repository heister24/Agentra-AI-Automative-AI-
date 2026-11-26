import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import Graph, { client } from "../utils/chatGraph.js";
import Agent from "../models/agent.model.js";
import ChatMessage from "../models/chatMessage.model.js";
import Integration from "../models/integration.model.js";
import User from "../models/user.model.js";
import createNotification from "../utils/notify.js";

//  Send Message & Get AI Response
export const chat = async (req, res) => {
  try {
    const { userPrompt, agentId, toolId } = req.body;
    if (!userPrompt || !agentId || !toolId) {
      return res.status(400).json({
        success: false,
        message: "userPrompt, agentId and toolId are all required.",
      });
    }

    const userId = req.user._id;

    // Timezone-aware date for daily quota reset (Feature 5.1 & 5.2)
    const userTz = req.user?.preferences?.timezone || "Asia/Kolkata";
    let todayStr;
    try {
      todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: userTz,
      }).format(new Date());
    } catch (e) {
      todayStr = new Date().toISOString().slice(0, 10);
    }

    const userUsage = req.user?.usage || {};
    const tier = userUsage.tier || "free";
    const dailyLimit =
      userUsage.dailyTokensLimit || (tier === "pro" ? 500000 : 50000);
    const lastReset = userUsage.lastResetDate
      ? String(userUsage.lastResetDate).slice(0, 10)
      : "";
    let dailyUsed = userUsage.dailyTokensUsed || 0;

    // Auto-Reset if date changed in user's timezone
    if (lastReset !== todayStr) {
      dailyUsed = 0;
      await User.findByIdAndUpdate(userId, {
        $set: {
          "usage.dailyTokensUsed": 0,
          "usage.lastResetDate": todayStr,
        },
      });
    }

    // Daily Token Limit Enforcement
    if (dailyUsed >= dailyLimit) {
      createNotification({
        userId,
        title: "Daily Token Quota Reached",
        message: `You have reached your daily quota of ${dailyLimit.toLocaleString()} tokens. Quota resets at midnight (${userTz}).`,
        type: "system",
        link: "/settings?tab=plan",
      });

      return res.status(429).json({
        success: false,
        code: "QUOTA_EXCEEDED",
        message: `You have reached your daily limit of ${dailyLimit.toLocaleString()} tokens. Quota resets at midnight (${userTz}).`,
        usage: {
          dailyTokensUsed: dailyUsed,
          dailyTokensLimit: dailyLimit,
          tier,
        },
      });
    }

    const agent = await Agent.findOne({ _id: agentId, userId: userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found or unauthorized.",
      });
    }

    // Verify Agent Active Status
    if (agent.isActive === false) {
      return res.status(403).json({
        success: false,
        message: `Agent "${agent.name}" is currently inactive. Please toggle it ON from "My Agents" to execute automation workflows.`,
      });
    }

    // Fetch user's active Gmail integration from Database
    const userIntegration = await Integration.findOne({
      userId: userId,
      provider: "gmail",
      isConnected: true,
    });
    const connectedEmail = userIntegration?.accountEmail || null;

    // First Save User Message In Database
    await ChatMessage.create({
      userId,
      agentId,
      toolId,
      sender: "user",
      content: userPrompt,
    });

    // Unique Thread ID
    const threadId = `${userId}_${agentId}_${toolId}`;

    // User Custom Instructions & Memory (Feature 2.1)
    const userMemory = req.user?.preferences?.customInstructions?.trim();
    const memoryContext = userMemory
      ? `\nUser Custom Guidelines:\n${userMemory}`
      : "";

    // Timezone-Aware System Context
    let localTimeStr;
    try {
      localTimeStr = new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: userTz,
      }).format(new Date());
    } catch (e) {
      localTimeStr = new Date().toISOString();
    }

    const systemPrompt = `You are ${agent.name}, an autonomous AI agent powered by Agentra-AI.
Agent Instructions: ${agent.instructions}
Account: ${connectedEmail || "Not Connected"} | Timezone: ${userTz} | Current Local Time: ${localTimeStr} | Channel: ${toolId}${memoryContext}

Execution Rules:
1. Multi-Tool Chaining: For multi-step tasks, execute tools sequentially without stopping until the task is complete.
2. Resource Links: Always provide clickable links for created Google Docs, Sheets, and Google Meet meetings.
3. Email Safety: NEVER send emails immediately. Always create a draft first, present details, and ask for explicit user confirmation before calling 'send'.
4. Calendar Scheduling: The user's timezone is '${userTz}'. When scheduling meetings, always preserve the user's requested local time with the explicit timezone offset in startDateTime and endDateTime (e.g. for 6:00 AM in Asia/Kolkata, use 'YYYY-MM-DDT06:00:00+05:30'). DO NOT convert local time to UTC 00:00Z.`;

    let data;
    try {
      data = await Graph.invoke(
        {
          messages: [
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
          ],
        },
        {
          configurable: {
            thread_id: threadId,
            userId: userId.toString(),
          },
          recursionLimit: 25,
        },
      );
    } catch (invokeError) {
      // Auto-recovery: If previous checkpoint had broken/mismatched function call turns,
      // purge the corrupt checkpoint for this thread and retry cleanly.
      const errMsg = String(invokeError?.message || "");
      if (
        errMsg.includes("function call turn") ||
        errMsg.includes("GoogleGenerativeAI") ||
        errMsg.includes("400")
      ) {
        console.warn(
          `[Auto-Recovery] Corrupted checkpoint detected on thread ${threadId}. Purging checkpoint and retrying...`,
        );
        try {
          const db = client.db("langraph");
          await db
            .collection("checkpoints")
            .deleteMany({ thread_id: threadId });
          await db
            .collection("checkpoint_blobs")
            .deleteMany({ thread_id: threadId });
          await db
            .collection("checkpoint_writes")
            .deleteMany({ thread_id: threadId });
        } catch (e) {
          // ignore
        }
        data = await Graph.invoke(
          {
            messages: [
              new SystemMessage(systemPrompt),
              new HumanMessage(userPrompt),
            ],
          },
          {
            configurable: {
              thread_id: threadId,
              userId: userId.toString(),
            },
            recursionLimit: 25,
          },
        );
      } else {
        throw invokeError;
      }
    }

    // Extract any autonomous tools invoked during this execution
    const toolsUsed = [];
    let lastToolOutput = "";
    if (data.messages && Array.isArray(data.messages)) {
      for (const msg of data.messages) {
        if (
          msg.tool_calls &&
          Array.isArray(msg.tool_calls) &&
          msg.tool_calls.length > 0
        ) {
          for (const tc of msg.tool_calls) {
            toolsUsed.push({
              name: tc.name,
              args: tc.args,
            });
          }
        }
        if (msg._getType?.() === "tool" && typeof msg.content === "string") {
          lastToolOutput = msg.content;
        }
      }
    }

    // Safely extract the final AI response (search backwards for non-empty text)
    let aiResponse = "";
    for (let i = data.messages.length - 1; i >= 0; i--) {
      const msg = data.messages[i];
      if (typeof msg.content === "string" && msg.content.trim().length > 0) {
        aiResponse = msg.content.trim();
        break;
      }
    }

    // Fallback: If AI message was empty or tool finished without LLM summary
    if (!aiResponse) {
      aiResponse = lastToolOutput || "Action completed successfully.";
    }

    // Saving Ai Response In The Database
    const SavedAiResponse = await ChatMessage.create({
      userId,
      toolId,
      agentId,
      sender: "ai",
      content: aiResponse,
    });

    // Multi-Step Tool Chaining Token Summation (Feature 5.1)
    let tokensUsed = 0;
    if (data.messages && Array.isArray(data.messages)) {
      for (const m of data.messages) {
        if (m.usage_metadata?.total_tokens) {
          tokensUsed += m.usage_metadata.total_tokens;
        } else if (m.response_metadata?.tokenUsage?.totalTokens) {
          tokensUsed += m.response_metadata.tokenUsage.totalTokens;
        }
      }
    }

    // Fallback estimation (1 token ~ 4 chars)
    if (!tokensUsed) {
      const chars = (userPrompt || "").length + (aiResponse || "").length;
      tokensUsed = Math.max(15, Math.ceil(chars / 4));
    }

    // Update User Usage in Database
    await User.findByIdAndUpdate(userId, {
      $inc: {
        "usage.dailyTokensUsed": tokensUsed,
        "usage.totalTokensLifetime": tokensUsed,
      },
      $set: {
        "usage.lastResetDate": todayStr,
        "usage.dailyTokensLimit": dailyLimit,
        "usage.tier": tier,
      },
    });

    return res.status(200).json({
      success: true,
      aiResponse: aiResponse,
      messageId: SavedAiResponse._id,
      toolsUsed: toolsUsed,
      usage: {
        tokensUsed,
        dailyTokensUsed: dailyUsed + tokensUsed,
        dailyTokensLimit: dailyLimit,
        tier,
      },
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    const errorMessage =
      error?.error?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Internal Server error While Chat";

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorMessage,
    });
  }
};

// Get Previous Chat History for Selected Tool
export const getChatHistory = async (req, res) => {
  try {
    const agentId =
      req.params.agentId || req.body?.agentId || req.query?.agentId;
    const toolId = req.params.toolId || req.body?.toolId || req.query?.toolId;
    const userId = req.user._id;

    if (!agentId || !toolId) {
      return res.status(400).json({
        success: false,
        message: "agentId and toolId are required to fetch chat history.",
      });
    }

    const history = await ChatMessage.find({
      userId: userId,
      agentId: agentId,
      toolId: toolId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      history: history.map((msg) => ({
        _id: msg._id,
        sender: msg.sender,
        message: msg.content,
        createdAt: msg.createdAt,
      })),
      messages: history,
    });
  } catch (error) {
    console.error("Fetch History Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
};

// Clear Chat History for Selected Tool
export const clearChatHistory = async (req, res) => {
  try {
    const agentId =
      req.params.agentId || req.body?.agentId || req.query?.agentId;
    const toolId = req.params.toolId || req.body?.toolId || req.query?.toolId;
    const userId = req.user._id;

    if (!agentId || !toolId) {
      return res.status(400).json({
        success: false,
        message: "agentId and toolId are required to clear chat history.",
      });
    }

    // 1. Delete all messages for this agent and tool from MongoDB
    const result = await ChatMessage.deleteMany({
      userId: userId,
      agentId: agentId,
      toolId: toolId,
    });

    // 2. Also clear langgraph checkpoints if active
    try {
      const threadId = `${userId}_${agentId}_${toolId}`;
      const db = client.db("langraph");
      await db.collection("checkpoints").deleteMany({ thread_id: threadId });
      await db
        .collection("checkpoint_blobs")
        .deleteMany({ thread_id: threadId });
      await db
        .collection("checkpoint_writes")
        .deleteMany({ thread_id: threadId });
    } catch (e) {
      // Non-blocking
    }

    return res.status(200).json({
      success: true,
      message: "Chat history cleared successfully from database",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear History Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error clearing chat history",
      error: error.message,
    });
  }
};

// 🛡️ Human-in-the-Loop Action Approval Decision (Feature 2)
export const handleActionDecision = async (req, res) => {
  try {
    const { messageId, decision } = req.body;
    const userId = req.user._id;

    if (!messageId || !["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message:
          "messageId and valid decision ('approved' | 'rejected') are required.",
      });
    }

    const message = await ChatMessage.findOne({ _id: messageId, userId });
    if (!message || !message.actionProposal) {
      return res.status(404).json({
        success: false,
        message: "Action proposal not found for this message.",
      });
    }

    if (message.actionProposal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Action proposal has already been ${message.actionProposal.status}.`,
        actionProposal: message.actionProposal,
      });
    }

    if (decision === "rejected") {
      message.actionProposal.status = "rejected";
      message.actionProposal.executedAt = new Date();
      await message.save();

      return res.status(200).json({
        success: true,
        message: "Action cancelled safely.",
        actionProposal: message.actionProposal,
      });
    }

    // Approved: Execute Tool Action
    const { tool, action, details } = message.actionProposal;
    let executionResult = "";

    if (tool === "gmail" && action === "send") {
      const authData = await getOAuthClient(userId, "gmail");
      if (authData) {
        const gmail = google.gmail({
          version: "v1",
          auth: authData.oauth2Client,
        });
        const rawEmail = [
          `From: <${authData.accountEmail}>`,
          `To: ${details.to}`,
          `Subject: ${details.subject || "No Subject"}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          details.body || "",
        ].join("\n");
        const encoded = Buffer.from(rawEmail).toString("base64url");
        await gmail.users.messages.send({
          userId: "me",
          requestBody: { raw: encoded },
        });
        executionResult = `Email dispatched to ${details.to} via ${authData.accountEmail}.`;
      } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: `<${process.env.EMAIL_USER}>`,
          to: details.to,
          subject: details.subject || "No Subject",
          text: details.body || "",
        });
        executionResult = `Email dispatched to ${details.to} via SMTP.`;
      } else {
        return res.status(400).json({
          success: false,
          message: "No connected Gmail account found.",
        });
      }
    } else if (tool === "calendar" && action === "create_event") {
      const authData = await getOAuthClient(userId, "gmail");
      if (authData) {
        const calendar = google.calendar({
          version: "v3",
          auth: authData.oauth2Client,
        });
        const cal = await calendar.calendars.get({ calendarId: "primary" });
        const calTz = cal.data?.timeZone || "UTC";

        const resEvent = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: details.summary,
            description: details.description || "",
            start: { dateTime: details.startDateTime, timeZone: calTz },
            end: { dateTime: details.endDateTime, timeZone: calTz },
          },
        });
        executionResult = `Calendar meeting booked: ${resEvent.data.htmlLink || details.summary}`;
      } else {
        return res.status(400).json({
          success: false,
          message: "No connected Google Calendar integration found.",
        });
      }
    }

    message.actionProposal.status = "approved";
    message.actionProposal.executedAt = new Date();
    await message.save();

    createNotification({
      userId,
      title: "Action Approved & Executed",
      message: executionResult,
      type: "success",
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: executionResult,
      actionProposal: message.actionProposal,
    });
  } catch (error) {
    console.error("Action Decision Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute approved action.",
    });
  }
};
