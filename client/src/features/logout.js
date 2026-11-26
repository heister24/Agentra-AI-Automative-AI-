import api from "@/configs/api";

const logout = async () => {
  try {
    const response = await api.get("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout Error:", error.message);
    throw error;
  }
};

export default logout;
