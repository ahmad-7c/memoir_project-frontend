"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// framer-motion's motion.button redefines a handful of native event handlers
// (onAnimationStart/End, onDrag*) with its own gesture-aware signatures, so
// extending the full native attribute set and spreading it onto motion.button
// conflicts on exactly those. Omitted here rather than typed around per-call.
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
>;

interface ButtonProps extends NativeButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
}

/**
 * The one button shape used across the redesigned screens. Motion is a
 * subtle lift, never a bounce or pop -- per the product's tone, nothing
 * here should feel energetic.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className = "", children, ...props },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-sans font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 min-h-11";
  const sizes = size === "lg" ? "px-7 py-4 text-[15px]" : "px-5 py-2.5 text-sm";
  const variants = {
    primary:
      "bg-memory-primary text-memory-light hover:bg-memory-maroon dark:bg-memory-gold dark:text-memory-dark-end dark:hover:bg-memory-accent shadow-sm",
    secondary:
      "bg-transparent border border-memory-border dark:border-memory-border text-memory-primary dark:text-memory-ink hover:bg-memory-card dark:hover:bg-memory-card",
    ghost: "bg-transparent text-memory-muted hover:text-memory-primary dark:hover:text-memory-ink",
  }[variant];

  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? {} : { y: -1 }}
      whileTap={disabled || loading ? {} : { y: 0 }}
      transition={{ duration: 0.2 }}
      disabled={disabled || loading}
      className={cn(base, sizes, variants, className)}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </motion.button>
  );
});
