import { useState, useEffect } from "react";
import {
  Shield,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Trash2,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getActiveSessions,
  revokeSession,
  logoutOtherSessions,
} from "@/features/session";
import { motion, AnimatePresence } from "framer-motion";

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "Active recently";
  const sec = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (sec < 60) return "Active just now";
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

const SecuritySettings = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await getActiveSessions();
      if (res?.success) {
        setSessions(res.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setFeedback({
        type: "error",
        message: "Failed to load active sessions. Please refresh.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSingle = async (sessionId, deviceName) => {
    const confirmed = window.confirm(
      `Revoke access for "${deviceName}"? That device will be immediately logged out.`
    );
    if (!confirmed) return;

    try {
      setRevokingId(sessionId);
      const res = await revokeSession(sessionId);
      if (res?.success) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        setFeedback({
          type: "success",
          message: `Successfully logged out from ${deviceName}.`,
        });
      }
    } catch (err) {
      console.error("Failed to revoke session:", err);
      setFeedback({
        type: "error",
        message: "Failed to revoke session. Please try again.",
      });
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutOthers = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out from all other devices? Only your current browser session will stay active."
    );
    if (!confirmed) return;

    try {
      setRevokingAll(true);
      const res = await logoutOtherSessions();
      if (res?.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        setFeedback({
          type: "success",
          message: "Successfully logged out from all other devices.",
        });
      }
    } catch (err) {
      console.error("Failed to logout other devices:", err);
      setFeedback({
        type: "error",
        message: "Failed to log out other devices. Please try again.",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Tablet className="w-5 h-5" />;
      default:
        return <Laptop className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <section className="rounded-2xl border border-[#2B2D31]/80 bg-[#16171B] p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24252A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#262216] border border-[#FFC93C]/20 flex items-center justify-center text-[#FFC93C]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Active Sessions & Multi-Device Security
              </h2>
              <p className="text-[11px] text-[#949BA4] mt-0.5">
                Manage logged-in devices. Revoke access from browsers or devices you do not recognize.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {otherSessionsCount > 0 && (
              <button
                type="button"
                onClick={handleLogoutOthers}
                disabled={revokingAll}
                className="h-8 px-3 rounded-lg bg-[#262216] hover:bg-[#332b1a] border border-[#FFC93C]/30 text-[#FFC93C] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>
                  {revokingAll ? "Logging out..." : "Log Out Other Devices"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchSessions}
              disabled={loading}
              title="Refresh Sessions"
              className="p-2 rounded-lg bg-[#121316] hover:bg-[#1E1F24] border border-[#2B2D31] text-[#949BA4] hover:text-[#FFC93C] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Local Feedback Banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                feedback.type === "success"
                  ? "bg-[#282215]/80 border-[#FFC93C]/40 text-[#FFE082]"
                  : "bg-red-950/40 border-red-500/50 text-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#FFC93C] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-[11px] font-mono opacity-70 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sessions List */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#949BA4] font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#FFC93C]" />
              <span>Scanning authenticated sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#949BA4]">
              No active sessions recorded.
            </div>
          ) : (
            sessions.map((s) => {
              const isCurrent = s.isCurrent;
              const isRevoking = revokingId === s.sessionId;
              const deviceLabel = `${s.browser || "Web Browser"} on ${s.os || "Unknown Device"}`;

              return (
                <div
                  key={s.sessionId}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    isCurrent
                      ? "bg-[#18191E] border-[#383A40]/90 shadow-sm"
                      : "bg-[#121316] border-[#2B2D31] hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    {/* Device Icon Avatar */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? "bg-[#262216] border border-[#FFC93C]/40 text-[#FFC93C]"
                          : "bg-[#1E1F24] border border-[#2B2D31] text-[#949BA4]"
                      }`}
                    >
                      {getDeviceIcon(s.deviceType)}
                    </div>

                    {/* Device Meta */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white tracking-wide">
                          {deviceLabel}
                        </span>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono font-semibold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            This Device (Current Session)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-[#8E9297] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#949BA4]" />
                          {s.ipAddress || "127.0.0.1"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#949BA4]" />
                          {formatTimeAgo(s.lastActive || s.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleRevokeSingle(s.sessionId, deviceLabel)
                        }
                        disabled={isRevoking}
                        className="h-8 px-3 rounded-lg bg-[#1E1F24] hover:bg-red-950/40 border border-[#2B2D31] hover:border-red-500/40 text-[#949BA4] hover:text-red-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isRevoking ? "Revoking..." : "Revoke"}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400/80 bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Security Policy Note */}
        <div className="p-4 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#FFC93C]" />
            <span>Session Protection & Immediate Invalidation</span>
          </div>
          <p className="text-[11px] text-[#949BA4] leading-relaxed">
            Every login creates an isolated cryptographically secure session ID. When a session is revoked, the JWT authorization cookie is immediately invalidated, blocking subsequent tool calls and forcing an instant logout on that device.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SecuritySettings;
