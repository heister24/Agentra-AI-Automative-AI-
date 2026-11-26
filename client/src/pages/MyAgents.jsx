import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  deleteAllAgents,
  deleteAgentById,
  updateActiveStatus,
} from "@/features/agent";
import {
  fetchAgents,
  toggleAgentStatus,
  removeAgentById,
  clearAllAgents,
  setSelectedAgentId,
} from "@/redux/agentSlice";
import { clearAgentChatCache, clearAllChatCache } from "@/redux/chatSlice";
import { toolMeta } from "@/constants/tools";
import {
  Plus,
  Bot,
  Trash2,
  MessageSquare,
  ArrowRight,
  Settings,
} from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

const MyAgents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Read centralized agents and user state from Redux
  const { agents: allAgents, isFetched } = useSelector((state) => state.agent);
  const { userData } = useSelector((state) => state.user);
  const tier = userData?.usage?.tier || "free";
  const maxAgents = tier === "pro" ? 50 : 3;

  // Fetch only if not already loaded in Redux store
  useEffect(() => {
    if (!isFetched) {
      dispatch(fetchAgents());
    }
  }, [dispatch, isFetched]);

  // Optimistic toggle active status
  const handleActiveToggle = async (id, e) => {
    e?.stopPropagation?.();
    dispatch(toggleAgentStatus(id));
    try {
      await updateActiveStatus(id);
    } catch (error) {
      console.error("Failed to update status:", error);
      dispatch(fetchAgents());
    }
  };

  // Optimistic single agent delete
  const handleDeleteSingleAgent = async (id, name, e) => {
    e?.stopPropagation?.();
    const confirmed = window.confirm(`Delete "${name}"?`);
    if (!confirmed) return;

    dispatch(removeAgentById(id));
    dispatch(clearAgentChatCache(id));
    try {
      await deleteAgentById(id);
    } catch (error) {
      console.error("Failed to delete agent:", error);
      dispatch(fetchAgents());
    }
  };

  // Remove all agents
  const handleRemoveAllAgents = async () => {
    if (!allAgents.length) return;
    const confirmed = window.confirm(
      "Are you sure you want to remove all agents? This action cannot be undone.",
    );
    if (!confirmed) return;

    dispatch(clearAllAgents());
    dispatch(clearAllChatCache());
    try {
      await deleteAllAgents();
    } catch (error) {
      console.error("Failed to delete agents:", error);
      dispatch(fetchAgents());
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#121316] text-white selection:bg-[#FFC93C] selection:text-black overflow-hidden">
      <Navbar />

      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        {/* Pinned Page Header (Fixed at top, never scrolls) */}
        <header className="w-full border-b border-white/10 bg-[#121316]/95 backdrop-blur-xl shrink-0 z-20">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                My Agents
              </h1>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-lg border font-semibold ${
                  allAgents.length >= maxAgents
                    ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                    : "bg-[#1C1D22] border-[#2B2D31] text-[#949BA4]"
                }`}
              >
                {allAgents.length} / {maxAgents} Slots
              </span>
            </div>

            <div className="flex items-center gap-3">
              {allAgents.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveAllAgents}
                  className="h-9 px-3.5 bg-[#1C1D22]/80 hover:bg-red-950/40 border border-[#33353E] hover:border-red-500/50 text-[#949BA4] hover:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Remove All</span>
                </Button>
              )}

              <Link to="/createAgent">
                <Button className="h-9 px-4 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,201,60,0.3)]">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create New Agent</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
            {/* Agents Display Area */}
            {allAgents.length === 0 ? (
              <div className="border border-white/10 bg-[#17181D]/80 backdrop-blur-xl rounded-3xl p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-xl max-w-md mx-auto my-12">
                <div className="w-14 h-14 rounded-2xl bg-[#262216] border border-[#FFC93C]/30 flex items-center justify-center text-[#FFC93C] mb-4 shadow-inner">
                  <Bot className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  No Agents Configured
                </h3>
                <p className="text-xs text-[#949BA4] mt-1.5 leading-relaxed">
                  Deploy your first autonomous agent with integrated tools.
                </p>
                <Link to="/createAgent" className="mt-5">
                  <Button className="h-9 px-5 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-md">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Build Agent</span>
                  </Button>
                </Link>
              </div>
            ) : (
              /* Two-Zone Split Cards Stack (Executive Cloud Platform Style) */
              <div className="flex flex-col gap-4">
                {allAgents.map((agnt) => {
                  const isActive = agnt.isActive !== false;
                  const agentTools = agnt.tools || [];

                  return (
                    <div
                      key={agnt._id}
                      className={`rounded-2xl border overflow-hidden shadow-xl flex flex-col md:flex-row ${
                        isActive
                          ? "bg-[#16171B] border-[#383A40] hover:border-white/30 hover:bg-[#1A1B20]/90 hover:backdrop-blur-xl"
                          : "bg-[#141518] border-[#24262E] opacity-75 hover:opacity-100 hover:border-white/20"
                      }`}
                    >
                      {/* Left Zone: Main Info Panel (~70%) */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          {/* Top Identity Row */}
                          <div className="flex items-center gap-3 mb-2.5">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                                isActive
                                  ? "bg-gradient-to-br from-[#2D2616] to-[#181610] border-[#FFC93C]/40 text-[#FFC93C]"
                                  : "bg-[#1B1C22] border-[#30323C] text-[#949BA4]"
                              }`}
                            >
                              <Bot className="w-5 h-5 stroke-[2]" />
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                              {agnt.name}
                            </h3>
                          </div>

                          {/* Agent Description */}
                          <p className="text-xs sm:text-sm text-[#949BA4] leading-relaxed max-w-2xl">
                            {agnt.description || "No description provided."}
                          </p>
                        </div>

                        {/* Integrated Capability Chips */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                          <span className="text-xs text-[#949BA4] font-medium mr-1">
                            Connected Tools:
                          </span>
                          {agentTools.length > 0 ? (
                            agentTools.map((tId) => {
                              const meta = toolMeta[tId] || {
                                name: tId,
                                icon: Bot,
                              };
                              const ToolIcon = meta.icon;
                              return (
                                <span
                                  key={tId}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F222B] border border-[#2E3340] text-xs font-medium text-[#D9DADC]"
                                >
                                  <ToolIcon className="w-3.5 h-3.5 text-[#FFC93C] shrink-0" />
                                  <span>{meta.name}</span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-[#949BA4] italic">
                              No tools configured
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Zone: Inset Action Deck (~30%) */}
                      <div className="p-5 sm:p-6 bg-[#111215] md:border-l border-t md:border-t-0 border-[#23252E] flex flex-col justify-between gap-4 md:w-72 shrink-0">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-[#949BA4] block mb-2 font-semibold">
                            Controls
                          </span>

                          {/* Status Switch Box */}
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#17181D] border border-[#272932]">
                            <span className="text-xs font-medium text-white">
                              {isActive ? "Active" : "Inactive"}
                            </span>

                            {/* Hardware Switch */}
                            <button
                              type="button"
                              onClick={(e) => handleActiveToggle(agnt._id, e)}
                              role="switch"
                              aria-checked={isActive}
                              title={
                                isActive ? "Deactivate agent" : "Activate agent"
                              }
                              className={`w-8 h-4.5 rounded-full border flex items-center px-0.5 cursor-pointer ${
                                isActive
                                  ? "bg-[#10B981] border-[#10B981] justify-end"
                                  : "bg-[#252730] border-[#33353E] justify-start"
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full shadow-sm ${
                                  isActive ? "bg-black" : "bg-[#949BA4]"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {/* Primary Workspace Launch Button */}
                          <button
                            type="button"
                            onClick={() => {
                              dispatch(setSelectedAgentId(agnt._id));
                              navigate(`/?agentId=${agnt._id}`);
                            }}
                            className="w-full py-2.5 px-4 bg-[#FFC93C] hover:bg-[#e6b435] text-black text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_16px_rgba(255,201,60,0.22)] hover:shadow-[0_0_24px_rgba(255,201,60,0.4)]"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Open Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          {/* Secondary Controls: Config + Delete */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/agent/${agnt._id}`)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-[#1C1F2B] hover:bg-[#252B3B] border border-[#2E3544] text-xs font-medium text-[#D9DADC] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Settings className="w-3.5 h-3.5 text-[#949BA4]" />
                              <span>Config</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) =>
                                handleDeleteSingleAgent(agnt._id, agnt.name, e)
                              }
                              title="Delete Agent"
                              className="p-2 rounded-xl bg-[#1C1F2B] hover:bg-red-950/40 border border-[#2E3544] hover:border-red-500/50 text-[#949BA4] hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyAgents;
