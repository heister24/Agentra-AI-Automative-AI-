import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { createNewAgent } from "@/features/agent";
import {
  ArrowLeft,
  Plus,
  Check,
  AlertCircle,
  X,
  Bot,
  Terminal,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { availableTools } from "@/constants/tools";
import { useDispatch } from "react-redux";
import { addAgent } from "@/redux/agentSlice";
import { motion } from "framer-motion";

const CreateAgent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToolSelection = (toolId) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
    if (error) setError("");
  };

  const hasName = Boolean(name.trim());
  const hasDesc = Boolean(description.trim());
  const hasInstructions = Boolean(instructions.trim());
  const hasTools = selectedTools.length > 0;
  const isFormValid = hasName && hasDesc && hasInstructions && hasTools;

  const handleCreateAgent = async (e) => {
    e?.preventDefault();
    setError("");

    if (!hasName) {
      setError("Agent name is required.");
      return;
    }
    if (!hasDesc) {
      setError("Description is required.");
      return;
    }
    if (!hasInstructions) {
      setError("System instructions are required.");
      return;
    }
    if (!hasTools) {
      setError("Select at least one tool.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      tools: selectedTools,
    };

    try {
      setLoading(true);
      const response = await createNewAgent(payload);
      if (response?.data?.success || response?.status === 201) {
        if (response?.data?.agent) {
          dispatch(addAgent(response.data.agent));
        }
        navigate("/agents");
      }
    } catch (err) {
      console.error(err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create agent";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#131417] text-white selection:bg-[#FFC93C] selection:text-black overflow-hidden">
      <Navbar />

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Pinned Navigation & Header Bar (Fixed at top, never scrolls) */}
        <header className="w-full border-b border-[#2B2D31]/80 bg-[#131417]/95 backdrop-blur-xl shrink-0 z-20">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <Link
              to="/agents"
              className="p-2 rounded-xl bg-[#1E1F24]/90 hover:bg-white/[0.08] hover:backdrop-blur-md border border-[#383A40] hover:border-white/30 text-[#949BA4] hover:text-white transition-all cursor-pointer shadow-sm"
              title="Back to All Agents"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                Create New Agent
              </h1>
              <p className="text-xs text-[#949BA4] mt-0.5">
                Configure agent identity, automation tools, and cognitive guidelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/agents">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 bg-[#1E1F24]/80 hover:bg-[#2B2D31] border border-[#383A40] text-[#D9DADC] text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Cancel
              </Button>
            </Link>

            <Button
              type="button"
              onClick={handleCreateAgent}
              disabled={loading || !isFormValid}
              className="h-9 px-5 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-30 shadow-[0_0_20px_rgba(255,201,60,0.3)] hover:shadow-[0_0_25px_rgba(255,201,60,0.45)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] btn-interactive-shimmer"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Deploy Agent</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Scrollable Form Content Area */}
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

        <form onSubmit={handleCreateAgent} className="flex flex-col gap-6 animate-slide-up">
          {/* 1. Identity Card */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border border-[#383A40] bg-[#16171B] hover:border-white/30 hover:bg-[#1A1B20]/90 hover:backdrop-blur-xl hover:shadow-[0_14px_34px_rgba(0,0,0,0.7),0_0_25px_rgba(255,255,255,0.06)] rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row gap-5 shadow-xl transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-[#262216] border border-[#FFC93C]/30 flex items-center justify-center text-[#FFC93C] shrink-0 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="text-xs font-semibold uppercase text-[#D9DADC] tracking-wide block mb-2"
                >
                  Agent Name <span className="text-[#FFC93C]">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Heister, Executive Secretary, Support Specialist"
                  className="w-full h-11 px-4 bg-[#141518]/90 border border-[#383A40]/80 rounded-xl text-sm text-white placeholder:text-[#949BA4]/60 focus:outline-none focus:border-[#FFC93C]/80 focus:ring-2 focus:ring-[#FFC93C]/15 transition-all shadow-inner"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="text-xs font-semibold uppercase text-[#D9DADC] tracking-wide block mb-2"
                >
                  Description <span className="text-[#FFC93C]">*</span>
                </label>
                <textarea
                  id="description"
                  rows={2}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Briefly describe what this agent specializes in..."
                  className="w-full px-4 py-3 bg-[#141518]/90 border border-[#383A40]/80 rounded-xl text-sm text-white placeholder:text-[#949BA4]/60 focus:outline-none focus:border-[#FFC93C]/80 focus:ring-2 focus:ring-[#FFC93C]/15 transition-all resize-y leading-relaxed shadow-inner"
                />
              </div>
            </div>
          </motion.div>

          {/* 2. Instructions Card */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border border-[#383A40] bg-[#16171B] hover:border-white/30 hover:bg-[#1A1B20]/90 hover:backdrop-blur-xl hover:shadow-[0_14px_34px_rgba(0,0,0,0.7),0_0_25px_rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-xl transition-all duration-300"
          >
            <div className="bg-[#202228] px-5 py-3 border-b border-[#383A40]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FFC93C]" />
                <h2 className="text-xs font-bold uppercase tracking-wide text-white">
                  System Instructions & Persona <span className="text-[#FFC93C]">*</span>
                </h2>
              </div>
              <span className="text-[11px] text-[#949BA4] font-medium">Prompt Protocol</span>
            </div>

            <div className="p-5">
              <textarea
                id="instructions"
                rows={8}
                value={instructions}
                onChange={(e) => {
                  setInstructions(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Give precise system instructions (e.g. how the agent should think, speak, format responses, and trigger tool calls)..."
                className="w-full p-4 bg-[#141518]/90 border border-[#383A40]/80 rounded-xl text-xs sm:text-sm font-mono text-white placeholder:text-[#949BA4]/60 focus:outline-none focus:border-[#FFC93C]/80 focus:ring-2 focus:ring-[#FFC93C]/15 transition-all resize-y leading-relaxed shadow-inner"
              />
            </div>
          </motion.div>

          {/* 3. Tools Selection Card */}
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border border-[#383A40] bg-[#16171B] hover:border-white/30 hover:bg-[#1A1B20]/90 hover:backdrop-blur-xl hover:shadow-[0_14px_34px_rgba(0,0,0,0.7),0_0_25px_rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-xl transition-all duration-300"
          >
            <div className="bg-[#202228] px-5 py-3 border-b border-[#383A40]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#FFC93C]" />
                <h2 className="text-xs font-bold uppercase tracking-wide text-white">
                  Integrated Capabilities <span className="text-[#FFC93C]">*</span>
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-[#FFC93C] border border-[#FFC93C]/30 bg-[#FFC93C]/10 px-2.5 py-0.5 rounded-full">
                {selectedTools.length} Selected
              </span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableTools.map((tool) => {
                  const isSelected = selectedTools.includes(tool.id);
                  const Icon = tool.icon;

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleToolSelection(tool.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none hover:scale-[1.015] active:scale-[0.985] ${
                        isSelected
                          ? "bg-[#262216] border-[#FFC93C] text-white shadow-[0_0_20px_rgba(255,201,60,0.15)] -translate-y-0.5"
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
                          <p className="text-xs font-bold tracking-tight truncate">
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
            </div>
          </motion.div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link to="/agents">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5 bg-[#1E1F24]/80 hover:bg-[#2B2D31] border border-[#383A40] text-[#D9DADC] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="h-10 px-6 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-30 shadow-[0_0_20px_rgba(255,201,60,0.3)] hover:shadow-[0_0_25px_rgba(255,201,60,0.45)] transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] btn-interactive-shimmer"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Deploy Agent</span>
                </>
              )}
            </Button>
          </div>
        </form>
        </div>
      </main>
      </div>
    </div>
  );
};

export default CreateAgent;
