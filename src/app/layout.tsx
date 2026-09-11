import type { Metadata } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LegacyHashRedirect } from "@/components/layout/legacy-hash-redirect";
import { BehaviorAnalytics } from "@/components/analytics/behavior-analytics";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SEO,
  SITE_URL,
  lodgingBusinessJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { site } from "@/lib/site";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-R9M0QWD1H3";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO.titleDefault,
    template: SEO.titleTemplate,
  },
  description: SEO.description,
  keywords: [...SEO.keywords],
  authors: [{ name: "Lofthouse 14", url: SITE_URL }],
  creator: "Lofthouse 14",
  applicationName: "Lofthouse 14",
  category: "travel",
  other: {
    "geo.region": "CO-VAC",
    "geo.placename": "Miraflores, Cali",
    "geo.position": `${site.coordinates.latitude};${site.coordinates.longitude}`,
    ICBM: `${site.coordinates.latitude}, ${site.coordinates.longitude}`,
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/logo-lofthouse.png" }],
  },
  openGraph: {
    title: SEO.titleDefault,
    description: SEO.description,
    url: SITE_URL,
    locale: "es_CO",
    alternateLocale: ["en_US"],
    type: "website",
    siteName: "Lofthouse 14",
    images: [
      {
        url: SEO.ogImage,
        width: 1200,
        height: 630,
        alt: SEO.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.titleDefault,
    description: SEO.description,
    images: [SEO.ogImage],
  },
  alternates: {
    canonical: "/",
    languages: {
      "es-CO": "/",
      en: "/en",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0eb" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
  width: "device-width",
  initialScale: 1,
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
              sitio en un navegador con JavaScript habilitado.
            </p>
          </div>
        </noscript>
        <ThemeProvider>
          <LegacyHashRedirect />
          {children}
          <ConsentBanner />
          <BehaviorAnalytics />
        </ThemeProvider>
        <JsonLd data={lodgingBusinessJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {/* FAQPage solo en homepage (page.tsx) — no en todas las rutas */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `}
        </Script>
        {META_PIXEL_ID ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('consent', 'revoke');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
