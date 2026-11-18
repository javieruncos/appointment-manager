import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "lime" | "emerald" | "cyan" | "amber" | "coral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-line bg-surface-2 text-ink-muted",
  lime: "border-lime/30 bg-lime/10 text-lime",
  emerald: "border-emerald/25 bg-emerald/10 text-emerald-bright",
  cyan: "border-cyan/30 bg-cyan/10 text-cyan",
  amber: "border-amber/25 bg-amber/10 text-amber-bright",
  coral: "border-coral/25 bg-coral/10 text-coral-bright",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-caption font-medium leading-none",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
