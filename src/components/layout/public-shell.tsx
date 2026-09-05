import { Header } from "@/components/layout/header";
import { ShareBar } from "@/components/layout/share-bar";
import { SiteFooter } from "@/components/sections/site-footer";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[length:40px_40px] bg-grid-fade opacity-[0.35] dark:bg-grid-fade-dark dark:opacity-20" />
      <Header />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
      <ShareBar />
    </>
  );
}
