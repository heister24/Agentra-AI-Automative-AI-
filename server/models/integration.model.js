import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["gmail", "instagram"],
      required: true,
    },
    accountEmail: {
      type: String,
      required: true,
    },
    tokens: {
      accessToken: String,
      refreshToken: String,
      scope: String,
      tokenType: String,
      expiryDate: Number,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    lastDigestSentDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

integrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

const Integration = mongoose.model("Integration", integrationSchema);
export default Integration;
