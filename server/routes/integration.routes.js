import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  disconnectIntegration,
  getGoogleAuthUrl,
  getIntegrationsStatus,
  handleGoogleCallback,
} from "../controllers/integration.controller.js";

const integrationRouter = express.Router();

integrationRouter.get("/google/url", authMiddleware, getGoogleAuthUrl);
integrationRouter.get("/google/callback", handleGoogleCallback);

integrationRouter.get("/status", authMiddleware, getIntegrationsStatus);
integrationRouter.get("/google/status", authMiddleware, getIntegrationsStatus);

integrationRouter.post("/disconnect", authMiddleware, disconnectIntegration);
integrationRouter.post("/google/disconnect", authMiddleware, disconnectIntegration);

export default integrationRouter;
