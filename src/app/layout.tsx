// src/app/layout.tsx
import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Caveat } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

// Fraunces carries all memoir content (anything a person wrote, or the AI
// composed on their behalf). Variable, optical-sizing on, kept at its
// default WONK=0 / low SOFT so it reads literary rather than decorative.
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-fraunces",
});

// Instrument Sans carries all interface chrome: labels, buttons, nav, form
// fields, metadata. The serif/sans split is what lets a reader tell, without
// reading closely, which words are the memoir and which are the product.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

// Kept only for the one literally-handwritten note on the landing page --
// not part of the two-family content/chrome system.
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Memoir",
  description: "A biography your family writes together.",
};

// Runs before paint, before React hydrates. Resolves the stored preference
// to an explicit "light" | "dark" and writes it as data-theme synchronously,
// so there is no flash of the wrong theme and no ambiguous state for
// globals.css's [data-theme] selectors to miss -- this cannot be done from a
// React effect, which only runs after first paint.
//
// Pine is the product's default, not a mirror of the OS setting: absent a
// stored choice, this defaults to dark regardless of prefers-color-scheme.
// Pine Light is a deliberate daytime opt-in via ThemeToggle, not something
// the system switches to automatically.
const THEME_ANTI_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored !== "light";
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set by middleware.ts on every request. Passed to this one hand-written
  // inline script's `nonce` attribute so it clears the strict
  // `script-src 'self' 'nonce-...'` CSP that middleware also sets --
  // without it, this script would simply never run under that policy.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // suppressHydrationWarning is scoped to this element only (it does not
    // suppress mismatches in children) -- it exists for exactly this case:
    // data-theme is written to the real DOM by the anti-flash script before
    // React hydrates, so the server-rendered markup never has it and a
    // literal diff against that markup would always "mismatch" on an
    // attribute that was never meant to be server-rendered in the first
    // place. Confirmed via a live hydration-error overlay during this
    // rebuild -- not a theoretical concern.
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-canvas text-ink transition-colors">
        {children}
      </body>
    </html>
  );
}
