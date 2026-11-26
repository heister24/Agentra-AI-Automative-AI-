import Agent from "../models/agent.model.js";
import ChatMessage from "../models/chatMessage.model.js";
import { client } from "../utils/chatGraph.js";
import createNotification from "../utils/notify.js";
import mongoose from "mongoose";

const isValidAgentId = (id) => mongoose.isValidObjectId(id);

export const createNewAgent = async (req, res) => {
  try {
    const userId = req.user._id;
    const userTier =
      req.user?.preferences?.usage?.tier ||
      req.user?.usage?.tier ||
      req.user?.tier ||
      "free";
    const agentCount = await Agent.countDocuments({ userId });

    if (userTier === "free" && agentCount >= 3) {
      return res.status(403).json({
        success: false,
        code: "AGENT_LIMIT_REACHED",
        message:
          "Free tier allows a maximum of 3 agents. Please delete an existing agent or upgrade to Pro.",
      });
    }
    // console.log("UserId : ", userId);
    const { name, description, instructions, tools } = req.body ?? {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof instructions !== "string" ||
      !instructions.trim() ||
      !Array.isArray(tools) ||
      tools.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields Are Required And Tools Must Be A Non-Empty Array!",
      });
    }

    const existAgent = await Agent.findOne({ userId: userId, name: name });
    if (existAgent) {
      return res.status(409).json({
        success: false,
        message: `Agent with this name : ${name} , already exists please name your agent with a different name!`,
      });
    }

    const agent = await Agent.create({
      userId: userId,
      name: name,
      description: description,
      tools: tools,
      instructions: instructions,
    });

    // In-app notification for agent creation (Feature 4.2)
    await createNotification({
      userId,
      title: "Agent Deployed",
      message: `Agent "${name}" was created and is ready for automations.`,
      type: "agent",
      link: `/agent/${agent._id}`,
    });

    return res.status(201).json({
      success: true,
      message: `${name},  Agent Created Successfully`,
      agent: agent,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error While Creating New Agent",
      error: error.message,
    });
  }
};

export const getAllAgents = async (req, res) => {
  try {
    const userId = req.user._id;
    const agents = await Agent.find({ userId: userId }).sort({ createdAt: -1 });

    if (agents.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No Agent Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All Agents Are Fetched Successfully",
      totalAgents: agents.length,
      all_agents: agents,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error While Fetching All Agents",
      error: error.message,
    });
  }
};

export const getAgentById = async (req, res) => {
  try {
    const agentId = req.params.id;
    const userId = req.user?._id;

    if (!isValidAgentId(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agent Id",
      });
    }

    const agent = await Agent.findOne({ _id: agentId, userId: userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: `Agent With This Agent Id : ${agentId},  Does Not Exist.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Agent With Agent Id : ${agentId} , Fetched Successfully`,
      agent: agent,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error While Fetching Specific Agent`,
      error: error.message,
    });
  }
};

export const deleteAllAgents = async (req, res) => {
  try {
    const userId = req.user?._id;

    // 1. Delete all agents belonging to this user
    const result = await Agent.deleteMany({ userId: userId });

    // 2. Cascade delete all chat messages belonging to this user
    const chatDeleteResult = await ChatMessage.deleteMany({ userId: userId });

    // 3. Clear langgraph checkpoint threads starting with `${userId}_`
    try {
      const db = client.db("langraph");
      const threadRegex = new RegExp(`^${userId}_`);
      await db.collection("checkpoints").deleteMany({ thread_id: threadRegex });
      await db
        .collection("checkpoint_blobs")
        .deleteMany({ thread_id: threadRegex });
      await db
        .collection("checkpoint_writes")
        .deleteMany({ thread_id: threadRegex });
    } catch (e) {
      // Non-blocking
    }

    return res.status(200).json({
      success: true,
      message: "All Agents and their chat histories deleted successfully",
      deleteCount: result.deletedCount,
      deletedChatMessagesCount: chatDeleteResult.deletedCount,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error While Deleting All Agents`,
      error: error.message,
    });
  }
};

export const deleteAgentById = async (req, res) => {
  try {
    const userId = req.user?._id;
    const agentId = req.params.id;

    if (!isValidAgentId(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agent Id",
      });
    }

    const agent = await Agent.findOne({ _id: agentId, userId: userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: `Agent With Id : ${agentId}, not Found`,
      });
    }

    // 1. Delete the agent document
    await Agent.deleteOne({ _id: agentId, userId: userId });

    // 2. Cascade delete all chat messages belonging to this agent
    const chatDeleteResult = await ChatMessage.deleteMany({
      agentId: agentId,
      userId: userId,
    });

    // 3. Clear langgraph checkpoint threads starting with `${userId}_${agentId}_`
    try {
      const db = client.db("langraph");
      const threadRegex = new RegExp(`^${userId}_${agentId}_`);
      await db.collection("checkpoints").deleteMany({ thread_id: threadRegex });
      await db
        .collection("checkpoint_blobs")
        .deleteMany({ thread_id: threadRegex });
      await db
        .collection("checkpoint_writes")
        .deleteMany({ thread_id: threadRegex });
    } catch (e) {
      // Non-blocking
    }

    return res.status(200).json({
      success: true,
      message: `Agent With AgentId: ${agentId} and all associated chat messages deleted successfully`,
      deletedChatMessagesCount: chatDeleteResult.deletedCount,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error While Deleting Agent By AgentId`,
      error: error.message,
    });
  }
};

export const updatedAgentById = async (req, res) => {
  try {
    const userId = req.user._id;
    const agentId = req.params.id;
    const { description, instructions, tools } = req.body;

    const agent = await Agent.findOne({ _id: agentId, userId: userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: `Agent With Id : ${agentId}, not Found`,
      });
    }

    if (description !== undefined) agent.description = description.trim();
    if (instructions !== undefined) agent.instructions = instructions.trim();
    if (tools !== undefined) agent.tools = tools.map((tool) => tool.trim());
    await agent.save();

    return res.status(200).json({
      success: true,
      message: "Agent Updated Successfully",
      updatedAgent: agent,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error While Editing Exist Agent.`,
      error: error.message,
    });
  }
};

export const toggleAgentIsActive = async (req, res) => {
  try {
    const userId = req.user._id;
    const agentId = req.params.id;

    if (!isValidAgentId(agentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agent Id",
      });
    }

    const agent = await Agent.findOne({ _id: agentId, userId: userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: `Agent With Id : ${agentId}, not Found`,
      });
    }

    agent.isActive = agent.isActive !== false ? false : true;
    await agent.save();

    return res.status(200).json({
      success: true,
      message: ` Active Status for Agent With AgentId: ${agentId}, is Changed from ${!agent.isActive} to ${agent.isActive} `,
      agentActiveStatus: agent.isActive,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error While Changing Agents Active Status`,
      error: error.message,
    });
  }
};
