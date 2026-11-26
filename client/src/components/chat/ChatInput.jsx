import { toolMeta } from "@/constants/tools";
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ChatInput = ({
  inputPrompt,
  setInputPrompt,
  onSendMessage,
  sending,
  agents = [],
  selectedAgent,
  onSelectAgent,
  selectedTool,
  onSelectTool,
  hasMessages,
  onClearChat,
}) => {
  const textareaRef = useRef(null);
  const agentMenuRef = useRef(null);
  const toolMenuRef = useRef(null);

  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        agentMenuRef.current &&
        !agentMenuRef.current.contains(event.target)
      ) {
        setIsAgentMenuOpen(false);
      }
      if (toolMenuRef.current && !toolMenuRef.current.contains(event.target)) {
        setIsToolMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  // Auto-resize textarea to fit content (max 140px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140,
      )}px`;
    }
  }, [inputPrompt]);

  const activeToolMeta = toolMeta[selectedTool] || {
    name: selectedTool || "Tool",
    icon: Bot,
  };
  const ActiveToolIcon = activeToolMeta?.icon || Bot;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e);
    }
  };

  const hasAgents = Array.isArray(agents) && agents.length > 0;
  const isAgentInactive = Boolean(
    selectedAgent && selectedAgent.isActive === false,
  );
  const agentTools = Array.isArray(selectedAgent?.tools)
    ? selectedAgent.tools
    : [];

  return (
    <div className="w-full max-w-3xl sm:max-w-4xl mx-auto px-4 pb-4 pt-1 shrink-0">
      <form
        onSubmit={onSendMessage}
        className="relative bg-[#1A1B20]/90 backdrop-blur-2xl border border-[#383A40]/90 rounded-2xl md:rounded-3xl p-3 sm:p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus-within:border-[#FFC93C]/60 focus-within:shadow-[0_0_30px_rgba(255,201,60,0.12)] transition-all flex flex-col gap-2.5"
      >
        {/* Inactive Agent Warning Banner */}
        <AnimatePresence>
          {isAgentInactive && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs overflow-hidden"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span>⚠️</span>
                <span>
                  Agent <strong>"{selectedAgent?.name}"</strong> is currently{" "}
                  <strong>Inactive (OFF)</strong>. Automation is paused.
                </span>
              </span>
              <Link
                to="/agents"
                className="text-[11px] underline hover:text-white font-semibold shrink-0 ml-2"
              >
                Turn ON in My Agents
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!hasAgents || sending || isAgentInactive}
          placeholder={
            !hasAgents
              ? "Create an agent to start automating..."
              : isAgentInactive
                ? `Agent "${selectedAgent?.name}" is currently inactive. Activate in My Agents to chat.`
                : `Ask ${selectedAgent?.name || "Agent"} to automate ${
                    activeToolMeta.name
                  }...`
          }
          className="w-full bg-transparent border-0 text-white placeholder:text-[#949BA4] text-xs sm:text-sm focus:outline-none focus:ring-0 resize-none min-h-[36px] max-h-[140px] leading-relaxed disabled:opacity-40"
        />

        {/* Bottom Toolbar: Agent Selector + Tool Selector + Clear Chat + Send Button */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2B2D31]/80 select-none">
          {/* Left Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            {/* 1. AGENT SELECTOR */}
            {!hasAgents ? (
              <Link to="/createAgent" className="shrink-0">
                <button
                  type="button"
                  className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-full bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Agent</span>
                </button>
              </Link>
            ) : (
              <div className="relative shrink-0" ref={agentMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAgentMenuOpen((prev) => !prev);
                    setIsToolMenuOpen(false);
                  }}
                  className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-full bg-[#18191C] hover:bg-[#2B2D31] border border-[#383A40] hover:border-[#FFC93C]/50 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-inner"
                >
                  <Bot className="w-3.5 h-3.5 text-[#FFC93C]" />
                  <span className="truncate max-w-[110px] sm:max-w-[130px]">
                    {selectedAgent?.name || agents[0]?.name || "Select Agent"}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#949BA4] transition-transform duration-200 ${
                      isAgentMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu Popup */}
                <AnimatePresence>
                  {isAgentMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute bottom-full mb-2.5 left-0 z-50 w-56 rounded-xl bg-[#2B2D31] border border-[#383A40] p-1.5 shadow-2xl flex flex-col gap-0.5"
                    >
                      <div className="px-2.5 py-1 text-[11px] uppercase text-[#949BA4] tracking-wide font-semibold">
                        Agents ({agents.length})
                      </div>

                      <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                        {agents.map((ag) => {
                          const isSelected = ag._id === selectedAgent?._id;
                          return (
                            <button
                              key={ag._id}
                              type="button"
                              onClick={() => {
                                onSelectAgent?.(ag);
                                setIsAgentMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-[#FFC93C] text-black font-semibold"
                                  : "text-[#D9DADC] hover:bg-[#35373C] hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Bot
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected ? "text-black" : "text-[#FFC93C]"
                                  }`}
                                />
                                <span className="truncate">{ag.name}</span>
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="my-1 border-t border-[#383A40]" />

                      <Link
                        to="/createAgent"
                        onClick={() => setIsAgentMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#FFC93C] hover:bg-[#35373C] transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Create New Agent</span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 2. TOOLS DROPDOWN */}
            {hasAgents &&
              (agentTools.length > 0 ? (
                <div className="relative shrink-0" ref={toolMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolMenuOpen((prev) => !prev);
                      setIsAgentMenuOpen(false);
                    }}
                    className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-full bg-[#18191C] hover:bg-[#2B2D31] border border-[#383A40] hover:border-[#FFC93C]/50 text-xs font-medium text-[#D9DADC] hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-inner"
                  >
                    <ActiveToolIcon className="w-3.5 h-3.5 text-[#FFC93C]" />
                    <span className="truncate max-w-[100px] sm:max-w-[120px]">
                      {activeToolMeta.name}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 text-[#949BA4] transition-transform duration-200 ${
                        isToolMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Popup */}
                  <AnimatePresence>
                    {isToolMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full mb-2.5 left-0 z-50 w-56 rounded-xl bg-[#2B2D31] border border-[#383A40] p-1.5 shadow-2xl flex flex-col gap-0.5"
                      >
                        <div className="px-2.5 py-1 text-[11px] uppercase text-[#949BA4] tracking-wide font-semibold">
                          Tool Channels ({agentTools.length})
                        </div>

                        <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
                          {/* Unified Workspace Channel */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTool?.("workspace");
                              setIsToolMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                              selectedTool === "workspace"
                                ? "bg-[#FFC93C] text-black font-semibold"
                                : "text-[#D9DADC] hover:bg-[#35373C] hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Layers
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  selectedTool === "workspace"
                                    ? "text-black"
                                    : "text-[#FFC93C]"
                                }`}
                              />
                              <span className="truncate">
                                Unified Workspace
                              </span>
                            </div>
                            {selectedTool === "workspace" && (
                              <Check className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />
                            )}
                          </button>

                          {agentTools.map((tId) => {
                            const meta = toolMeta[tId] || {
                              name: tId,
                              icon: Bot,
                            };
                            const Icon = meta.icon || Bot;
                            const isSelected = tId === selectedTool;

                            return (
                              <button
                                key={tId}
                                type="button"
                                onClick={() => {
                                  onSelectTool?.(tId);
                                  setIsToolMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-[#FFC93C] text-black font-semibold"
                                    : "text-[#D9DADC] hover:bg-[#35373C] hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Icon
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isSelected
                                        ? "text-black"
                                        : "text-[#FFC93C]"
                                    }`}
                                  />
                                  <span className="truncate">{meta.name}</span>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-black shrink-0 stroke-[2.5]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to={`/agent/${selectedAgent?._id}`} className="shrink-0">
                  <button
                    type="button"
                    className="h-7 sm:h-8 px-2.5 rounded-full bg-[#18191C] border border-dashed border-[#383A40] hover:border-[#FFC93C] text-[11px] font-medium text-[#949BA4] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Tools</span>
                  </button>
                </Link>
              ))}

            {/* 3. CHAT DELETE BUTTON */}
            {hasAgents && (
              <button
                type="button"
                onClick={onClearChat}
                disabled={!hasMessages}
                title="Clear conversation history for this tool"
                className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-full bg-[#18191C] hover:bg-red-500/10 border border-[#383A40] hover:border-red-500/40 text-[#949BA4] hover:text-red-400 text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-inner disabled:opacity-20 disabled:cursor-not-allowed select-none shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">
                  Clear
                </span>
              </button>
            )}
          </div>

          {/* Right: Round Send Button (Arrow Up) */}
          <motion.button
            type="submit"
            whileHover={
              !inputPrompt.trim() ||
              sending ||
              !selectedAgent?._id ||
              !selectedTool ||
              isAgentInactive
                ? {}
                : { scale: 1.08 }
            }
            whileTap={
              !inputPrompt.trim() ||
              sending ||
              !selectedAgent?._id ||
              !selectedTool ||
              isAgentInactive
                ? {}
                : { scale: 0.92 }
            }
            disabled={
              !inputPrompt.trim() ||
              sending ||
              !selectedAgent?._id ||
              !selectedTool ||
              isAgentInactive
            }
            className="group size-8 sm:size-9 rounded-full bg-[#FFC93C] hover:bg-[#e6b435] text-black flex items-center justify-center transition-colors duration-200 disabled:opacity-20 shadow-[0_4px_14px_rgba(255,201,60,0.25)] hover:shadow-[0_0_24px_rgba(255,201,60,0.5)] cursor-pointer shrink-0 select-none btn-interactive-shimmer"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform duration-200" />
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
