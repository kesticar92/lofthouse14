import type { Metadata } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { site } from "@/lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lofthouse14.com";

const display = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  display: "swap",
});

const sans = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: site.name,
  description: site.description,
  url: siteUrl,
  image: [
    `${siteUrl}/logo-lofthouse.png`,
    ...site.gallery.map((p) => `${siteUrl}${p}`),
  ],
  telephone: site.phoneTel,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.addressLine,
    addressLocality: "Cali",
    addressRegion: "Valle del Cauca",
    addressCountry: "CO",
    addressNeighborhood: "Miraflores",
  },
  priceRange: "$$",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | Lofts en Miraflores, Cali`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "loft cali",
    "apartaestudio miraflores",
    "parque del perro",
    "alojamiento cali",
    "lofthouse 14",
    "hospedaje miraflores cali",
  ],
  authors: [{ name: site.name }],
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    locale: "es_CO",
    type: "website",
    siteName: site.name,
    images: [{ url: "/logo-lofthouse.png", width: 800, height: 800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <noscript>
          <div
            style={{
              padding: "2rem",
              background: "#f2f0eb",
              color: "#0a0a0a",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
              Activa JavaScript
            </p>
            <p>
              Esta página necesita JavaScript para mostrar el contenido. Abre el
              sitio en un navegador con JavaScript habilitado o prueba en
              Chrome/Safari/Firefox.
            </p>
          </div>
        </noscript>
        <ThemeProvider>{children}</ThemeProvider>
        <Script
          id="ld-json-lofthouse"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  );
}
