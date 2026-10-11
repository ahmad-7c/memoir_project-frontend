import { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

/** Always above and outside the field it labels -- no floating labels. */
export function Label({ children, required, className = "", ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-micro uppercase tracking-[0.06em] font-semibold text-ink-secondary mb-2",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-alert ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
