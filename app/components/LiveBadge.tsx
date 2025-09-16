import { memo, ReactNode } from "react";
import clsx from "clsx";

const TONE_STYLES = {
  red: {
    gradient: "bg-gradient-to-r from-red-500 via-rose-500 to-red-600",
    glow: "bg-red-500/50",
    ping: "bg-red-200",
    dot: "bg-white",
    shadow: "shadow-[0_0_18px_rgba(239,68,68,0.45)]",
  },
  emerald: {
    gradient: "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600",
    glow: "bg-emerald-500/50",
    ping: "bg-emerald-200",
    dot: "bg-emerald-50",
    shadow: "shadow-[0_0_18px_rgba(16,185,129,0.45)]",
  },
  violet: {
    gradient: "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-600",
    glow: "bg-fuchsia-500/45",
    ping: "bg-fuchsia-200",
    dot: "bg-white",
    shadow: "shadow-[0_0_18px_rgba(217,70,239,0.45)]",
  },
} as const;

type Tone = keyof typeof TONE_STYLES;

interface LiveBadgeProps {
  label?: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
  icon?: ReactNode;
  "aria-label"?: string;
}

const LiveBadge = ({
  label = "EN VIVO",
  tone = "red",
  size = 'md',
  className,
  icon,
  "aria-label": ariaLabel,
}: LiveBadgeProps) => {
  const toneConfig = TONE_STYLES[tone] ?? TONE_STYLES.red;
  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-0.5 text-[0.55rem]'
    : 'px-3 py-1 text-[0.65rem]';

  return (
    <span
      className={clsx(
        "relative inline-flex items-center overflow-hidden rounded-full font-extrabold uppercase tracking-[0.24em] text-white",
        "ring-1 ring-white/40 backdrop-blur-sm",
        "transition-transform duration-500",
        sizeClasses,
        toneConfig.shadow,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel ?? label}
    >
      <span className={clsx("absolute inset-0 opacity-90", toneConfig.gradient)} aria-hidden="true" />
      <span className={clsx("absolute inset-0 blur-lg opacity-70", toneConfig.glow)} aria-hidden="true" />
      <span className="relative z-10 flex items-center gap-2">
        {icon ?? (
          <span className="relative flex h-3 w-3" aria-hidden="true">
            <span className={clsx("absolute inline-flex h-full w-full rounded-full animate-ping", toneConfig.ping)} />
            <span
              className={clsx(
                "relative inline-flex h-3 w-3 rounded-full border border-white/80",
                toneConfig.dot,
              )}
            />
          </span>
        )}
        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">{label}</span>
      </span>
    </span>
  );
};

export default memo(LiveBadge);
