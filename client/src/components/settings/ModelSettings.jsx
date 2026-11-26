import { Cpu, Check, Zap } from "lucide-react";

const ModelSettings = ({
  defaultModel,
  setDefaultModel,
  availableModels = [],
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <section className="rounded-2xl border border-[#2B2D31]/80 bg-[#16171B] p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#24252A]">
          <div className="w-7 h-7 rounded-lg bg-[#262216] border border-[#FFC93C]/20 flex items-center justify-center text-[#FFC93C]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Primary Intelligence Engine
            </h2>
            <p className="text-[11px] text-[#949BA4] mt-0.5">
              Select the LLM engine that powers your agents and autonomous tool execution.
            </p>
          </div>
        </div>

        {/* Model Tile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {availableModels.map((model) => {
            const isSelected = defaultModel === model.id;
            return (
              <div
                key={model.id}
                onClick={() => setDefaultModel(model.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-[#FFC93C] bg-[#262216]/50 shadow-[0_0_15px_rgba(255,201,60,0.12)]"
                    : "border-[#2B2D31] bg-[#121316] hover:border-white/20 hover:bg-[#18191E]"
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-[#FFC93C] px-1.5 py-0.5 rounded bg-[#262216] border border-[#FFC93C]/30 uppercase">
                      {model.tag}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#FFC93C] border-[#FFC93C] text-black"
                          : "border-[#383A40] bg-[#1A1B20]"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-1">
                    {model.name}
                  </h3>
                  <p className="text-[11px] text-[#949BA4] leading-relaxed">
                    {model.desc}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-[#D9DADC] border-t border-white/[0.06] pt-2 flex items-center justify-between">
                  <span>Latency</span>
                  <span className="text-white font-semibold">
                    {model.speed}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Model Tip */}
        <div className="p-3.5 rounded-xl bg-[#121316] border border-[#2B2D31] text-[11px] text-[#949BA4] flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#FFC93C] shrink-0" />
          <span>
            <strong className="text-white font-medium">Recommendation: </strong>
            Qwen 27B offers the lowest latency (~300ms) for high-speed multi-step tool calls. Gemini 3.1 Flash Lite offers the largest context window for long documents.
          </span>
        </div>
      </section>
    </div>
  );
};

export default ModelSettings;
