import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  deleteAgentById,
  getAgentById,
  updateActiveStatus,
  updateAgent,
} from "@/features/agent";
import {
  ArrowLeft,
  Bot,
  Terminal,
  Trash2,
  Edit3,
  Check,
  X,
  AlertCircle,
  Save,
  Copy,
  CheckCheck,
  Wrench,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { availableTools, toolMeta } from "@/constants/tools";
import { useDispatch } from "react-redux";
import {
  removeAgentById,
  toggleAgentStatus,
  updateAgentInList,
} from "@/redux/agentSlice";
import { clearAgentChatCache } from "@/redux/chatSlice";
import { motion } from "framer-motion";

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  // Form edit fields
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tools, setTools] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setLoading(true);
        const response = await getAgentById(id);
        const data = response?.agent;
        if (data) {
          setAgent(data);
          setDescription(data.description || "");
          setInstructions(data.instructions || "");
          setTools(data.tools || []);
        } else {
          setError("Agent not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load agent.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!agent) return;
    try {
      setAgent((prev) => ({ ...prev, isActive: !prev.isActive }));
      dispatch(toggleAgentStatus(id));
      await updateActiveStatus(id);
    } catch (err) {
      console.error(err);
      const response = await getAgentById(id);
      if (response?.agent) setAgent(response.agent);
    }
  };

  const handleToolToggle = (toolId) => {
    setTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    );
  };

  const handleCopyPrompt = () => {
    if (!agent?.instructions) return;
    navigator.clipboard.writeText(agent.instructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setError("");
    setMessage("");

    if (!description.trim()) {
      setError("Description cannot be empty.");
      return;
    }
    if (!instructions.trim()) {
      setError("System instructions cannot be empty.");
      return;
    }
    if (!tools || tools.length === 0) {
      setError("At least one authorized tool is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await updateAgent(id, {
        description: description.trim(),
        instructions: instructions.trim(),
        tools,
      });

      if (res?.agent) {
        setAgent(res.agent);
        dispatch(updateAgentInList(res.agent));
      } else {
        setAgent((prev) => ({
          ...prev,
          description: description.trim(),
          instructions: instructions.trim(),
          tools,
        }));
      }

      setIsEditing(false);
      setMessage("Configuration saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update agent.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (agent) {
      setDescription(agent.description || "");
      setInstructions(agent.instructions || "");
      setTools(agent.tools || []);
    }
    setIsEditing(false);
    setError("");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${agent?.name}"?`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      dispatch(removeAgentById(id));
      dispatch(clearAgentChatCache(id));
      await deleteAgentById(id);
      navigate("/agents");
    } catch (err) {
      console.error(err);
      setError("Failed to delete agent.");
      setDeleting(false);
    }
  };

  const isActive = agent?.isActive !== false;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#131417] text-white selection:bg-[#FFC93C] selection:text-black overflow-hidden">
      <Navbar />

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Pinned Navigation & Actions Bar (Fixed at top, never scrolls) */}
        <header className="w-full border-b border-[#2B2D31]/80 bg-[#131417]/95 backdrop-blur-xl shrink-0 z-20">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <Link
            to="/agents"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#949BA4] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Agents</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Open Chat in Workspace (Yellow for Workspace!) */}
            <Link to={`/?agentId=${id}`}>
              <Button
                type="button"
                className="h-9 px-4 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all duration-200 shadow-[0_0_20px_rgba(255,201,60,0.22)] hover:shadow-[0_0_25px_rgba(255,201,60,0.4)] hover:scale-[1.03] active:scale-[0.97] btn-interactive-shimmer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Chat Workspace</span>
              </Button>
            </Link>

            {!isEditing ? (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-9 px-4 bg-[#1E1F24]/90 hover:bg-[#2B2D31] text-[#D9DADC] hover:text-white border border-[#383A40] text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FFC93C]" />
                <span>Edit Config</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="h-9 px-3.5 bg-[#1E1F24] hover:bg-[#2B2D31] border border-[#383A40] text-[#D9DADC] text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 px-4 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-[0_0_15px_rgba(255,201,60,0.3)] hover:shadow-[0_0_20px_rgba(255,201,60,0.45)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] btn-interactive-shimmer"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="h-9 px-3 bg-[#1E1F24]/90 hover:bg-red-950/40 border border-[#383A40] hover:border-red-500/50 text-[#949BA4] hover:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto ambient-glow">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-[#1F171A] border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-[#949BA4] hover:text-white cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {message && (
          <div className="p-4 rounded-xl border border-[#2B4E32] bg-[#142318] text-[#55D880] text-xs sm:text-sm flex items-center justify-between animate-fade-in shadow-lg">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-[#55D880] shrink-0" />
              <span>{message}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="text-[#949BA4] hover:text-white cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="border border-[#383A40]/80 bg-[#1A1B20]/60 backdrop-blur-xl rounded-2xl p-8 flex flex-col gap-6 animate-pulse">
            <div className="h-10 bg-[#232428] rounded-xl w-1/3" />
            <div className="h-20 bg-[#232428] rounded-xl" />
            <div className="h-40 bg-[#232428] rounded-xl" />
          </div>
        ) : !agent ? (
          <div className="border border-[#383A40]/80 bg-[#1A1B20]/60 backdrop-blur-2xl rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-xl animate-fade-in">
            <Bot className="w-12 h-12 text-[#FFC93C] mb-3" />
            <h3 className="text-base font-bold text-white tracking-tight">Agent Not Found</h3>
            <Link to="/agents" className="mt-4">
              <Button className="h-9 px-4 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold rounded-xl shadow-md">
                Back to Agents
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-slide-up">
            {/* 1. Hero Identity Card */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border border-[#383A40] bg-[#16171B] hover:border-white/30 hover:bg-[#1A1B20]/90 hover:backdrop-blur-xl hover:shadow-[0_14px_34px_rgba(0,0,0,0.7),0_0_25px_rgba(255,255,255,0.06)] rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-start justify-between gap-6 shadow-xl transition-all duration-300"
            >
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center text-[#FFC93C] shrink-0 border transition-all ${
                    isActive
                      ? "bg-[#262216] border-[#FFC93C]/40 shadow-[0_0_20px_rgba(255,201,60,0.15)]"
                      : "bg-[#1E1F24] border-[#383A40]"
                  }`}
                >
                  <Bot className="w-6 h-6" />
                </div>

                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                    {agent.name}
                  </h1>

                  {!isEditing ? (
                    <p className="text-xs sm:text-sm text-[#949BA4] leading-relaxed">
                      {agent.description || "No description provided for this autonomous agent."}
                    </p>
                  ) : (
                    <div className="pt-1 w-full max-w-xl">
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#141518]/90 border border-[#383A40] rounded-xl text-xs sm:text-sm text-white placeholder:text-[#949BA4]/60 focus:outline-none focus:border-[#FFC93C] focus:ring-2 focus:ring-[#FFC93C]/15 transition-all resize-y leading-relaxed shadow-inner"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="shrink-0 pt-1">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  role="switch"
                  aria-checked={isActive}
                  title={isActive ? "Click to deactivate" : "Click to activate"}
                  className="inline-flex items-center gap-2 cursor-pointer select-none py-1.5 px-3 rounded-xl border border-[#383A40] bg-[#1E1F24]/90 hover:bg-[#232428] transition-colors shadow-sm"
                >
                  <div
                    className={`w-7 h-4 rounded-full border transition-all flex items-center px-0.5 ${
                      isActive
                        ? "bg-[#55D880] border-[#55D880] justify-end"
                        : "bg-[#141518] border-[#383A40] justify-start"
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-transform ${
                        isActive ? "bg-black" : "bg-[#949BA4]"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-tight transition-colors ${
                      isActive ? "text-[#55D880]" : "text-[#949BA4]"
                    }`}
                  >
                    {isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </button>
              </div>
            </motion.div>

            {/* 2. System Instructions */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border border-[#383A40] bg-[#16171B] hover:border-white/30 hover:bg-[#1A1B20]/90 hover:backdrop-blur-xl hover:shadow-[0_14px_34px_rgba(0,0,0,0.7),0_0_25px_rgba(255,255,255,0.06)] rounded-2xl overflow-hidden flex flex-col shadow-xl transition-all duration-300"
            >
              <div className="bg-[#202228] px-5 py-3 border-b border-[#383A40]/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#FFC93C]" />
                  <h2 className="text-xs font-bold uppercase tracking-wide text-white">
                    Cognitive Instructions & Persona
                  </h2>
                </div>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    title="Copy instructions"
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#949BA4] hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded bg-[#141518]/60 hover:bg-white/[0.08] border border-[#383A40]/60 hover:border-white/30"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-[#FFC93C] animate-check-pop" />
                        <span className="text-[#FFC93C] font-bold">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY PROMPT</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="p-5 flex flex-col gap-3">
                {!isEditing ? (
                  <>
                    <div
                      className={`relative rounded-xl border border-[#383A40]/80 bg-[#141518]/90 p-4 transition-all overflow-hidden ${
                        isInstructionsExpanded
                          ? "max-h-none"
                          : "max-h-28 sm:max-h-32"
                      }`}
                    >
                      <pre className="text-xs sm:text-sm font-mono text-[#D9DADC] whitespace-pre-wrap leading-relaxed font-normal">
                        {agent.instructions}
                      </pre>

                      {!isInstructionsExpanded && (
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#141518] to-transparent pointer-events-none" />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setIsInstructionsExpanded(!isInstructionsExpanded)
                      }
                      className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#383A40] hover:border-white/30 bg-[#1E1F24] hover:bg-white/[0.08] text-xs font-medium text-[#D9DADC] hover:text-white transition-colors cursor-pointer"
                    >
                      {isInstructionsExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Expand Full Instructions</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <textarea
                    rows={10}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full p-4 bg-[#141518]/90 border border-[#383A40] rounded-xl text-xs sm:text-sm font-mono text-white placeholder:text-[#949BA4]/60 focus:outline-none focus:border-[#FFC93C] focus:ring-2 focus:ring-[#FFC93C]/15 transition-all resize-y leading-relaxed shadow-inner"
                  />
                )}
              </div>
            </motion.div>

            {/* 3. Authorized Tools */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border border-[#383A40] bg-[#16171B] hover:border-white/30 hover:bg-[#1A1B20]/90 hover:backdrop-blur-xl hover:shadow-[0_14px_34px_rgba(0,0,0,0.7),0_0_25px_rgba(255,255,255,0.06)] rounded-2xl overflow-hidden flex flex-col shadow-xl transition-all duration-300"
            >
              <div className="bg-[#202228] px-5 py-3 border-b border-[#383A40]/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#FFC93C]" />
                  <h2 className="text-xs font-bold uppercase tracking-wide text-white">
                    Integrated Tool Capabilities
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-[#FFC93C] border border-[#FFC93C]/30 bg-[#FFC93C]/10 px-2.5 py-0.5 rounded-full">
                  {tools.length} Authorized
                </span>
              </div>

              <div className="p-5 flex flex-col gap-2.5">
                {!isEditing ? (
                  agent.tools && agent.tools.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {agent.tools.map((toolId) => {
                        const meta = toolMeta[toolId] || {
                          name: toolId,
                          icon: Wrench,
                          description: "Custom tool pipeline",
                        };
                        const ToolIcon = meta.icon;

                        return (
                          <div
                            key={toolId}
                            className="p-3.5 rounded-xl border border-[#383A40]/80 bg-[#141518]/80 flex items-center gap-3.5 shadow-sm"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#262216] border border-[#FFC93C]/30 flex items-center justify-center text-[#FFC93C] shrink-0 shadow-inner">
                              <ToolIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white tracking-tight truncate">
                                {meta.name}
                              </p>
                              <p className="text-[11px] text-[#949BA4] truncate">
                                {meta.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-[#949BA4] italic font-normal">
                      No tools authorized for this agent.
                    </span>
                  )
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableTools.map((tool) => {
                      const isSelected = tools.includes(tool.id);
                      const Icon = tool.icon;

                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToolToggle(tool.id)}
                          className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none ${
                            isSelected
                              ? "bg-[#262216] border-[#FFC93C] text-white shadow-[0_0_15px_rgba(255,201,60,0.15)] -translate-y-0.5"
                              : "bg-[#141518]/70 text-[#949BA4] border-[#383A40]/80 hover:border-white/30 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                isSelected
                                  ? "bg-[#FFC93C] text-black border-[#FFC93C]"
                                  : "bg-[#1E1F24] text-[#D9DADC] border-[#383A40]"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">
                                {tool.name}
                              </p>
                              <p className="text-[11px] text-[#949BA4] truncate mt-0.5">
                                {tool.description}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-[#FFC93C] border-[#FFC93C] text-black"
                                : "border-[#383A40] bg-transparent"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 stroke-[3] animate-check-pop" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        </div>
      </main>
      </div>
    </div>
  );
};

export default AgentDetail;
