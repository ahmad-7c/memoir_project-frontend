import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full h-[49px] rounded-md border bg-card px-[15px] py-[13px] text-sm text-foreground placeholder:text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary";

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
      className={cn(fieldClasses, invalid ? "border-destructive" : "border-border", className)}
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
      className={cn(fieldClasses, "h-auto resize-none leading-relaxed", invalid ? "border-destructive" : "border-border", className)}
      {...props}
    />
  );
});
