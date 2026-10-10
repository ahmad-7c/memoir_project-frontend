// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter, Caveat } from "next/font/google";
import "./globals.css";

// Configure fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Memoir Archive",
  description: "Preserve your life's legacy.",
};

// Runs before paint, before React hydrates. Reads the stored preference (or
// falls back to the OS setting) and applies `.dark` synchronously, so there
// is no flash of the wrong theme on load -- this cannot be done from a React
// effect, which only runs after the first paint.
const THEME_ANTI_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${caveat.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_ANTI_FLASH_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-memory-bg text-memory-primary dark:text-memory-ink transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}