import { Header } from "@/components/layout/header";
import { ShareBar } from "@/components/layout/share-bar";
import { Gallery } from "@/components/sections/gallery";
import { SocialWall } from "@/components/sections/socialWall";
import { SiteFooter } from "@/components/sections/site-footer";
import Link from "next/link";

export const metadata = {
  title: "Galería y redes | LOFTHOUSE 14",
};

export default function GaleriaPage() {
  return (
    <>
      <Header />
      <main className="pt-24">
        <div className="px-4 pb-6 text-center md:px-20">
          <Link
            href="/#reservas"
            className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            ← Volver a configurar estadía
          </Link>
        </div>
        <Gallery />
        <SocialWall />
      </main>
      <SiteFooter />
      <ShareBar />
    </>
  );
}
