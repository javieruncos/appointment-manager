import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-caption font-medium uppercase tracking-widest text-ink-muted"
      >
        {label}
        {required ? <span className="text-lime">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-coral-bright" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
