export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="PaperRaj"
      className={className}
    >
      <defs>
        <linearGradient id="pr-seal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a5330" />
          <stop offset="55%" stopColor="#553a22" />
          <stop offset="100%" stopColor="#3b2715" />
        </linearGradient>
        <linearGradient id="pr-page" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#efe2c8" />
        </linearGradient>
      </defs>
      {/* wax seal */}
      <circle cx="32" cy="32" r="30" fill="url(#pr-seal)" />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#a9853f" strokeWidth="1.4" opacity="0.75" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#e7dabf" strokeWidth="0.8" opacity="0.5" />
      {/* open book */}
      <path
        d="M15 24.5c5.4-2.6 10.4-2.4 15 .6V44c-4.6-3-9.6-3.2-15-.6V24.5Z"
        fill="url(#pr-page)"
      />
      <path
        d="M49 24.5c-5.4-2.6-10.4-2.4-15 .6V44c4.6-3 9.6-3.2 15-.6V24.5Z"
        fill="url(#pr-page)"
      />
      <path
        d="M32 25.1V44"
        stroke="#8a6a3c"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <g stroke="#a9853f" strokeWidth="0.9" opacity="0.65" strokeLinecap="round">
        <path d="M18.5 28.5h8M18.5 32h8M18.5 35.5h6" />
        <path d="M45.5 28.5h-8M45.5 32h-8M45.5 35.5h-6" />
      </g>
      <path
        d="M22 15.5c3.2 1.6 6.4 1.6 9.6 0"
        stroke="#e7dabf"
        strokeWidth="1.2"
        fill="none"
        opacity="0.55"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span
        className="font-display font-semibold text-ink"
        style={{
          fontSize: compact ? "1.6rem" : "2.1rem",
          letterSpacing: "0.005em",
          lineHeight: 1,
        }}
      >
        Paper<span className="text-wood-2">Raj</span>
      </span>
      {!compact && (
        <span className="smallcaps mt-1 text-[0.66rem] text-ink-3">
          school question paper archive
        </span>
      )}
    </span>
  );
}
