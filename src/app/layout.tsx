// src/app/layout.tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

// Cormorant Garamond carries all headings, pull quotes and the wordmark --
// matches the reference exactly (see docs/design-reference.md): italic is
// loaded too, since the reference sets the final period of the wordmark in
// italic while the rest of the word stays upright.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
});

// DM Sans carries all interface chrome: labels, buttons, nav, body copy.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "The Family Memoir",
  description:
    "Bring the stories, photographs, and voices of the people you love together in one beautiful family memoir.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">{children}</body>
    </html>
  );
}
