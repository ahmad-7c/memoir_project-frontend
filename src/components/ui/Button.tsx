import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SharedProps {
  /**
   * primary: solid --primary fill, pill -- the one "real" button per screen.
   * hero: frosted/translucent pill, used only over a hero photo.
   * outline: hairline --border, pill or full-width -- secondary actions.
   * ghost: text only, no chrome -- "Stay a little longer", nav links.
   */
  variant?: "primary" | "hero" | "outline" | "ghost";
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

function classes(variant: SharedProps["variant"] = "primary", size: SharedProps["size"] = "md") {
  const base =
    "inline-flex items-center justify-center gap-2 font-sans transition-colors duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

  if (variant === "ghost") {
    return cn(base, "text-[13px] font-medium text-foreground hover:text-accent", "rounded-full px-1 py-1");
  }

  const sizes = {
    md: "h-10 px-6 text-[13px]",
    lg: "h-11 px-7 text-sm",
  }[size ?? "md"];

  const variants = {
    primary: "bg-accent text-accent-foreground hover:opacity-90 rounded-full font-medium",
    hero:
      "bg-accent/80 border border-accent text-accent-foreground hover:bg-accent rounded-full font-medium backdrop-blur-sm",
    outline: "bg-card border border-border text-foreground hover:border-foreground/40 rounded-full font-medium",
  }[variant as "primary" | "hero" | "outline"];

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
