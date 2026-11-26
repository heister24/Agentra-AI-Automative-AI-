import {
  Zap,
  Layers,
  Sparkles,
  BarChart3,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const PlanSettings = ({
  usageData,
  loadingUsage,
  fetchUsage,
  timezone = "Asia/Kolkata",
}) => {
  const isPro = usageData?.tier === "pro";
  const usedTokens = usageData?.dailyTokensUsed ?? 0;
  const limitTokens = usageData?.dailyTokensLimit ?? (isPro ? 500000 : 50000);
  const remainingTokens =
    usageData?.remainingTokens ?? Math.max(0, limitTokens - usedTokens);
  const percentage =
    usageData?.percentage ??
    Math.min(100, Math.round((usedTokens / limitTokens) * 100 * 10) / 10);
  const agentCount = usageData?.agentsCount ?? 0;
  const maxAgents = usageData?.maxAgents ?? (isPro ? 50 : 3);
  const lifetimeTokens = usageData?.totalTokensLifetime ?? 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <section className="rounded-2xl border border-[#2B2D31]/80 bg-[#16171B] p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24252A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#262216] border border-[#FFC93C]/20 flex items-center justify-center text-[#FFC93C]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Plan & Daily Token Quota
              </h2>
              <p className="text-[11px] text-[#949BA4] mt-0.5">
                Real-time token tracker, autonomous agent allocations, and daily quota reset.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span
              className={`text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg uppercase border ${
                isPro
                  ? "bg-purple-950/40 text-purple-300 border-purple-500/30"
                  : "bg-[#262216] text-[#FFC93C] border-[#FFC93C]/30"
              }`}
            >
              {isPro ? "Pro Plan" : "Free Plan"}
            </span>

            <button
              type="button"
              onClick={fetchUsage}
              disabled={loadingUsage}
              title="Refresh Usage Stats"
              className="p-1.5 rounded-lg bg-[#121316] hover:bg-[#1E1F24] border border-[#2B2D31] text-[#949BA4] hover:text-[#FFC93C] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingUsage ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Daily Token Consumption Progress Area */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col gap-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono font-medium text-[#949BA4] uppercase tracking-wider">
                Daily Token Consumption
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {usedTokens.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-[#949BA4]">
                  / {limitTokens.toLocaleString()} tokens
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18191E] border border-[#2B2D31] self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-[#FFC93C] animate-pulse" />
              <span className="text-xs font-mono text-[#D9DADC]">
                {remainingTokens.toLocaleString()} tokens remaining
              </span>
            </div>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-[#1A1B20] border border-[#2B2D31] overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                percentage >= 90
                  ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  : percentage >= 75
                  ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                  : "bg-[#FFC93C] shadow-[0_0_10px_rgba(255,201,60,0.3)]"
              }`}
              style={{
                width: `${Math.min(100, Math.max(usedTokens > 0 ? 1 : 0, percentage))}%`,
              }}
            />
          </div>

          {/* Footer notes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#949BA4] pt-0.5">
            <span className="font-mono">
              <strong className="text-white font-semibold">{percentage}%</strong>{" "}
              of daily quota consumed
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8E9297]">
              <Clock className="w-3 h-3 text-[#FFC93C]" />
              <span>
                Resets daily at 00:00 midnight ({usageData?.timezone || timezone})
              </span>
            </div>
          </div>
        </div>

        {/* Key Usage Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Active Agent Slots */}
          <div className="p-4 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#949BA4]">
                Agent Slots
              </span>
              <Layers className="w-3.5 h-3.5 text-[#FFC93C]" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-white">
                {agentCount} / {maxAgents}
              </div>
              <p className="text-[10px] text-[#8E9297] mt-0.5">
                {isPro
                  ? "Pro tier (up to 50 active agents)"
                  : "Free tier allowance (3 active agents)"}
              </p>
            </div>
          </div>

          {/* Lifetime Tokens Processed */}
          <div className="p-4 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#949BA4]">
                Lifetime Processed
              </span>
              <BarChart3 className="w-3.5 h-3.5 text-[#FFC93C]" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-white">
                {lifetimeTokens.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#8E9297] mt-0.5">
                Cumulative AI tokens across all sessions
              </p>
            </div>
          </div>

          {/* Plan Tier */}
          <div className="p-4 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#949BA4]">
                Active Tier
              </span>
              {isPro && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-[#FFC93C] uppercase">
                {isPro ? "Pro Tier" : "Free Tier"}
              </div>
              <p className="text-[10px] text-[#8E9297] mt-0.5">
                {isPro
                  ? "500,000 daily tokens & priority routing"
                  : "50,000 daily tokens & standard routing"}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Info Card */}
        <div className="p-4 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#FFC93C]" />
            <span>Tier Features & Fair Usage Policy</span>
          </div>
          <p className="text-[11px] text-[#949BA4] leading-relaxed">
            Free tier includes 50,000 daily tokens and up to 3 concurrent agents. Quotas refresh daily at midnight in your reference timezone ({usageData?.timezone || timezone}). Token limits apply to all autonomous agent executions, LangGraph tool chaining, and AI reasoning.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PlanSettings;
