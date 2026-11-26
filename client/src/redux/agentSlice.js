import { getAllAgents } from "@/features/agent";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchAgents = createAsyncThunk(
  "agent/fetchAgents",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllAgents();
      return response?.all_agents || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch agents");
    }
  },
);

const agentSlice = createSlice({
  name: "agent",
  initialState: {
    agents: [],
    selectedAgentId: null,
    loading: false,
    isFetched: false,
    error: null,
  },
  reducers: {
    // Manually set or update full list
    setAgents: (state, action) => {
      state.agents = action.payload;
      state.loading = false;
      state.isFetched = true;
      if (!state.selectedAgentId && action.payload.length > 0) {
        state.selectedAgentId = action.payload[0]._id;
      }
    },
    // Switch active agent across the entire app
    setSelectedAgentId: (state, action) => {
      state.selectedAgentId = action.payload;
    },
    // Instant add when a new agent is created
    addAgent: (state, action) => {
      state.agents.unshift(action.payload);
      state.selectedAgentId = action.payload._id;
    },
    // Instant update agent details
    updateAgentInList: (state, action) => {
      const updated = action.payload;
      const index = state.agents.find((a) => a._id === updated._id);
      if (index !== -1) {
        state.agents[index] = { ...state.agents[index], ...updated };
      }
    },
    // Instant toggle active status
    toggleAgentStatus: (state, action) => {
      const agentId = action.payload;
      const agent = state.agents.find((a) => a._id === agentId);
      if (agent) {
        agent.isActive = !agent.isActive;
      }
    },
    // Instant delete agent
    removeAgentById: (state, action) => {
      const agentId = action.payload;
      state.agents = state.agents.filter((a) => a._id != agentId);
      if (state.selectedAgentId === agentId) {
        state.selectedAgentId = state.agents[0]?._id || null;
      }
    },
    // Instant clear all agents
    clearAllAgents: (state) => {
      state.agents = [];
      state.selectedAgentId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.isFetched = true;
        state.agents = action.payload;
        if (!state.selectedAgentId && action.payload.length > 0) {
          state.selectedAgentId = action.payload[0]._id;
        }
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setAgents,
  setSelectedAgentId,
  clearAllAgents,
  addAgent,
  updateAgentInList,
  toggleAgentStatus,
  removeAgentById,
} = agentSlice.actions;
export default agentSlice.reducer;
