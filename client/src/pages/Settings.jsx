import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Terminal,
  Cpu,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Zap,
  User,
  Shield,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { updateUserPreferencesState } from "@/redux/userSlice";
import {
  getUserPreferences,
  updateUserPreferences,
  getUserUsage,
} from "@/features/preferences";
import { motion, AnimatePresence } from "framer-motion";

// Modular Settings Section Components
import GeneralSettings from "@/components/settings/GeneralSettings";
import PersonaSettings from "@/components/settings/PersonaSettings";
import ModelSettings from "@/components/settings/ModelSettings";
import PlanSettings from "@/components/settings/PlanSettings";
import BriefingSettings from "@/components/settings/BriefingSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";

const SETTINGS_TABS = [
  { id: "general", label: "General & Account", icon: User },
  { id: "persona", label: "AI Persona", icon: Terminal },
  { id: "models", label: "Intelligence Engine", icon: Cpu },
  { id: "plan", label: "Plan & Quota", icon: Zap },
  { id: "briefing", label: "Morning Briefings", icon: Mail },
  { id: "security", label: "Security & Sessions", icon: Shield },
];

const PRESET_INSTRUCTIONS = [
  {
    label: "Hinglish + Bullets",
    text: "Always respond in friendly Hinglish. Keep answers crisp and in bullet points.",
  },
  {
    label: "Concise & Direct",
    text: "Be extremely concise, direct, and avoid pleasantries. Prioritize speed and clarity.",
  },
];

const AVAILABLE_MODELS = [
  {
    id: "qwen/qwen3.8-27b",
    name: "Groq Qwen 27B",
    speed: "~300ms",
    tag: "RECOMMENDED",
    desc: "Ultra-fast execution, best for autonomous tool chaining.",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "Groq GPT-OSS 20B",
    speed: "~400ms",
    tag: "TIER 2",
    desc: "High reasoning capacity with dedicated token quota.",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Google Gemini 3.1",
    speed: "~1.1s",
    tag: "FALLBACK",
    desc: "Massive context window & virtually unlimited daily limits.",
  },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Singapore",
];

const DELIVERY_TIMES = [
  { value: "07:00", label: "07:00 AM" },
  { value: "08:00", label: "08:00 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
];

const Settings = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State with URL query sync
  const currentTabParam = searchParams.get("tab");
  const activeTab = SETTINGS_TABS.some((t) => t.id === currentTabParam)
    ? currentTabParam
    : "general";

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const [customInstructions, setCustomInstructions] = useState("");
  const [defaultModel, setDefaultModel] = useState("qwen/qwen3.8-27b");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState("daily");
  const [deliveryTime, setDeliveryTime] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);

  // Feature 5.1 & 5.2: Token Usage & Tier Limits State
  const [usageData, setUsageData] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const fetchUsage = async () => {
    try {
      setLoadingUsage(true);
      const res = await getUserUsage();
      if (res?.success && res?.usage) {
        setUsageData(res.usage);
      }
    } catch (err) {
      console.error("Failed to load usage data:", err);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  // Sync initial state from Redux or fetch from backend
  useEffect(() => {
    if (userData?.preferences) {
      setCustomInstructions(userData.preferences.customInstructions || "");
      setDefaultModel(userData.preferences.defaultModel || "qwen/qwen3.8-27b");
      setTimezone(userData.preferences.timezone || "Asia/Kolkata");
      if (userData.preferences.digest) {
        setDigestEnabled(userData.preferences.digest.enabled ?? true);
        setDigestFrequency(userData.preferences.digest.frequency || "daily");
        setDeliveryTime(userData.preferences.digest.deliveryTime || "09:00");
      }
    } else {
      fetchPreferences();
    }
  }, [userData]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await getUserPreferences();
      if (res?.preferences) {
        setCustomInstructions(res.preferences.customInstructions || "");
        setDefaultModel(res.preferences.defaultModel || "qwen/qwen3.8-27b");
        setTimezone(res.preferences.timezone || "Asia/Kolkata");
        if (res.preferences.digest) {
          setDigestEnabled(res.preferences.digest.enabled ?? true);
          setDigestFrequency(res.preferences.digest.frequency || "daily");
          setDeliveryTime(res.preferences.digest.deliveryTime || "09:00");
        }
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setBanner(null);

    try {
      const payload = {
        customInstructions: customInstructions.trim(),
        defaultModel,
        timezone,
        digest: {
          enabled: digestFrequency !== "off" && digestEnabled,
          frequency: digestFrequency,
          deliveryTime,
        },
      };

      const response = await updateUserPreferences(payload);
      if (response?.success) {
        dispatch(updateUserPreferencesState(response.preferences));
        fetchUsage();
        setBanner({
          type: "success",
          message: "Preferences updated successfully.",
        });
      } else {
        setBanner({
          type: "error",
          message: response?.message || "Failed to update preferences.",
        });
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update preferences. Please check your connection.";
      setBanner({
        type: "error",
        message: errorMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (presetText) => {
    setCustomInstructions((prev) => {
      if (!prev) return presetText;
      return `${prev}\n${presetText}`;
    });
  };

  const currentTabObj = SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#121316] text-white selection:bg-[#FFC93C] selection:text-black overflow-hidden">
      {/* Left Sidebar */}
      <Navbar />

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Pinned Top Header */}
        <header className="w-full border-b border-white/10 bg-[#121316]/95 backdrop-blur-xl shrink-0 z-20">
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#262216] border border-[#FFC93C]/30 flex items-center justify-center text-[#FFC93C] shrink-0 shadow-md">
                <SettingsIcon className="w-5 h-5 text-[#FFC93C]" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#D9DADC] font-mono mb-0.5">
                  <Link to="/" className="hover:text-white transition-colors">
                    HOME
                  </Link>
                  <span className="text-[#383A40]">/</span>
                  <Link to="/settings" className="hover:text-white transition-colors">
                    SETTINGS
                  </Link>
                  <span className="text-[#383A40]">/</span>
                  <span className="text-[#FFC93C] uppercase">{currentTabObj.label}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-sans">
                  Settings & Preferences
                </h1>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="h-9 px-5 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,201,60,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Sub-Navigation Tabs Bar */}
        <div className="w-full border-b border-[#2B2D31]/80 bg-[#16171B]/60 backdrop-blur-md shrink-0 z-10">
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {SETTINGS_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-[#262216] text-[#FFC93C] border border-[#FFC93C]/40 shadow-sm font-bold"
                      : "text-[#949BA4] hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <TabIcon
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "text-[#FFC93C]" : "text-[#949BA4]"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto ambient-glow">
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 animate-fade-in">
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
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Tab View with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "general" && (
                  <GeneralSettings
                    userData={userData}
                    timezone={timezone}
                    setTimezone={setTimezone}
                    timezones={TIMEZONES}
                  />
                )}

                {activeTab === "persona" && (
                  <PersonaSettings
                    customInstructions={customInstructions}
                    setCustomInstructions={setCustomInstructions}
                    handleApplyPreset={handleApplyPreset}
                    presets={PRESET_INSTRUCTIONS}
                  />
                )}

                {activeTab === "models" && (
                  <ModelSettings
                    defaultModel={defaultModel}
                    setDefaultModel={setDefaultModel}
                    availableModels={AVAILABLE_MODELS}
                  />
                )}

                {activeTab === "plan" && (
                  <PlanSettings
                    usageData={usageData}
                    loadingUsage={loadingUsage}
                    fetchUsage={fetchUsage}
                    timezone={timezone}
                  />
                )}

                {activeTab === "briefing" && (
                  <BriefingSettings
                    digestEnabled={digestEnabled}
                    setDigestEnabled={setDigestEnabled}
                    digestFrequency={digestFrequency}
                    setDigestFrequency={setDigestFrequency}
                    deliveryTime={deliveryTime}
                    setDeliveryTime={setDeliveryTime}
                    deliveryTimes={DELIVERY_TIMES}
                  />
                )}

                {activeTab === "security" && <SecuritySettings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
