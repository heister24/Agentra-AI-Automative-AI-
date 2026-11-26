import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Mail,
  Bot,
  ArrowRight,
  Inbox,
  Maximize2,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/features/notification";

// Formatter for relative timestamps
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const sec = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load notifications from API
  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    const interval = setInterval(fetchList, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  // Delete single notification
  const handleDelete = async (id, isRead, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Clear all notifications
  const handleClearAll = async (e) => {
    e.stopPropagation();
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  // Handle clicking notification item (marks read & optionally navigates)
  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Error marking read:", err);
      }
    }

    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  // Compact type icon
  const renderIcon = (type, isRead) => {
    switch (type) {
      case "digest":
        return (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              !isRead
                ? "bg-[#262216] border border-[#FFC93C]/40 text-[#FFC93C]"
                : "bg-[#1E1F24] border border-[#2B2D31] text-[#FFC93C]/70"
            }`}
          >
            <Mail className="w-4 h-4 stroke-[1.8]" />
          </div>
        );
      case "agent":
        return (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              !isRead
                ? "bg-[#1A2234] border border-blue-500/40 text-blue-400"
                : "bg-[#1E1F24] border border-[#2B2D31] text-blue-400/70"
            }`}
          >
            <Bot className="w-4 h-4 stroke-[1.8]" />
          </div>
        );
      default:
        return (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              !isRead
                ? "bg-[#232428] border border-white/20 text-white"
                : "bg-[#1E1F24] border border-[#2B2D31] text-[#949BA4]"
            }`}
          >
            <Bell className="w-4 h-4 stroke-[1.8]" />
          </div>
        );
    }
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchList();
        }}
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isOpen
            ? "bg-[#232428] border-[#FFC93C]/50 text-white shadow-[0_0_15px_rgba(255,201,60,0.2)]"
            : "bg-[#1E1F24]/80 hover:bg-[#25272E] border-[#2B2D31] text-[#949BA4] hover:text-white hover:border-white/20"
        }`}
        title="Notifications"
      >
        <Bell className="w-4 h-4 stroke-[2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC93C] text-black font-bold text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(255,201,60,0.4)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Spacious 560px Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 md:left-full md:top-0 md:mt-0 md:ml-4 md:right-auto w-[calc(100vw-2rem)] max-w-[560px] sm:w-[560px] rounded-2xl bg-[#16171B] border border-[#2B2D31] shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-50 overflow-hidden flex flex-col backdrop-blur-2xl">
          {/* Header Bar */}
          <div className="px-5 py-3 border-b border-[#2B2D31]/80 bg-[#1A1B20]/95 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Notifications
              </h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFC93C]/10 text-[#FFC93C] border border-[#FFC93C]/20">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="text-xs text-[#949BA4] font-mono">
                  ({notifications.length})
                </span>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#949BA4] hover:text-white hover:bg-white/[0.06] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#FFC93C]" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-lg text-[#949BA4] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#949BA4] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Open full page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Compact-Height Notification Cards (Min height set for at least 5 notifications) */}
          <div className="min-h-[380px] max-h-[480px] overflow-y-auto p-3 space-y-2 flex flex-col">
            {loading && notifications.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-[#949BA4]">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 py-12 px-6">
                <div className="w-11 h-11 rounded-xl bg-[#1E1F24] border border-[#2B2D31] flex items-center justify-center text-[#949BA4] mb-1">
                  <Inbox className="w-5 h-5 opacity-50" />
                </div>
                <p className="text-sm font-semibold text-white">All caught up!</p>
                <p className="text-xs text-[#949BA4] max-w-[260px]">
                  No notifications right now. Alerts from briefings and agents will arrive here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className={`px-3.5 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer group flex items-center gap-3 relative ${
                    item.isRead
                      ? "bg-[#1E1F24]/40 hover:bg-[#1E1F24] border-[#2B2D31]/60 hover:border-white/10"
                      : "bg-[#1E1F24] hover:bg-[#232428] border-[#FFC93C]/35 hover:border-[#FFC93C]/60 shadow-sm"
                  }`}
                >
                  {/* Compact Type Icon */}
                  {renderIcon(item.type, item.isRead)}

                  {/* 2-Row Compact Content Area */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Tag + Title + Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded tracking-wider border shrink-0 ${
                            item.type === "digest"
                              ? "bg-[#FFC93C]/10 text-[#FFC93C] border-[#FFC93C]/30"
                              : item.type === "agent"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-white/5 text-[#949BA4] border-white/10"
                          }`}
                        >
                          {item.type || "system"}
                        </span>
                        <h4
                          className={`text-xs sm:text-sm truncate ${
                            item.isRead
                              ? "font-medium text-[#D9DADC]"
                              : "font-semibold text-white"
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>

                      <span className="text-[11px] text-[#949BA4] font-mono shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    {/* Row 2: Message preview + Inline Action */}
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-[#949BA4] truncate">
                        {item.message}
                      </p>
                      {item.link && (
                        <span className="text-[11px] font-semibold text-[#FFC93C] hover:underline shrink-0 flex items-center gap-0.5">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover Quick Dismiss */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item._id, item.isRead, e)}
                    className="p-1 rounded-md text-[#949BA4] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
