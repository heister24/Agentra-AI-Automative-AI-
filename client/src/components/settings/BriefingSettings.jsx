import { Mail, Timer, Calendar, CheckCircle2 } from "lucide-react";

const BriefingSettings = ({
  digestEnabled,
  setDigestEnabled,
  digestFrequency,
  setDigestFrequency,
  deliveryTime,
  setDeliveryTime,
  deliveryTimes = [],
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <section className="rounded-2xl border border-[#2B2D31]/80 bg-[#16171B] p-5 sm:p-6 shadow-xl flex flex-col gap-5">
        {/* Card Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#24252A]">
          <div className="w-7 h-7 rounded-lg bg-[#262216] border border-[#FFC93C]/20 flex items-center justify-center text-[#FFC93C]">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Executive Morning Briefing
            </h2>
            <p className="text-[11px] text-[#949BA4] mt-0.5">
              Autonomous morning email dispatch summarizing calendar agenda and high-priority emails.
            </p>
          </div>
        </div>

        {/* Row 1: Frequency Controls */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Dispatch Frequency
              </span>
              <span
                className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${
                  digestFrequency !== "off" && digestEnabled
                    ? "bg-[#262216] text-[#FFC93C] border border-[#FFC93C]/30"
                    : "bg-[#202126] text-[#949BA4] border border-[#2B2D31]"
                }`}
              >
                {digestFrequency !== "off" && digestEnabled ? "Active" : "Off"}
              </span>
            </div>
            <p className="text-[11px] text-[#949BA4] leading-relaxed">
              Choose how frequently Agentra sends your autonomous executive summary to your Gmail.
            </p>
          </div>

          {/* Modern Segmented Control */}
          <div className="inline-flex p-1 bg-[#18191E] border border-[#2B2D31] rounded-xl self-start sm:self-center shrink-0">
            {[
              { id: "daily", label: "Daily" },
              { id: "weekly", label: "Weekly" },
              { id: "off", label: "Off" },
            ].map((opt) => {
              const isSelected = digestFrequency === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setDigestFrequency(opt.id);
                    if (opt.id === "off") setDigestEnabled(false);
                    else setDigestEnabled(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#FFC93C] text-black shadow-sm font-bold"
                      : "text-[#949BA4] hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Target Morning Hour (Visible if active) */}
        {digestFrequency !== "off" && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex flex-col gap-1 max-w-lg">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-[#FFC93C]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Dispatch Time
                </span>
              </div>
              <p className="text-[11px] text-[#949BA4] leading-relaxed">
                The exact morning hour when your executive briefing is composed and delivered to your inbox.
              </p>
            </div>

            <select
              id="deliveryTime"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full sm:w-56 h-10 px-3.5 rounded-xl bg-[#18191E] border border-[#2B2D31] focus:outline-none focus:border-[#FFC93C]/80 focus:ring-1 focus:ring-[#FFC93C]/20 text-xs text-white cursor-pointer font-sans shadow-inner shrink-0"
            >
              {deliveryTimes.map((time) => (
                <option
                  key={time.value}
                  value={time.value}
                  className="bg-[#16171B] text-white"
                >
                  {time.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Briefing Contents Summary */}
        <div className="p-4 rounded-xl bg-[#121316] border border-[#2B2D31] flex flex-col gap-2.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFC93C]" />
            What is included in the briefing?
          </span>
          <ul className="text-[11px] text-[#949BA4] space-y-1.5 list-disc list-inside">
            <li>
              <strong className="text-white">Google Calendar Agenda: </strong>
              Upcoming meetings, conflict warnings, and scheduled time blocks.
            </li>
            <li>
              <strong className="text-white">Priority Gmail Thread Digest: </strong>
              Key unread messages categorized by urgency with actionable summaries.
            </li>
            <li>
              <strong className="text-white">Active Agent Activity: </strong>
              Autonomous tool chaining actions completed in the background.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default BriefingSettings;
