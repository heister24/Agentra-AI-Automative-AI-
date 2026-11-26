import api from "@/configs/api";

// 1. Fetch all notifications & unread count
export const getNotifications = async () => {
  try {
    const response = await api.get("/notification/getAll");
    return response.data; // { success: true, notifications: [], unreadCount: 0 }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// 2. Mark single notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notification/read/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("Error marking notification read:", error);
    throw error;
  }
};

// 3. Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch("/notification/markAllRead");
    return response.data;
  } catch (error) {
    console.error("Error marking all read:", error);
    throw error;
  }
};

// 4. Delete single notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notification/delete/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

// 5. Clear all notifications
export const clearAllNotifications = async () => {
  try {
    const response = await api.delete("/notification/deleteAll");
    return response.data;
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw error;
  }
};
