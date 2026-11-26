import api from "@/configs/api";

const login = async (token) => {
  try {
    const response = await api.post("/auth/login", { token });
    return response.data;
  } catch (error) {
    console.error("Login Error:", error.message);
    throw error;
  }
};

export default login;
