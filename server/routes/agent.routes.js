import express from "express";
import {
  createNewAgent,
  deleteAgentById,
  deleteAllAgents,
  getAgentById,
  getAllAgents,
  toggleAgentIsActive,
  updatedAgentById,
} from "../controllers/agent.controller.js";

const agentRouter = express.Router();

agentRouter.post("/createNewAgent", createNewAgent);
agentRouter.get("/getAllAgents", getAllAgents);
agentRouter.get("/getAgentById/:id", getAgentById);
agentRouter.delete("/deleteAllAgents", deleteAllAgents);
agentRouter.delete("/deleteAgentById/:id", deleteAgentById);
agentRouter.post("/updateAgentById/:id", updatedAgentById);
agentRouter.get("/updateActiveStatus/:id", toggleAgentIsActive);

export default agentRouter;
