import api from "@/configs/api";

export const createNewAgent = async (payload) => {
  try {
    const response = await api.post("/agent/createNewAgent", payload);
    return response;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

export const getAllAgents = async () => {
  try {
    const response = await api.get("/agent/getAllAgents");
    return response?.data;
  } catch (error) {
    console.error(error);
  }
};

export const getAgentById = async (id) => {
  try {
    const response = await api.get(`/agent/getAgentById/${id}`);
    return response?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteAllAgents = async () => {
  try {
    const response = await api.delete("/agent/deleteAllAgents");
    return response?.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteAgentById = async (id) => {
  try {
    const response = await api.delete(`/agent/deleteAgentById/${id}`);
    return response?.data;
  } catch (error) {
    console.error(error);
  }
};

export const updateAgent = async (id, payload) => {
  try {
    const response = await api.post(`/agent/updateAgentById/${id}`, payload);
    return response?.data;
  } catch (error) {
    console.error(error);
  }
};

export const updateActiveStatus = async (id) => {
  try {
    const response = await api.get(`/agent/updateActiveStatus/${id}`);
    return response?.data;
  } catch (error) {
    console.error(error);
  }
};
