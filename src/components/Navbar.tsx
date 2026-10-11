/**
 * @file Navbar.tsx
 * @description Site navigation -- kept to what actually goes somewhere.
 * "Plans" / "Our Story" / "FAQs" were plain text with no href, so they were
 * dropped rather than carried forward as dead links; a calm, editorial nav
 * has no room for labels that do nothing.
 */

import Logo from "./Logo";
import Link from "next/link";
import { ThemeToggle } from "./ui/ThemeToggle";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 md:px-16 py-4 bg-canvas border-b border-line">
      <Link href="/" className="flex items-center gap-3">
        <Logo />
        <span className="font-serif text-subhead text-ink">Memoir</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/login"
          className="text-body-ui font-medium text-ink-secondary hover:text-ink transition-colors"
        >
          Log in
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
