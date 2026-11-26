import api from "@/configs/api";

// Fetch all active sessions for the current user
export const getActiveSessions = async () => {
  try {
    const response = await api.get("/auth/sessions");
    return response.data;
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    throw error;
  }
};

// Revoke a specific session
export const revokeSession = async (sessionId) => {
  try {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error revoking session ${sessionId}:`, error);
    throw error;
  }
};

// Logout all other sessions except the current one
export const logoutOtherSessions = async () => {
  try {
    const response = await api.post("/auth/sessions/logoutOthers");
    return response.data;
  } catch (error) {
    console.error("Error logging out other sessions:", error);
    throw error;
  }
};
