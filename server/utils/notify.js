import Notifications from "../models/notifications.model.js";

export const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  link = null,
}) => {
  try {
    if (!userId || !title || !message) return null;

    const notification = await Notifications.create({
      userId,
      title,
      message,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

export default createNotification;
