import api from "@/configs/api";

// Fetch user preferences
export const getUserPreferences = async () => {
  try {
    const response = await api.get("/preferences/getPreferences");
    return response.data;
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
};

// Update user preferences
export const updateUserPreferences = async (preferencesData) => {
  try {
    const response = await api.put("/preferences/updatePreferences", preferencesData);
    return response.data;
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};

// Fetch user plan & token usage (Feature 5.1 & 5.2)
export const getUserUsage = async () => {
  try {
    const response = await api.get("/preferences/getUsage");
    return response.data;
  } catch (error) {
    console.error("Error fetching user usage:", error);
    throw error;
  }
};
