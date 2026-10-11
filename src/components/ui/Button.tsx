import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SharedProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  loading?: boolean;
}

interface ButtonAsButton extends SharedProps, ButtonHTMLAttributes<HTMLButtonElement> {
  href?: undefined;
}

interface ButtonAsLink extends SharedProps {
  href: string;
  className?: string;
  children?: React.ReactNode;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * The one button shape used across the app. There is one primary (filled)
 * button per screen by design -- `variant="primary"` should appear once.
 * Everything else is `secondary` (hairline outline) or `ghost` (text only).
 * The primary fill is brass -- one of this theme's two rationed brass
 * elements per viewport.
 *
 * Primary text is bold at >=19px specifically because that is load-bearing
 * for accessibility, not a stylistic choice: brass is a mid-luminance
 * metal, so in Pine Light no text colour clears normal-text AA against it --
 * only the large-text (>=18.66px bold) 3:1 threshold, which --on-brass
 * clears at ~4.1:1 in light mode and ~8.5:1 in dark mode. Shrinking this
 * text below 19px bold would make the primary button fail contrast in
 * light mode. See globals.css for the measured values.
 *
 * Motion per the brief: background shifts over 260ms on hover, and the
 * label drops 1px on press -- no lift, no scale, no ripple.
 *
 * Pass `href` to render a navigation link styled identically -- this exists
 * so a "button" that navigates never ends up as a <button> nested inside a
 * <Link>'s <a>, which is invalid HTML (interactive content inside
 * interactive content) and confusing to screen readers.
 */
function classes(variant: SharedProps["variant"] = "primary", size: SharedProps["size"] = "md") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm font-sans transition-[color,background-color,border-color,transform] duration-[260ms] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-h-11 active:translate-y-px";
  const sizes = {
    primary: size === "lg" ? "px-8 py-4" : "px-6 py-3",
    secondary: size === "lg" ? "px-7 py-4 text-body-ui" : "px-5 py-2.5 text-body-ui",
    ghost: "px-3 py-2.5 text-body-ui",
  }[variant];
  const variants = {
    primary: "bg-brass text-on-brass hover:bg-brass-bright font-bold text-[1.1875rem] leading-none",
    secondary: "bg-transparent border border-line text-ink hover:border-line-bright hover:bg-surface-raised font-medium",
    ghost: "bg-transparent text-ink-secondary hover:text-ink font-medium",
  }[variant];
  return cn(base, sizes, variants);
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  props,
  ref,
) {
  const { variant = "primary", size = "md", className = "" } = props;

  if ("href" in props && props.href !== undefined) {
    const { href, children } = props;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cn(classes(variant, size), className)}
      >
        {children}
      </Link>
    );
  }

  const { loading = false, disabled, children, ...rest } = props as ButtonAsButton;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={disabled || loading}
      className={cn(classes(variant, size), className)}
      {...rest}
    >
      {children}
    </button>
  );
});
