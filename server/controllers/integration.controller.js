import { google } from "googleapis";
import Integration from "../models/integration.model.js";

// Google Configuration for Google O-Auth2
export const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL ||
      "http://localhost:8000/api/integration/google/callback",
  );
};

// Generate Google OAuth Consent Screen URL
export const getGoogleAuthUrl = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message:
          "Google OAuth credentials missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env",
      });
    }

    const oauth2Client = getGoogleOAuthClient();

    // Permissions needed to automate Gmail (Read, Send, Trash/Modify)
    const scopes = [
      // Permission for Gmail
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",

      // Permission for Google Calender
      "https://www.googleapis.com/auth/calendar.events", // Events create/edit/delete karne ke liye
      "https://www.googleapis.com/auth/calendar.readonly", // Schedule aur meetings read karne ke liye

      // Permission for Spreadsheet & Drive (File Delete/Manage)
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",

      // Permission for Docs
      "https://www.googleapis.com/auth/documents",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Ensures Google returns a refresh_token
      prompt: "consent",
      scope: scopes,
      state: req.user._id.toString(),
    });

    return res.status(200).json({
      success: true,
      url: authUrl,
    });
  } catch (error) {
    console.error("Get Auth URL Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Google authorization URL",
      error: error.message,
    });
  }
};

// Handle Google OAuth Callback
export const handleGoogleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const { code, state: userId, error } = req.query;

    // User clicked 'Cancel' or denied consent
    if (error) {
      (console.warn("Google OAuth Denied"), error);
      return res.redirect(
        `${clientUrl}/integration?status=error&message=${encodeURIComponent(
          "Access was denied by the user",
        )}`,
      );
    }

    if (!code || !userId) {
      return res.redirect(
        `${clientUrl}/integration?status=error&message=${encodeURIComponent(
          "Missing authorization code or state from google",
        )}`,
      );
    }

    // Exchange auth code for access_token & refresh_token
    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch Connected user's Google Email Address
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const accountEmail = userInfo.data.email || "Unknown";

    //Upsert Data in DB
    await Integration.findOneAndUpdate(
      { userId: userId, provider: "gmail" },
      {
        userId,
        provider: "gmail",
        accountEmail,
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          tokenType: tokens.token_type,
          expiryDate: tokens.expiry_date,
        },
        isConnected: true,
      },
      { upsert: true, new: true },
    );
    console.log(
      `✅ [Integration] Successfully connected Gmail for user: ${userId} (${accountEmail})`,
    );

    return res.redirect(
      `${clientUrl}/integration?status=connected&provider=gmail&email=${encodeURIComponent(accountEmail)}`,
    );
  } catch (error) {
    console.error("Google Callback Error:", error.message);
    return res.redirect(
      `${clientUrl}/integration?status=error&message=${encodeURIComponent(
        error.message,
      )}`,
    );
  }
};

// Get All Integrations Status for Logged-In User
export const getIntegrationsStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const integrations = await Integration.find({ userId });

    const status = {
      gmail: {
        isConnected: false,
        email: null,
      },
      instagram: {
        isConnected: false,
        email: null,
      },
    };

    for (const item of integrations) {
      if (item.isConnected) {
        status[item.provider] = {
          isConnected: true,
          email: item.accountEmail || null,
          updatedAt: item.updatedAt,
        };
      }
    }

    return res.status(200).json({
      success: true,
      integrations: status,
    });
  } catch (error) {
    console.error("Get Integrations Status Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch integrations status",
      error: error.message,
    });
  }
};

// Disconnect an Integration for Current User
export const disconnectIntegration = async (req, res) => {
  try {
    const userId = req.user._id;
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({
        success: false,
        message: "provider field is required (e.g. 'gmail')",
      });
    }

    await Integration.findOneAndUpdate(
      { userId: userId, provider: provider },
      { isConnected: false },
    );

    return res.status(200).json({
      success: true,
      message: `${provider} disconnected Successfully`,
    });
  } catch (error) {
    console.error("Disconnect Integration Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect integration",
      error: error.message,
    });
  }
};
