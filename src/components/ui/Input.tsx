import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full min-h-11 rounded-sm border bg-surface-sunk px-4 py-3 text-body-ui text-ink placeholder:text-ink-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className = "", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(fieldClasses, invalid ? "border-alert" : "border-line", className)}
      {...props}
    />
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className = "", ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldClasses, "resize-none leading-relaxed", invalid ? "border-alert" : "border-line", className)}
      {...props}
    />
  );
});
