import Notifications from "../models/notifications.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID Missing",
      });
    }

    const [notifications, unreadCount] = await Promise.all([
      Notifications.find({ userId: userId }).sort({ createdAt: -1 }).limit(30),
      Notifications.countDocuments({ userId, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// Read Message
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    const notificationId = req.params.id;

    const notification = await Notifications.findOneAndUpdate(
      {
        userId: userId,
        _id: notificationId,
      },
      {
        $set: {
          isRead: true,
        },
      },
      { returnDocument: "after" },
    );

    if (!notification) {
      return res.status(400).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification read:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// Mark all read
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notifications.updateMany(
      { userId, isRead: false },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "All Notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all read:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

// Delete Notifications by id
export const deleteNotificationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const deletedNotification = await Notifications.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      deletedNotification,
    });
  } catch (error) {
    console.error("Error deleting notification:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

//Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notifications.deleteMany({ userId });
    return res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("Error clearing notifications:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
      error: error.message,
    });
  }
};
