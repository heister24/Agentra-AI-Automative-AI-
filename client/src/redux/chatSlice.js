import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getChatHistory } from "@/features/chat";

// Async thunk to fetch chat history with in-memory caching
export const fetchThreadHistory = createAsyncThunk(
  "chat/fetchThreadHistory",
  async ({ agentId, toolId }, { getState, rejectWithValue }) => {
    const threadKey = `${agentId}_${toolId}`;
    const state = getState().chat;

    // Agar already memory cache me hai, to backend call nahi karenge (Instant 0ms Load!)
    if (state.chatCache[threadKey]) {
      return { threadKey, messages: state.chatCache[threadKey], fromCache: true };
    }

    try {
      const response = await getChatHistory(agentId, toolId);
      return { threadKey, messages: response?.history || [], fromCache: false };
    } catch (error) {
      return rejectWithValue({ threadKey, error: error.message });
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    selectedTool: null,
    chatCache: {}, // { "agentId_toolId": [messages] }
    loadingHistory: false,
    sending: false,
  },
  reducers: {
    // Active tool channel switch karna (e.g. "instagram", "gmail")
    setSelectedTool: (state, action) => {
      state.selectedTool = action.payload;
    },
    // Instant message append (User ya AI message ke liye)
    addMessageToThread: (state, action) => {
      const { threadKey, message } = action.payload;
      if (!state.chatCache[threadKey]) {
        state.chatCache[threadKey] = [];
      }
      state.chatCache[threadKey].push(message);
    },
    // Instant clear history for single tool
    clearThreadCache: (state, action) => {
      const threadKey = action.payload;
      state.chatCache[threadKey] = [];
    },
    // Instant clear all tool chats for a deleted agent
    clearAgentChatCache: (state, action) => {
      const agentId = action.payload;
      const prefix = `${agentId}_`;
      Object.keys(state.chatCache).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete state.chatCache[key];
        }
      });
    },
    // Clear all chat cache
    clearAllChatCache: (state) => {
      state.chatCache = {};
    },
    setSending: (state, action) => {
      state.sending = action.payload;
    },
    setLoadingHistory: (state, action) => {
      state.loadingHistory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreadHistory.pending, (state, action) => {
        const threadKey = `${action.meta.arg.agentId}_${action.meta.arg.toolId}`;
        // Agar pehle se cached nahi hai tabhi loading spinner dikhayenge
        if (!state.chatCache[threadKey]) {
          state.loadingHistory = true;
        }
      })
      .addCase(fetchThreadHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        const { threadKey, messages } = action.payload;
        state.chatCache[threadKey] = messages;
      })
      .addCase(fetchThreadHistory.rejected, (state) => {
        state.loadingHistory = false;
      });
  },
});

export const {
  setSelectedTool,
  addMessageToThread,
  clearThreadCache,
  clearAgentChatCache,
  clearAllChatCache,
  setSending,
  setLoadingHistory,
} = chatSlice.actions;

export default chatSlice.reducer;

