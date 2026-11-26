import { User, Clock, ShieldCheck, Mail, Globe } from "lucide-react";

const GeneralSettings = ({
  userData,
  timezone,
  setTimezone,
  timezones = [],
}) => {
  // Current local time preview in selected timezone
  let localTimePreview = "";
  try {
    localTimePreview = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      timeZoneName: "short",
    }).format(new Date());
  } catch (e) {
    localTimePreview = new Date().toLocaleTimeString();
  }

  const userInitial = userData?.name
    ? userData.name.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Account Profile Summary Card */}
      <section className="rounded-2xl border border-[#2B2D31]/80 bg-[#16171B] p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#24252A]">
          <div className="w-7 h-7 rounded-lg bg-[#262216] border border-[#FFC93C]/20 flex items-center justify-center text-[#FFC93C]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Account Profile
            </h2>
            <p className="text-[11px] text-[#949BA4] mt-0.5">
              Verified account credentials and platform identity.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#121316] border border-[#2B2D31]">
          <div className="flex items-center gap-3.5">
            {userData?.profilePicture ? (
              <img
                src={userData.profilePicture}
                alt={userData?.name || "User"}
                className="w-12 h-12 rounded-xl object-cover border border-[#383A40]"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#262216] border border-[#FFC93C]/30 flex items-center justify-center text-[#FFC93C] font-bold text-base shadow-inner">
                {userInitial}
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">
                {userData?.name || "Agentra User"}
              </span>
              <span className="text-xs text-[#949BA4] font-sans mt-0.5">
                {userData?.email || "No email linked"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[11px] font-mono text-[#8E9297] bg-[#1A1B20] px-3 py-1.5 rounded-lg border border-[#2B2D31]">
              UID: {userData?.firebaseUID?.slice(0, 12)}...
            </span>
          </div>
        </div>
      </section>

      {/* 2. Localization & Timezone */}
      <section className="rounded-2xl border border-[#2B2D31]/80 bg-[#16171B] p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#24252A]">
          <div className="w-7 h-7 rounded-lg bg-[#262216] border border-[#FFC93C]/20 flex items-center justify-center text-[#FFC93C]">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              System Timezone & Regional Offset
            </h2>
            <p className="text-[11px] text-[#949BA4] mt-0.5">
              Determines meeting offsets, daily quota resets at midnight, and morning briefings.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#121316] border border-[#2B2D31]">
          <div className="flex flex-col gap-1 max-w-md">
            <label htmlFor="timezone-select" className="text-xs font-semibold text-white">
              Active Timezone
            </label>
            <p className="text-[11px] text-[#949BA4] leading-relaxed">
              Google Calendar events, cron dispatches, and daily token reset are synced to this zone.
            </p>
            {localTimePreview && (
              <span className="text-[11px] font-mono text-[#FFC93C] flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5" />
                Current Local Time: {localTimePreview}
              </span>
            )}
          </div>

          <select
            id="timezone-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full sm:w-64 h-10 px-3.5 rounded-xl bg-[#18191E] border border-[#2B2D31] focus:outline-none focus:border-[#FFC93C]/80 focus:ring-1 focus:ring-[#FFC93C]/20 text-xs text-white cursor-pointer font-sans shadow-inner shrink-0"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz} className="bg-[#16171B] text-white">
                {tz}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  );
};

export default GeneralSettings;
