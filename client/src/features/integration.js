import api from "@/configs/api";

/**
 * 1. Fetch current user's connected integrations
 */
export const getIntegrationsStatus = async () => {
  try {
    const response = await api.get("/integration/status");
    return response.data;
  } catch (error) {
    console.error("Error fetching integrations status:", error);
    throw error;
  }
};

/**
 * 2. Get Google OAuth Authorization URL
 */
export const getGoogleAuthUrl = async () => {
  try {
    const response = await api.get("/integration/google/url");
    return response.data;
  } catch (error) {
    console.error("Error getting Google Auth URL:", error);
    throw error;
  }
};

/**
 * 3. Disconnect an integration (e.g. 'gmail')
 */
export const disconnectIntegration = async (provider) => {
  try {
    const response = await api.post("/integration/disconnect", { provider });
    return response.data;
  } catch (error) {
    console.error(`Error disconnecting ${provider}:`, error);
    throw error;
  }
};

/**
 * 4. Manually trigger Morning Executive Briefing
 */
export const triggerMorningDigest = async () => {
  try {
    const response = await api.post("/digest/trigger");
    return response.data;
  } catch (error) {
    console.error("Error triggering morning digest:", error);
    throw error;
  }
};
