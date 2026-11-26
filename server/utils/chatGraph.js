import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import { allTools } from "../tools/index.js";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

// 1. Primary High-Speed LLM: Groq Qwen 27B (~300ms sub-second response, high token limits)
const groqLlm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "qwen/qwen3.8-27b",
  temperature: 0.2,
  maxRetries: 1, // Don't delay on retries; fail fast to next tier
});
const groqWithTools = groqLlm.bindTools(allTools);

// 2. Secondary Groq LLM (Separate token pool on Groq): GPT-OSS 20B
const groqSecondaryLlm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  temperature: 0.2,
  maxRetries: 1,
});
const groqSecondaryWithTools = groqSecondaryLlm.bindTools(allTools);

// 3. High-Capacity Google Gemini LLM: Gemini 3.1 Flash Lite (High quota, NO 20/day limit, ~1.1s response)
const geminiLlm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-3.1-flash-lite",
  temperature: 0.2,
  maxRetries: 2,
});
const geminiWithTools = geminiLlm.bindTools(allTools);

// Intelligent Multi-Tier Auto-Fallback Invoker:
// Tier 1: Groq Qwen 27B (ultra-fast sub-second)
// Tier 2: Groq GPT-OSS 20B (fallback if Qwen hits rate limit)
// Tier 3: Google Gemini 3.1 Flash Lite (unlimited/high daily quota fallback)
const invokeWithFallback = async (messages) => {
  // Try Tier 1: Groq Qwen 27B
  if (process.env.GROQ_API_KEY) {
    try {
      return await groqWithTools.invoke(messages);
    } catch (err1) {
      console.warn(
        `[LLM Fallback] Groq Qwen 27B failed (${err1.message}). Trying Tier 2 (Groq GPT-OSS 20B)...`,
      );
      try {
        return await groqSecondaryWithTools.invoke(messages);
      } catch (err2) {
        console.warn(
          `[LLM Fallback] Groq GPT-OSS 20B also failed (${err2.message}). Switching to Google Gemini 3.1 Flash Lite...`,
        );
      }
    }
  }

  // Tier 3: High-Capacity Gemini Backup (No 20-req/day limit)
  return await geminiWithTools.invoke(messages);
};

export const client = new MongoClient(process.env.MONGO_URI);
const checkpointer = new MongoDBSaver({ client, dbName: "langraph" });

const chatNode = async (state) => {
  // 1. Get the latest system message
  const systemMsg = state.messages.findLast(
    (m) =>
      m._getType?.() === "system" || m.constructor?.name === "SystemMessage",
  );

  // 2. Keep recent non-system messages
  const nonSystemMsgs = state.messages.filter(
    (m) =>
      m._getType?.() !== "system" && m.constructor?.name !== "SystemMessage",
  );

  // Optimize token window: Keep last 6 messages to stay well under TPM rate limits
  // and ensure message slice always starts with a user/human turn for Gemini
  let recentMsgs = nonSystemMsgs.slice(-8);
  const firstHumanIdx = recentMsgs.findIndex(
    (m) => m._getType?.() === "human" || m.constructor?.name === "HumanMessage",
  );
  if (firstHumanIdx !== -1) {
    recentMsgs = recentMsgs.slice(firstHumanIdx);
  } else if (recentMsgs.length > 0) {
    recentMsgs = nonSystemMsgs.slice(-2);
  }

  const messagesForLlm = systemMsg ? [systemMsg, ...recentMsgs] : recentMsgs;

  const response = await invokeWithFallback(messagesForLlm);

  return {
    messages: [response],
  };
};

const toolNode = new ToolNode(allTools);

const workFlow = new StateGraph(MessagesAnnotation);
//Nodes
workFlow.addNode("chatNode", chatNode);
workFlow.addNode("tools", toolNode);

//Edges
workFlow.addEdge(START, "chatNode"); //Start

//Conditional Routing BTW Tools (toolsCondition automatically routes to 'tools' or END)
workFlow.addConditionalEdges("chatNode", toolsCondition);

// Tool result milne ke baad wapas chatNode par jao taaki LLM final answer generate kare
workFlow.addEdge("tools", "chatNode");

const Graph = workFlow.compile({ checkpointer });

export default Graph;
