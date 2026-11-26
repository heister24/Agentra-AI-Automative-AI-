import User from "../models/user.model.js";
import Agent from "../models/agent.model.js";

export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserID missing",
      });
    }

    const user = await User.findOne({ _id: userId }).select("preferences");
    return res.status(200).json({
      success: true,
      message: "Preferences Fetched.",
      preferences: user?.preferences || {},
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user preferences",
      error: error.message,
    });
  }
};

export const updateUserPreferences = async (req, res) => {
  try {
    const {
      customInstructions,
      defaultModel,
      defaultAgentId,
      timezone,
      digest,
    } = req.body;
    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserID missing",
      });
    }
    const user = await User.findOne({ _id: userId });

    if (customInstructions !== undefined) {
      user.preferences.customInstructions = customInstructions;
    }
    if (defaultModel !== undefined) {
      user.preferences.defaultModel = defaultModel;
    }
    if (defaultAgentId !== undefined) {
      user.preferences.defaultAgentId = defaultAgentId;
    }
    if (timezone !== undefined) {
      user.preferences.timezone = timezone;
    }

    if (digest) {
      user.preferences.digest = {
        enabled: digest.enabled ?? user.preferences.digest?.enabled ?? true,
        frequency:
          digest.frequency ?? user.preferences.digest?.frequency ?? "daily",
        deliveryTime:
          digest.deliveryTime ??
          user.preferences.digest?.deliveryTime ??
          "09:00",
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Preferences updated Successfully",
      preferences: user?.preferences || {},
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update the preferences",
      error: error.message,
    });
  }
};

// Fetch user's token usage, tier limits, and agent slots (Feature 5.1 & 5.2)
export const getUserUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserID missing",
      });
    }

    const user = await User.findById(userId).select("usage");
    const userUsage = user?.usage || {};
    const tier = userUsage.tier || "free";
    const dailyLimit =
      userUsage.dailyTokensLimit || (tier === "pro" ? 500000 : 50000);

    // Timezone-aware date check
    const userTz = user?.preferences?.timezone || "Asia/Kolkata";
    let todayStr;
    try {
      todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: userTz,
      }).format(new Date());
    } catch (e) {
      todayStr = new Date().toISOString().slice(0, 10);
    }

    const lastReset = userUsage.lastResetDate
      ? String(userUsage.lastResetDate).slice(0, 10)
      : "";
    let dailyUsed = userUsage.dailyTokensUsed || 0;

    // Auto reset if new day in user timezone
    if (lastReset !== todayStr) {
      dailyUsed = 0;
      await User.findByIdAndUpdate(userId, {
        $set: {
          "usage.dailyTokensUsed": 0,
          "usage.lastResetDate": todayStr,
        },
      });
    }

    // Active Agent count
    const agentCount = await Agent.countDocuments({ userId });
    const maxAgents = tier === "pro" ? 50 : 3;
    const percentage = Math.min(
      100,
      Math.round((dailyUsed / dailyLimit) * 100 * 10) / 10,
    );

    return res.status(200).json({
      success: true,
      usage: {
        tier,
        dailyTokensUsed: dailyUsed,
        dailyTokensLimit: dailyLimit,
        remainingTokens: Math.max(0, dailyLimit - dailyUsed),
        percentage,
        agentsCount: agentCount,
        maxAgents,
        timezone: userTz,
        lastResetDate: todayStr,
        totalTokensLifetime: userUsage.totalTokensLifetime || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching user usage:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch usage metrics",
      error: error.message,
    });
  }
};
