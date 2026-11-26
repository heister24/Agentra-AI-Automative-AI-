import express from "express";
import {
  deleteAllNotifications,
  deleteNotificationById,
  getNotifications,
  markAllRead,
  markAsRead,
} from "../controllers/notification.controller.js";

const notificationRouter = express.Router();

notificationRouter.get("/getAll", getNotifications);
notificationRouter.patch("/read/:id", markAsRead);
notificationRouter.patch("/markAllRead", markAllRead);
notificationRouter.delete("/delete/:id", deleteNotificationById);
notificationRouter.delete("/deleteAll", deleteAllNotifications);

export default notificationRouter;
