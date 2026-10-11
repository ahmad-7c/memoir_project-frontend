// src/app/layout.tsx
import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, Caveat } from "next/font/google";
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
// (or the OS setting) to an explicit "light" | "dark" and writes it as
// data-theme synchronously, so there is no flash of the wrong theme and no
// ambiguous state for globals.css's [data-theme="dark"] selector to miss --
// this cannot be done from a React effect, which only runs after first paint.
const THEME_ANTI_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrumentSans.variable} ${caveat.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-canvas text-ink transition-colors">
        {children}
      </body>
    </html>
  );
}
