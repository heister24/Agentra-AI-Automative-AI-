import { Terminal, RotateCcw, Sparkles } from "lucide-react";

const PersonaSettings = ({
  customInstructions,
  setCustomInstructions,
  handleApplyPreset,
  presets = [],
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <section className="rounded-2xl border border-[#2B2D31]/80 bg-[#16171B] p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#24252A]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#262216] border border-[#FFC93C]/20 flex items-center justify-center text-[#FFC93C]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                AI Persona & Custom Directives
              </h2>
              <p className="text-[11px] text-[#949BA4] mt-0.5">
                Global directives and response tone injected automatically across all your agents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {customInstructions && (
              <button
                type="button"
                onClick={() => setCustomInstructions("")}
                className="text-[11px] text-[#949BA4] hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer mr-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
            <span className="text-[11px] font-mono text-[#949BA4] bg-[#121316] px-2.5 py-0.5 rounded-lg border border-[#2B2D31]">
              {customInstructions.length} / 2000
            </span>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          id="customInstructions"
          rows={5}
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value.slice(0, 2000))}
          placeholder="e.g. Always respond in friendly Hinglish. Keep answers concise with bullet points. When writing code, follow clean ES6+ standards without boilerplate."
          className="w-full p-4 bg-[#121316] border border-[#2B2D31] rounded-xl text-xs sm:text-sm text-white placeholder:text-[#949BA4]/40 focus:outline-none focus:border-[#FFC93C]/80 focus:ring-1 focus:ring-[#FFC93C]/20 transition-all leading-relaxed font-sans resize-y min-h-[120px]"
        />

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-[#949BA4] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FFC93C]" />
            Quick Presets:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset.text)}
              className="px-3 py-1.5 rounded-lg bg-[#1E1F24]/80 hover:bg-[#25272E] border border-[#383A40]/80 hover:border-[#FFC93C]/40 text-[11px] text-[#D9DADC] hover:text-white transition-all cursor-pointer"
            >
              + {preset.label}
            </button>
          ))}
        </div>

        {/* Informational Callout */}
        <div className="p-3.5 rounded-xl bg-[#121316] border border-[#2B2D31] text-[11px] text-[#949BA4] leading-relaxed">
          <span className="text-white font-semibold">How it works: </span>
          Custom instructions act as a persistent universal memory. Whenever you message an agent, this cognitive framework is appended to ensure the agent adheres to your preferred communication style without repetitive prompting.
        </div>
      </section>
    </div>
  );
};

export default PersonaSettings;
