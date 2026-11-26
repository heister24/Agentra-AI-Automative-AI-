import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  { 
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      required: true,
      trim: true,
    },
    tools: [{ type: String, required: true, trim: true }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true },
);

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
