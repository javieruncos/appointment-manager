import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

const FIELD_CLASSES =
  "w-full rounded-sm border border-line bg-sheet text-sm text-ink placeholder:text-ink-faint transition-colors motion-reduce:transition-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-coral/60";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leadingIcon?: ReactNode;
  suffix?: ReactNode;
};

export function Input({
  className,
  leadingIcon,
  suffix,
  ...props
}: InputProps) {
  if (!leadingIcon && !suffix) {
    return (
      <input
        className={cn(FIELD_CLASSES, "h-10 px-3", className)}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      {leadingIcon ? (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-faint">
          {leadingIcon}
        </span>
      ) : null}
      <input
        className={cn(
          FIELD_CLASSES,
          "h-10",
          leadingIcon ? "pl-9" : "pl-3",
          suffix ? "pr-10" : "pr-3",
          className,
        )}
        {...props}
      />
      {suffix ? (
        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-ink-faint">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(FIELD_CLASSES, "h-10 px-3", className)}
      {...props}
    />
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(FIELD_CLASSES, "min-h-20 resize-none px-3 py-2", className)}
      {...props}
    />
  );
}
