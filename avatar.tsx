import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<
  Size,
  { icon: number; text: string; gap: string; caption: string }
> = {
  sm: { icon: 20, text: "text-base", gap: "gap-1.5", caption: "text-[9px]" },
  md: { icon: 28, text: "text-xl", gap: "gap-2", caption: "text-[10px]" },
  lg: { icon: 44, text: "text-3xl", gap: "gap-3", caption: "text-xs" },
};

export function LogoIcon({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Deep green rounded tile */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="10"
        fill="var(--primary)"
      />
      {/* Subtle prosperity ring */}
      <rect
        x="3"
        y="3"
        width="34"
        height="34"
        rx="8"
        stroke="var(--gold)"
        strokeOpacity="0.28"
        strokeWidth="1"
        fill="none"
      />
      {/* F stem */}
      <rect x="11" y="9" width="3.4" height="22" rx="1.2" fill="var(--gold)" />
      {/* F top bar */}
      <rect x="11" y="9" width="14" height="3.2" rx="1.2" fill="var(--gold)" />
      {/* F mid bar */}
      <rect x="11" y="17.5" width="10" height="3" rx="1.2" fill="var(--gold)" />
      {/* Upward growth tick — prosperity curve */}
      <path
        d="M17 28 L22 23 L26 26 L33 17"
        stroke="#FDFAF4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="33" cy="17" r="1.8" fill="var(--gold)" />
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display font-semibold uppercase text-foreground",
        className,
      )}
      style={{ letterSpacing: "0.35em" }}
    >
      F O V O Z
    </span>
  );
}

export function Logo({
  size = "md",
  showWordmark = true,
  caption,
  className,
}: {
  size?: Size;
  showWordmark?: boolean;
  caption?: string;
  className?: string;
}) {
  const s = sizeMap[size];
  return (
    <span
      className={cn(
        "inline-flex flex-col",
        showWordmark ? "items-start" : "items-center",
        className,
      )}
    >
      <span className={cn("inline-flex items-center", s.gap)}>
        <LogoIcon size={s.icon} />
        {showWordmark && <LogoWordmark className={s.text} />}
      </span>
      {caption && (
        <span
          className={cn(
            "mt-0.5 font-medium uppercase tracking-[0.22em] text-gold",
            s.caption,
          )}
        >
          {caption}
        </span>
      )}
    </span>
  );
}