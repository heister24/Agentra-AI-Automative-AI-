import api from "@/configs/api";

// 1. Send message to a specific tool under an agent
export const sendChatMessage = async ({ agentId, toolId, userPrompt }) => {
  try {
    const response = await api.post("/chat/send", {
      agentId,
      toolId,
      userPrompt,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

// 2. Fetch previous chat history for a specific tool under an agent
export const getChatHistory = async (agentId, toolId) => {
  try {
    const response = await api.get(`/chat/history/${agentId}/${toolId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// 3. Clear chat history for a specific tool under an agent
export const clearChatHistory = async (agentId, toolId) => {
  try {
    const response = await api.delete(`/chat/delete/${agentId}/${toolId}`);
    return response.data;
  } catch (error) {
    console.error("Error clearing chat history:", error);
    throw error;
  }
};
