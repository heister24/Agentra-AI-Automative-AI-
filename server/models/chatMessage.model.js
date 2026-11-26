import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    toolId: {
      type: String,
      required: true,
      trim: true,
    },
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

chatMessageSchema.index({ userId: 1, agentId: 1, toolId: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatModel", chatMessageSchema);
export default ChatMessage;
