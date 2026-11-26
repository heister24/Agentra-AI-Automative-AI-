import {
  Bot,
  ChevronDown,
  ChevronRight,
  Plus,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toolMeta } from "@/constants/tools";

const ToolSidebar = ({
  agents = [],
  selectedAgent,
  selectedTool,
  onSelectAgent,
  onSelectTool,
}) => {
  // Track which agent workspaces are expanded (active agent expanded by default)
  const [expandedAgents, setExpandedAgents] = useState({});

  useEffect(() => {
    if (selectedAgent?._id) {
      setExpandedAgents((prev) => ({
        ...prev,
        [selectedAgent._id]: true,
      }));
    }
  }, [selectedAgent?._id]);

  const toggleExpand = (agentId, e) => {
    e?.stopPropagation?.();
    setExpandedAgents((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  };

  const handleAgentClick = (ag) => {
    onSelectAgent(ag);
    setExpandedAgents((prev) => ({
      ...prev,
      [ag._id]: true,
    }));
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-[#2B2D31] bg-[#1E1F22] flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* 1. Sidebar Header: Title + Create Agent Button */}
      <div className="h-14 px-4 border-b border-[#2B2D31] flex items-center justify-between bg-[#18191C] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Agents
          </span>
          <span className="text-[10px] font-mono text-[#D9DADC] border border-[#383A40] bg-[#2B2D31] px-1.5 py-0.5 rounded">
            {agents.length}
          </span>
        </div>

        <Link to="/createAgent">
          <button
            type="button"
            title="Create New Agent"
            className="h-7 px-2.5 bg-[#FFC93C] hover:bg-[#e6b435] text-black font-mono text-[11px] uppercase font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New</span>
          </button>
        </Link>
      </div>

      {/* 2. Scrollable Multi-Agent Workspace Tree */}
      <div className="flex-1 p-2 sm:p-3 overflow-y-auto flex flex-col gap-2">
        {agents.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center justify-center">
            <Bot className="w-8 h-8 text-[#949BA4] mb-2" />
            <p className="text-xs text-[#D9DADC] font-mono">No agents found</p>
            <Link to="/createAgent" className="mt-3">
              <span className="text-xs text-[#FFC93C] hover:underline font-mono font-semibold">
                + Create First Agent
              </span>
            </Link>
          </div>
        ) : (
          agents.map((ag) => {
            const isAgentActive = ag._id === selectedAgent?._id;
            const isExpanded = Boolean(expandedAgents[ag._id]);
            const toolsCount = ag.tools?.length || 0;

            return (
              <div
                key={ag._id}
                className={`rounded-xl transition-all border ${
                  isAgentActive
                    ? "border-[#FFC93C]/40 bg-[#2B2D31] shadow-md"
                    : "border-[#2B2D31] bg-[#232428]/90 hover:bg-[#2B2D31] hover:border-[#383A40]"
                }`}
              >
                {/* Agent Header Item */}
                <div
                  onClick={() => handleAgentClick(ag)}
                  className="p-2.5 flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(ag._id, e)}
                      className="p-0.5 text-[#949BA4] hover:text-white transition-colors shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Bot Icon */}
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        isAgentActive
                          ? "bg-[#FFC93C] text-black border-[#FFC93C]"
                          : "bg-[#18191C] text-[#D9DADC] border-[#383A40] group-hover:border-[#FFC93C]/50"
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5" />
                    </div>

                    {/* Agent Name */}
                    <span
                      className={`text-xs uppercase font-bold truncate tracking-tight transition-colors ${
                        isAgentActive
                          ? "text-white"
                          : "text-[#D9DADC] group-hover:text-white"
                      }`}
                    >
                      {ag.name}
                    </span>
                  </div>

                  {/* Right Meta: Tool Count & Details Link */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-[#D9DADC] bg-[#18191C] px-1.5 py-0.5 rounded border border-[#383A40]">
                      {toolsCount} {toolsCount === 1 ? "tool" : "tools"}
                    </span>

                    <Link
                      to={`/agent/${ag._id}`}
                      onClick={(e) => e.stopPropagation()}
                      title={`View ${ag.name} details`}
                      className="p-1 text-[#949BA4] hover:text-[#FFC93C] transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Sub-Items: Tool Channels (when expanded) */}
                {isExpanded && (
                  <div className="px-2 pb-2 pt-0.5 flex flex-col gap-1 border-t border-[#383A40]/50 mt-1">
                    {toolsCount === 0 ? (
                      <span className="text-[11px] font-mono text-[#949BA4] italic px-2 py-1">
                        No tools authorized
                      </span>
                    ) : (
                      <>
                        {/* Unified Workspace Channel */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAgentActive) {
                              onSelectAgent(ag);
                            }
                            onSelectTool("workspace");
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                            isAgentActive && selectedTool === "workspace"
                              ? "bg-[#FFC93C] text-black font-bold shadow-md"
                              : "text-[#D9DADC] hover:text-white hover:bg-[#18191C] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                isAgentActive && selectedTool === "workspace"
                                  ? "bg-black text-[#FFC93C]"
                                  : "bg-[#18191C] text-[#D9DADC]"
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold tracking-tight truncate">
                              Unified Workspace
                            </span>
                          </div>
                        </button>

                        {ag.tools.map((toolId) => {
                        const meta = toolMeta[toolId] || {
                          name: toolId,
                          icon: Bot,
                        };
                        const ToolIcon = meta.icon || Bot;
                        const isToolSelected =
                          isAgentActive && selectedTool === toolId;

                        return (
                          <button
                            key={toolId}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isAgentActive) {
                                onSelectAgent(ag);
                              }
                              onSelectTool(toolId);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                              isToolSelected
                                ? "bg-[#FFC93C] text-black font-bold shadow-md"
                                : "text-[#D9DADC] hover:text-white hover:bg-[#18191C] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                  isToolSelected
                                    ? "bg-black text-[#FFC93C]"
                                    : "bg-[#18191C] text-[#D9DADC]"
                                }`}
                              >
                                <ToolIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold tracking-tight truncate">
                                {meta.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {/* 3. Bottom Summary / Manage All Link */}
      <div className="p-3 border-t border-[#2B2D31] bg-[#18191C] shrink-0">
        <Link
          to="/agents"
          className="w-full py-2 px-3 rounded-lg border border-[#383A40] bg-[#232428] hover:bg-[#2B2D31] text-[11px] font-mono uppercase text-[#D9DADC] hover:text-[#FFC93C] flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Manage All Agents →</span>
        </Link>
      </div>
    </aside>
  );
};

export default ToolSidebar;
