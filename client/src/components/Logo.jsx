export const LogoIcon = ({
  variant = "triad",
  size = 26,
  color = "#000000",
}) => {
  switch (variant) {
    case "monogram":
      // The "A" Apex Monogram: Architectural 'A' combined with automation pipeline
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main 'A' pipeline legs */}
          <path
            d="M 8 25 L 16 7 L 24 25"
            stroke={color}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Circuit crossbar */}
          <path
            d="M 11.2 18.5 H 20.8"
            stroke={color}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          {/* Core AI decision node */}
          <circle cx="16" cy="18.5" r="2.2" fill={color} />
          {/* Apex node */}
          <circle
            cx="16"
            cy="7"
            r="1.8"
            fill="white"
            stroke={color}
            strokeWidth="2"
          />
        </svg>
      );

    case "spark":
      // Quantum Spark: 4-point AI intelligence star with connected pipeline nodes
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Central AI Spark */}
          <path
            d="M 16 5.5 C 16 11.2 11.2 16 5.5 16 C 11.2 16 16 20.8 16 26.5 C 16 20.8 20.8 16 26.5 16 C 20.8 16 16 11.2 16 5.5 Z"
            fill={color}
          />
          {/* Diagonal Workflow Terminals */}
          <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="2" />
          <circle cx="24" cy="24" r="2" stroke={color} strokeWidth="2" />
          <path
            d="M 9.5 9.5 L 12 12"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 20 20 L 22.5 22.5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "infinity":
      // Mobius Relay: Infinite continuous automation flow between two offset nodes
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-left rounded node */}
          <rect
            x="6"
            y="6"
            width="8.5"
            height="8.5"
            rx="2.6"
            stroke={color}
            strokeWidth="2.3"
          />
          {/* Bottom-right rounded node */}
          <rect
            x="17.5"
            y="17.5"
            width="8.5"
            height="8.5"
            rx="2.6"
            stroke={color}
            strokeWidth="2.3"
          />
          {/* Forward flow pipeline */}
          <path
            d="M 14.5 10.25 H 20 A 3 3 0 0 1 23 13.25 V 17.5"
            stroke={color}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          {/* Return flow pipeline */}
          <path
            d="M 17.5 21.75 H 12 A 3 3 0 0 1 9 18.75 V 14.5"
            stroke={color}
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          {/* Central pulse dot */}
          <circle cx="16" cy="16" r="1.5" fill={color} />
        </svg>
      );

    case "triad":
    default:
      // Triad Neural Swarm: 3 agent nodes interconnected in a closed intelligent circuit
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Apex node */}
          <rect
            x="12"
            y="5"
            width="8"
            height="8"
            rx="2.5"
            stroke={color}
            strokeWidth="2.2"
          />
          {/* Bottom-left node */}
          <rect
            x="5"
            y="19"
            width="8"
            height="8"
            rx="2.5"
            stroke={color}
            strokeWidth="2.2"
          />
          {/* Bottom-right node */}
          <rect
            x="19"
            y="19"
            width="8"
            height="8"
            rx="2.5"
            stroke={color}
            strokeWidth="2.2"
          />
          {/* Left connector with rounded corner */}
          <path
            d="M 9 19 V 13.5 A 3 3 0 0 1 12 10.5 H 12"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Right connector with rounded corner */}
          <path
            d="M 23 19 V 13.5 A 3 3 0 0 0 20 10.5 H 20"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Bottom horizontal pipeline */}
          <path
            d="M 13 23 H 19"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Central AI core pulse */}
          <circle cx="16" cy="16.5" r="1.7" fill={color} />
        </svg>
      );
  }
};

export const LogoBadge = ({
  variant = "infinity",
  size = "sm",
  layout = "row",
  className = "",
  showText = true,
}) => {
  const sizeMap = {
    xs: { box: "w-6 h-6 rounded-md", icon: 14, text: "text-xs" },
    sm: { box: "w-8 h-8 rounded-lg", icon: 18, text: "text-sm" },
    md: { box: "w-10 h-10 rounded-xl", icon: 22, text: "text-base" },
    lg: { box: "w-14 h-14 rounded-2xl", icon: 26, text: "text-lg" },
  }[size] || { box: "w-8 h-8 rounded-lg", icon: 18, text: "text-sm" };

  const isRow = layout === "row";

  return (
    <div
      className={`inline-flex items-center select-none ${
        isRow ? "flex-row gap-2.5" : "flex-col"
      } ${className}`}
    >
      {/* Brand mark container */}
      <div
        className={`${sizeMap.box} bg-[#FFC93C] flex items-center justify-center text-black shadow-md border border-[#e6b435] shrink-0 transition-transform duration-150`}
      >
        <LogoIcon variant={variant} size={sizeMap.icon} color="#000000" />
      </div>

      {showText && (
        <span
          className={`font-bold tracking-tight text-white ${
            isRow ? "mt-0" : "mt-2.5"
          } ${sizeMap.text}`}
        >
          Agentra<span className="text-[#FFC93C]">-AI</span>
        </span>
      )}
    </div>
  );
};

export default LogoBadge;
