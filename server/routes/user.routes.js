import express from "express";
import {
  getUserPreferences,
  updateUserPreferences,
  getUserUsage,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/getPreferences", getUserPreferences);
userRouter.put("/updatePreferences", updateUserPreferences);
userRouter.get("/getUsage", getUserUsage);
userRouter.get("/usage", getUserUsage);

export default userRouter;
