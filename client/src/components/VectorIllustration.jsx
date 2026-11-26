export const VectorIllustration = () => {
  return (
    <div className="flex flex-col items-center select-none mb-6">
      {/* 2D Vector Workflow Pipeline Illustration (Pure Black & White) */}
      <svg
        width="240"
        height="64"
        viewBox="0 0 240 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[240px] h-auto"
      >
        {/* Left Input Vector Node */}
        <rect
          x="10"
          y="18"
          width="28"
          height="28"
          rx="6"
          fill="#2B2D31"
          stroke="#383A40"
          strokeWidth="1.5"
        />
        <circle cx="24" cy="32" r="3.5" fill="#D9DADC" />

        {/* Vector Line: Left to Center */}
        <path
          d="M 38 32 H 92"
          stroke="#383A40"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <polygon points="90,29 96,32 90,35" fill="#FFC93C" />

        {/* Center Main Agentra-AI Badge */}
        <rect
          x="96"
          y="8"
          width="48"
          height="48"
          rx="12"
          fill="#FFC93C"
          stroke="#e6b435"
          strokeWidth="1.5"
        />
        {/* Infinite Relay Mark */}
        <g transform="translate(104, 16)">
          <rect
            x="4"
            y="4"
            width="8"
            height="8"
            rx="2"
            stroke="#000000"
            strokeWidth="2"
          />
          <rect
            x="18"
            y="18"
            width="8"
            height="8"
            rx="2"
            stroke="#000000"
            strokeWidth="2"
          />
          <path
            d="M 12 8 H 18 A 3 3 0 0 1 21.5 11.5 V 18"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 18 22 H 12 A 3 3 0 0 1 8.5 18.5 V 12"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="15" cy="15" r="1.5" fill="#000000" />
        </g>

        {/* Vector Line: Center to Right */}
        <path
          d="M 144 32 H 198"
          stroke="#383A40"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <polygon points="196,29 202,32 196,35" fill="#FFC93C" />

        {/* Right Output Vector Node */}
        <rect
          x="202"
          y="18"
          width="28"
          height="28"
          rx="6"
          fill="#2B2D31"
          stroke="#383A40"
          strokeWidth="1.5"
        />
        {/* Vector Checkmark */}
        <path
          d="M 211 32 L 214.5 35.5 L 221 28.5"
          stroke="#FFC93C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Clean Brand Title */}
      <span className="mt-3 font-bold text-sm tracking-tight text-white font-mono uppercase">
        Agentra<span className="text-[#FFC93C]">-AI</span>
      </span>
    </div>
  );
};

export default VectorIllustration;
