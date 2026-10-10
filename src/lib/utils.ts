/**
 * @file lib/utils.ts
 * @description Tiny className joiner. No clsx/tailwind-merge dependency --
 * this project's class lists don't need conflict resolution, just
 * conditional joining, so a dependency-free version is the right size.
 */

type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
