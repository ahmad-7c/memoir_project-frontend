import { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

/**
 * Plain sentence-case label, 11px, --muted-foreground -- the reference's
 * `/begin` labels ("Email", "Password") are not uppercase micro-labels.
 */
export function Label({ children, required, className = "", ...props }: LabelProps) {
  return (
    <label className={cn("block text-[11px] text-muted-foreground mb-2", className)} {...props}>
      {children}
      {required && (
        <span className="text-destructive ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
