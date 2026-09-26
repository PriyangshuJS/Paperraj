export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  const width = Math.round(size * 1.5);
  return (
    <img
      src="/paperraj-logo.png"
      width={width}
      height={size}
      alt="PaperRaj"
      className={`paperraj-brand-logo block max-h-full max-w-full object-contain object-center ${className}`}
      style={{ maxWidth: "100%", height: "auto" }}
      draggable={false}
    />
  );
}

export function LogoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`font-display font-semibold text-ink ${compact ? "text-xl" : "text-2xl"}`}>
      Paper<span className="text-wood-2">Raj</span>
    </span>
  );
}
