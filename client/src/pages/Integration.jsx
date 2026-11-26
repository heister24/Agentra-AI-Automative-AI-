import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Link, useSearchParams } from "react-router-dom";
import { GrIntegration } from "react-icons/gr";
import {
  SiGmail,
  SiGooglecalendar,
  SiGooglesheets,
  SiGoogledocs,
} from "react-icons/si";
import { FaInstagram } from "react-icons/fa6";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unplug,
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";
import {
  getIntegrationsStatus,
  getGoogleAuthUrl,
  disconnectIntegration,
  triggerMorningDigest,
} from "@/features/integration";
import { motion, AnimatePresence } from "framer-motion";

const Integration = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);

  // 1. Integrations Status State
  const [statusMap, setStatusMap] = useState({
    gmail: { isConnected: false, email: null },
    instagram: { isConnected: false, email: null },
  });

  // 2. Alert Notification State
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', message: string }

  // 3. Fetch Status from Backend
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getIntegrationsStatus();
      if (res?.integrations) {
        setStatusMap(res.integrations);
      }
    } catch (err) {
      console.error("Failed to load integrations status:", err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Initial Load & OAuth Redirect Handler
  useEffect(() => {
    fetchStatus();

    // Check if Google redirected back with query params
    const statusParam = searchParams.get("status");
    const providerParam = searchParams.get("provider");
    const emailParam = searchParams.get("email");
    const messageParam = searchParams.get("message");

    if (statusParam === "connected" && providerParam === "gmail") {
      setBanner({
        type: "success",
        message: `Gmail successfully connected as ${
          emailParam || "your Google account"
        }! Your AI agents can now read, draft, and manage emails with human-in-the-loop approval.`,
      });
      // Remove query parameters from URL without reloading
      setSearchParams({}, { replace: true });
    } else if (statusParam === "error") {
      setBanner({
        type: "error",
        message: messageParam || "Authentication failed. Please try again.",
      });
      setSearchParams({}, { replace: true });
    }
  }, []);

  // 5. Connect with Google Handler
  const handleConnectGmail = async () => {
    try {
      setConnectingGoogle(true);
      setBanner(null);

      // Get authorization URL from backend
      const res = await getGoogleAuthUrl();

      // Redirect user to Google's consent screen
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error("Failed to get Google Auth URL:", err);
      const errMsg =
        err.response?.data?.message ||
        "Could not initiate Google connection. Check server credentials.";
      setBanner({ type: "error", message: errMsg });
      setConnectingGoogle(false);
    }
  };

  // 6. Disconnect Integration Handler
  const handleDisconnect = async (provider) => {
    const confirmed = window.confirm(
      `Are you sure you want to disconnect ${provider.toUpperCase()}? AI agents will no longer have access to this service.`,
    );
    if (!confirmed) return;

    try {
      setDisconnecting(true);
      await disconnectIntegration(provider);
      setBanner({
        type: "success",
        message: `${provider.toUpperCase()} has been disconnected.`,
      });
      await fetchStatus();
    } catch (err) {
      console.error("Failed to disconnect:", err);
      setBanner({
        type: "error",
        message: `Failed to disconnect ${provider}. Please try again.`,
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTriggerDigest = async () => {
    try {
      setSendingDigest(true);
      setBanner(null);
      const res = await triggerMorningDigest();
      setBanner({
        type: "success",
        message: res.message || "Executive Morning Briefing successfully dispatched to your email!",
      });
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Could not generate briefing. Ensure your Google account is connected.";
      setBanner({ type: "error", message: errMsg });
    } finally {
      setSendingDigest(false);
    }
  };

  const isGmailConnected = statusMap?.gmail?.isConnected;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#121316] text-white selection:bg-[#FFC93C] selection:text-black overflow-hidden">
      {/* Left Sidebar / Mobile Navbar */}
      <Navbar />

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Pinned Page Header (Fixed at top, never scrolls) */}
        <header className="w-full border-b border-white/10 bg-[#121316]/95 backdrop-blur-xl shrink-0 z-20">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-start gap-3.5 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-[#262216] border border-[#FFC93C]/30 flex items-center justify-center text-[#FFC93C] shrink-0 shadow-md">
            <GrIntegration className="w-5 h-5 text-[#FFC93C]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#D9DADC] font-mono mb-1">
              <Link to="/" className="hover:text-white transition-colors">
                HOME
              </Link>
              <span className="text-[#383A40]">/</span>
              <span className="text-[#FFC93C]">INTEGRATION</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
              Integrations & Services
            </h1>
            <p className="text-xs text-[#D9DADC] mt-0.5">
              Connect external services to empower your autonomous Agentra-AI agents.
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto ambient-glow">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col gap-5 animate-fade-in">

        {/* Dynamic Alert Banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
                banner.type === "success"
                  ? "bg-[#282215]/80 border-[#FFC93C]/40 text-[#FFE082]"
                  : "bg-red-950/40 border-red-500/50 text-red-200"
              }`}
            >
              {banner.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-[#FFC93C] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-xs sm:text-sm leading-relaxed">
                  {banner.message}
                </p>
              </div>
              <button
                onClick={() => setBanner(null)}
                className="text-xs font-mono opacity-70 hover:opacity-100 transition-opacity ml-2 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* 1. GMAIL & WORKSPACE CARD (Static Card) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#383A40]/80 bg-[#16171B] p-5 flex flex-col justify-between shadow-xl">
            <div>
              {/* Card Top: Logo & Status Badge */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl bg-[#2B2D31] border border-[#383A40] flex items-center justify-center shadow-md"
                    title="Gmail"
                  >
                    <SiGmail className="w-4 h-4 text-[#EA4335]" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl bg-[#2B2D31] border border-[#383A40] flex items-center justify-center shadow-md"
                    title="Google Calendar"
                  >
                    <SiGooglecalendar className="w-4 h-4 text-[#4285F4]" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl bg-[#2B2D31] border border-[#383A40] flex items-center justify-center shadow-md"
                    title="Google Sheets"
                  >
                    <SiGooglesheets className="w-4 h-4 text-[#0F9D58]" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl bg-[#2B2D31] border border-[#383A40] flex items-center justify-center shadow-md"
                    title="Google Docs"
                  >
                    <SiGoogledocs className="w-4 h-4 text-[#4285F4]" />
                  </div>
                </div>

                {loading ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#2B2D31] text-[#949BA4]">
                    <Loader2 className="w-3 h-3 animate-spin text-[#FFC93C]" />
                    Checking...
                  </span>
                ) : isGmailConnected ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#282215]/90 text-[#FFC93C] border border-[#FFC93C]/40 shadow-sm">
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#2B2D31] text-[#949BA4] border border-[#383A40]">
                    Not Connected
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Google Workspace (Gmail, Calendar, Sheets, Docs)</span>
              </h3>
              <p className="text-xs text-[#949BA4] mt-1.5 leading-relaxed">
                Connect once to automate Gmail (read/draft/send), Google Calendar (meetings with Meet), Google Sheets (create & log data), and Google Docs (proposals, notes & contracts).
              </p>

              {/* Connected Email Display Box */}
              {isGmailConnected && statusMap.gmail.email && (
                <>
                  <div className="mt-4 p-2.5 rounded-xl bg-[#1E1F22] border border-[#383A40] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-[#949BA4] uppercase tracking-wide">
                        Connected Account
                      </span>
                      <span className="text-xs font-mono text-white truncate max-w-[200px]">
                        {statusMap.gmail.email}
                      </span>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-[#FFC93C] shrink-0" />
                  </div>

                  {/* Autonomous Morning Briefing Schedule & Instant Trigger */}
                  <div className="mt-3 p-3 rounded-xl bg-[#18191C] border border-[#383A40] flex items-center justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] text-[#FFC93C] uppercase tracking-wide font-bold truncate">
                        Autonomous Morning Briefing
                      </span>
                      <span className="text-[11px] text-[#949BA4] mt-0.5">
                        Scheduled daily at 09:00 AM IST
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTriggerDigest}
                      disabled={sendingDigest}
                      title="Send briefing to my inbox now"
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#2B2D31] hover:bg-white/[0.08] hover:backdrop-blur-md border border-[#383A40] hover:border-white/30 text-[#D9DADC] hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {sendingDigest ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#FFC93C]" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 text-[#FFC93C]" />
                          <span>Test Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-[#313338]">
              {isGmailConnected ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect("gmail")}
                  disabled={disconnecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/40 hover:border-red-500 bg-red-950/20 hover:bg-red-950/60 text-red-300 hover:text-white text-xs font-semibold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] cursor-pointer disabled:opacity-50"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Unplug className="w-3.5 h-3.5" />
                      Disconnect Account
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={connectingGoogle || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-bold tracking-wide shadow-[0_4px_16px_rgba(255,201,60,0.25)] hover:shadow-[0_0_30px_rgba(255,201,60,0.55)] transition-all duration-200 hover:scale-[1.025] active:scale-[0.98] btn-interactive-shimmer cursor-pointer disabled:opacity-50"
                >
                  {connectingGoogle ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      Connecting with Google...
                    </>
                  ) : (
                    <>
                      <SiGmail className="w-3.5 h-3.5 text-black" />
                      Connect with Google
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 2. INSTAGRAM CARD (Static Card) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#383A40]/80 bg-[#16171B] p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#2B2D31] border border-[#383A40] flex items-center justify-center shadow-md">
                  <FaInstagram className="w-5 h-5 text-[#E1306C]" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#282215]/90 text-[#FFC93C] border border-[#FFC93C]/40">
                  Ready to Activate
                </span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">
                Instagram Business
              </h3>
              <p className="text-xs text-[#949BA4] mt-1.5 leading-relaxed">
                Autonomous caption generation, trending hashtag discovery, customer DM responses, and scheduled reel hooks.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#313338]">
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2B2D31]/50 text-[#949BA4] text-xs font-semibold cursor-not-allowed border border-[#383A40]"
              >
                Connect Instagram (Next Stage)
              </button>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 3. WEB SEARCH CARD (Static Card) */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[#383A40]/80 bg-[#16171B] p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#2B2D31] border border-[#383A40] flex items-center justify-center text-[#FFC93C] shadow-md">
                  <Globe className="w-5 h-5 text-[#FFC93C]" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#282215]/90 text-[#FFC93C] border border-[#FFC93C]/40">
                  Active
                </span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">
                Tavily Web Search
              </h3>
              <p className="text-xs text-[#949BA4] mt-1.5 leading-relaxed">
                Live search engine integration. Provides real-time information lookup and fact checking across the web.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#313338]">
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2B2D31]/60 text-xs font-medium text-[#D9DADC] border border-[#383A40]">
                <span>Built-in Provider</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Human-in-the-Loop Protocol (Compact Inline Pill) */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[#16171B]/90 border border-[#2B2D31] text-[11px] text-[#949BA4] max-w-xl mx-auto shadow-sm select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFC93C] shrink-0" />
          <span>
            <strong className="text-white font-medium">OAuth 2.0 & Human-in-the-Loop:</strong> Tokens stored securely. AI always requests explicit confirmation before email actions.
          </span>
        </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Integration;
