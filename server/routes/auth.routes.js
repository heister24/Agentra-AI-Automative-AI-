import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  getAllActiveSessions,
  revokeSession,
  logoutAllOtherSessions,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.get("/getMe", authMiddleware, getCurrentUser);
authRouter.get("/logout", authMiddleware, logout);

// Multi-Device & Session Management (Feature 6.1)
authRouter.get("/sessions", authMiddleware, getAllActiveSessions);
authRouter.delete("/sessions/:sessionId", authMiddleware, revokeSession);
authRouter.post("/sessions/logoutOthers", authMiddleware, logoutAllOtherSessions);

export default authRouter;
