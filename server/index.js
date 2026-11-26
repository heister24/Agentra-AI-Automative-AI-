import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./configs/connectDB.js";
import authRouter from "./routes/auth.routes.js";
import agentRouter from "./routes/agent.routes.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import chatRouter from "./routes/chat.routes.js";
import integrationRouter from "./routes/integration.routes.js";
import { initDigestCron } from "./cron/digest.cron.js";
import { runUserMorningDigest } from "./services/digest.service.js";
import userRouter from "./routes/user.routes.js";
import notificationRouter from "./routes/notifications.routes.js";

const app = express();

const port = process.env.PORT || 8000;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.get("/api/health", (req, res) => {
  res.json({
    Success: true,
    Message: `Server Working Fine at Port : ${port}`,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/agent", authMiddleware, agentRouter);
app.use("/api/chat", authMiddleware, chatRouter);
app.use("/api/integration", integrationRouter);
app.use("/api/preferences", authMiddleware, userRouter);
app.use("/api/notification", authMiddleware, notificationRouter);

// Manual trigger for testing/generating Morning Digest on-demand
app.post("/api/digest/trigger", authMiddleware, async (req, res) => {
  try {
    const success = await runUserMorningDigest(req.user._id);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Google account not connected or no active integration found.",
      });
    }
    return res.status(200).json({
      success: true,
      message:
        "Morning Executive Briefing generated and dispatched to your email!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server Running On Port : ${port}`);
  initDigestCron();
});
