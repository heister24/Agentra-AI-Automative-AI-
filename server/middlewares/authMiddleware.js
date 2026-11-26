import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwtToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token Not Found in Cookies" });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    // Verify session still exists (not revoked remotely)
    if (decodedToken.sessionId) {
      const activeSession = user.sessions?.find(
        (s) => s.sessionId === decodedToken.sessionId,
      );
      if (!activeSession) {
        res.clearCookie("jwtToken", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Session has been revoked or logged out remotely.",
        });
      }
    }

    req.user = user;
    req.sessionId = decodedToken.sessionId || null;
    next();
  } catch (error) {
    console.error(`Error At Auth Middleware : ${error.message}`);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized or Invalid Token" });
  }
};

export default authMiddleware;
