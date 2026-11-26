import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    preferences: {
      customInstructions: {
        type: String,
        default: "",
        trim: true,
      },
      defaultModel: {
        type: String,
        enum: [
          "qwen/qwen3.8-27b",
          "openai/gpt-oss-20b",
          "gemini-3.1-flash-lite",
        ],
        default: "qwen/qwen3.8-27b",
      },
      defaultAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent",
        default: null,
      },
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },
      digest: {
        enabled: {
          type: Boolean,
          default: true,
        },
        frequency: {
          type: String,
          enum: ["daily", "weekly", "off"],
          default: "daily",
        },
        deliveryTime: {
          type: String,
          default: "7:00",
        },
      },
    },
    usage: {
      tier: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
      },
      dailyTokensUsed: {
        type: Number,
        default: 0,
      },
      dailyTokensLimit: {
        type: Number,
        default: 50000,
      },
      lastResetDate: {
        type: String,
        default: () => new Date().toISOString().slice(0, 10),
      },
      totalTokensLifetime: {
        type: Number,
        default: 0,
      },
    },
    sessions: [
      {
        sessionId: { type: String, required: true },
        browser: { type: String, default: "Chrome" },
        os: { type: String, default: "Windows" },
        deviceType: {
          type: String,
          enum: ["desktop", "mobile", "tablet"],
          default: "desktop",
        },
        ipAddress: { type: String, default: "127.0.0.1" },
        lastActive: {
          type: Date,
          default: Date.now,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
