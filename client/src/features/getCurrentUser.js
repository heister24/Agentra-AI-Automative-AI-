import api from "@/configs/api";

const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/getMe");
    return response.data;
  } catch (error) {
    console.error("getCurrentUser Error:", error.message);
    throw error;
  }
};

export default getCurrentUser;
