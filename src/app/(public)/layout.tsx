// src/app/(public)/layout.tsx
import SiteHeader from "../../components/SiteHeader";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}
