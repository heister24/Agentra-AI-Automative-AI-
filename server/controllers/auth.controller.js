import { getAuth } from "firebase-admin/auth";
import app from "../configs/firebase.js";
import User from "../models/user.model.js";
import generateJWTToken from "../configs/generateJWTToken.js";
import crypto from "crypto";

const parseDeviceInfo = (req) => {
  const ua = req.headers["user-agent"] || "";
  let browser = "Chrome";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Microsoft Edge";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "Windows";
  if (ua.includes("Windows NT 10.0")) os = "Windows 10/11";
  else if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  let deviceType = "desktop";
  if (/mobile|iphone|android/i.test(ua)) deviceType = "mobile";
  else if (/ipad|tablet/i.test(ua)) deviceType = "tablet";

  let ip =
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
  if (ip.includes(",")) ip = ip.split(",")[0].trim();
  if (ip === "::1" || ip === "::ffff:127.0.0.1") ip = "127.0.0.1";

  return { browser, os, deviceType, ipAddress: ip };
};

export const login = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token Missing" });
    }

    const decodedToken = await getAuth(app).verifyIdToken(token);

    const user = await User.findOneAndUpdate(
      { firebaseUID: decodedToken.uid },
      {
        $set: {
          name: decodedToken?.name,
          email: decodedToken?.email,
          profilePicture: decodedToken?.picture,
        },
        $setOnInsert: {
          firebaseUID: decodedToken?.uid,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    const sessionId = crypto.randomUUID();
    const deviceInfo = parseDeviceInfo(req);

    await User.findByIdAndUpdate(user._id, {
      $push: {
        sessions: {
          $each: [
            {
              sessionId,
              ...deviceInfo,
              lastActive: new Date(),
              createdAt: new Date(),
            },
          ],
          $slice: -10,
        },
      },
    });

    const jwtToken = generateJWTToken(user._id, sessionId);

    res.cookie("jwtToken", jwtToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(201).json({
      success: true,
      message: "User LoggedIn Successfully",
      user: user,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error At Login",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user?._id && req.sessionId) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { sessions: { sessionId: req.sessionId } },
      });
    }

    res.clearCookie("jwtToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(`Error While Logout : ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error at Logout",
      error: error.message,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userData = req.user;
    // console.log(userData);

    return res.status(200).json({
      success: true,
      message: "User Data Fetched Successfully",
      user: userData,
    });
  } catch (error) {
    console.error(`Error While getCurrentUser : ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error at getCurrentUser",
      error: error.message,
    });
  }
};

export const getAllActiveSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    const currentSessionId = req.sessionId;
    const formattedSessions = (user.sessions || [])
      .map((s) => ({
        sessionId: s.sessionId,
        browser: s.browser,
        os: s.os,
        deviceType: s.deviceType,
        ipAddress: s.ipAddress,
        lastActive: s.lastActive,
        createdAt: s.createdAt,
        isCurrent: s.sessionId === currentSessionId,
      }))
      .sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
    return res.status(200).json({ success: true, sessions: formattedSessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        sessions: { sessionId },
      },
    });
    return res
      .status(200)
      .json({ success: true, message: "Session revoked successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutAllOtherSessions = async (req, res) => {
  try {
    const currentSessionId = req.sessionId;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        sessions: { sessionId: { $ne: currentSessionId } },
      },
    });
    return res
      .status(200)
      .json({ success: true, message: "Logged out from all other devices" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
