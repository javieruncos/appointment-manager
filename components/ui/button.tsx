import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-lime text-lime-ink shadow-lime hover:bg-lime-strong active:bg-lime",
  secondary:
    "border border-line bg-surface-2 text-cyan hover:border-cyan/60 hover:bg-surface-3",
  ghost:
    "text-ink-muted hover:bg-surface-2 hover:text-ink active:bg-surface-3",
  danger:
    "border border-coral/35 bg-coral/10 text-coral-bright hover:bg-coral/15",
  outline:
    "border border-line bg-transparent text-ink hover:border-line-strong hover:bg-surface-2",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-sm",
  icon: "size-10 justify-center",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm font-semibold transition-colors motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-45",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
}
