import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Mail,
  Bot,
  Check,
  CheckCheck,
  Trash2,
  ArrowRight,
  Inbox,
  Filter,
  ExternalLink,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/features/notification";

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
    year: "numeric",
  });
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'digest' | 'agent'

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
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation?.();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDelete = async (id, isRead, e) => {
    e?.stopPropagation?.();
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

  const handleClearAll = async () => {
    if (!notifications.length) return;
    const confirmed = window.confirm(
      "Are you sure you want to clear all notifications? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const handleCardClick = (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item._id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  // Filter list
  const filteredList = notifications.filter((item) => {
    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "digest") return item.type === "digest";
    if (activeTab === "agent") return item.type === "agent";
    return true;
  });

  const digestCount = notifications.filter((n) => n.type === "digest").length;
  const agentCount = notifications.filter((n) => n.type === "agent").length;

  const renderIcon = (type, isRead) => {
    switch (type) {
      case "digest":
        return (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              !isRead
                ? "bg-[#262216] border border-[#FFC93C]/40 text-[#FFC93C] shadow-[0_0_15px_rgba(255,201,60,0.2)]"
                : "bg-[#1E1F24] border border-[#2B2D31] text-[#FFC93C]/70"
            }`}
          >
            <Mail className="w-5 h-5 stroke-[1.8]" />
          </div>
        );
      case "agent":
        return (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              !isRead
                ? "bg-[#1A2234] border border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                : "bg-[#1E1F24] border border-[#2B2D31] text-blue-400/70"
            }`}
          >
            <Bot className="w-5 h-5 stroke-[1.8]" />
          </div>
        );
      default:
        return (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              !isRead
                ? "bg-[#232428] border border-white/20 text-white shadow-sm"
                : "bg-[#1E1F24] border border-[#2B2D31] text-[#949BA4]"
            }`}
          >
            <Bell className="w-5 h-5 stroke-[1.8]" />
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#121316] text-white selection:bg-[#FFC93C] selection:text-black overflow-hidden">
      {/* Left Sidebar */}
      <Navbar />

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Pinned Top Header */}
        <header className="w-full border-b border-white/10 bg-[#121316]/95 backdrop-blur-xl shrink-0 z-20">
          <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#262216] border border-[#FFC93C]/30 flex items-center justify-center text-[#FFC93C] shrink-0 shadow-md">
                <Bell className="w-5 h-5 text-[#FFC93C]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#D9DADC] font-mono mb-0.5">
                  <Link to="/" className="hover:text-white transition-colors">
                    HOME
                  </Link>
                  <span className="text-[#383A40]">/</span>
                  <span className="text-[#FFC93C]">NOTIFICATIONS</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
                    Notifications Center
                  </h1>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFC93C]/10 text-[#FFC93C] border border-[#FFC93C]/30">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="h-9 px-4 bg-[#1E1F24] hover:bg-[#25272E] border border-[#2B2D31] text-[#D9DADC] hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCheck className="w-4 h-4 text-[#FFC93C]" />
                  <span className="hidden sm:inline">Mark all as read</span>
                  <span className="sm:hidden">Mark all</span>
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  type="button"
                  onClick={handleClearAll}
                  className="h-9 px-3.5 bg-[#1E1F24] hover:bg-red-500/10 border border-[#2B2D31] hover:border-red-500/30 text-[#949BA4] hover:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear all</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Filter Navigation Bar */}
        <div className="w-full border-b border-[#2B2D31]/60 bg-[#16171B]/50 shrink-0">
          <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-[#232428] text-white border border-[#383A40] shadow-sm"
                  : "text-[#949BA4] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              All Notifications ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "unread"
                  ? "bg-[#232428] text-[#FFC93C] border border-[#FFC93C]/40 shadow-sm font-semibold"
                  : "text-[#949BA4] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#FFC93C] text-black font-bold text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("digest")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "digest"
                  ? "bg-[#232428] text-white border border-[#383A40] shadow-sm"
                  : "text-[#949BA4] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Briefings ({digestCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("agent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "agent"
                  ? "bg-[#232428] text-white border border-[#383A40] shadow-sm"
                  : "text-[#949BA4] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Agents ({agentCount})
            </button>
          </div>
        </div>

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto space-y-3">
            {loading ? (
              <div className="py-20 text-center text-sm text-[#949BA4]">
                Loading notifications...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-20 px-4 rounded-2xl border border-white/5 bg-[#16171B]/60 flex flex-col items-center justify-center text-center gap-2.5">
                <div className="w-14 h-14 rounded-2xl bg-[#1E1F24] border border-[#2B2D31] flex items-center justify-center text-[#949BA4] mb-1">
                  <Inbox className="w-6 h-6 opacity-60" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {activeTab === "unread" ? "No unread alerts" : "No notifications found"}
                </h3>
                <p className="text-xs text-[#949BA4] max-w-sm leading-relaxed">
                  {activeTab === "unread"
                    ? "You're all caught up! Switch to 'All' to review earlier activity."
                    : "When your AI agents run workflows or executive morning digests are delivered, they will appear here."}
                </p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleCardClick(item)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer group flex items-start gap-4 sm:gap-5 relative ${
                    item.isRead
                      ? "bg-[#16171B]/70 hover:bg-[#1E1F24] border-[#2B2D31]/80 hover:border-white/20"
                      : "bg-[#1E1F24] hover:bg-[#232428] border-[#FFC93C]/40 hover:border-[#FFC93C]/70 shadow-[0_4px_25px_rgba(0,0,0,0.3)]"
                  }`}
                >
                  {/* Left Highlight Bar for Unread */}
                  {!item.isRead && (
                    <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-[#FFC93C] rounded-r-full shadow-[0_0_10px_rgba(255,201,60,0.6)]" />
                  )}

                  {/* Left Icon Container */}
                  {renderIcon(item.type, item.isRead)}

                  {/* Content Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded tracking-wider border ${
                            item.type === "digest"
                              ? "bg-[#FFC93C]/10 text-[#FFC93C] border-[#FFC93C]/30"
                              : item.type === "agent"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-white/5 text-[#949BA4] border-white/10"
                          }`}
                        >
                          {item.type || "system"}
                        </span>

                        <h3
                          className={`text-sm sm:text-base truncate ${
                            item.isRead
                              ? "font-medium text-[#D9DADC]"
                              : "font-semibold text-white"
                          }`}
                        >
                          {item.title}
                        </h3>
                      </div>

                      <span className="text-xs text-[#949BA4] font-mono shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#949BA4] leading-relaxed mt-2">
                      {item.message}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-3.5 flex items-center justify-between gap-3">
                      {item.link ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC93C] group-hover:text-[#ffe082] transition-colors">
                          <span>View activity</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ) : (
                        <span />
                      )}

                      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item._id, e)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#949BA4] hover:text-[#FFC93C] hover:bg-[#FFC93C]/10 transition-colors cursor-pointer flex items-center gap-1"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mark read</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item._id, item.isRead, e)}
                          className="p-1.5 rounded-lg text-[#949BA4] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
