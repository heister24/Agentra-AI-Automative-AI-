import jwt from "jsonwebtoken";

const generateJWTToken = (userId, sessionId) => {
  return jwt.sign({ userId, sessionId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateJWTToken;
