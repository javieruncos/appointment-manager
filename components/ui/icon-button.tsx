import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type IconButtonTone = "default" | "lime" | "danger";

const TONE_CLASSES: Record<IconButtonTone, string> = {
  default: "text-ink-muted hover:bg-surface-2 hover:text-ink",
  lime: "text-lime hover:bg-lime/10",
  danger: "text-coral-bright hover:bg-coral/10",
};

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: IconButtonTone;
};

export function IconButton({
  className,
  tone = "default",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-sm transition-colors motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-45",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
