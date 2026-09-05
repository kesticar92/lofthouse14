import type { Metadata } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LegacyHashRedirect } from "@/components/layout/legacy-hash-redirect";
import { JsonLdGraph } from "@/components/layout/json-ld";
import { ConsentBanner } from "@/components/layout/consent-banner";
import { site } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";
import {
  sitewideJsonLdGraph,
  SEO_DESCRIPTION_HOME,
  SEO_KEYWORDS,
  SEO_TITLE_HOME,
} from "@/lib/seo";

const siteUrl = getSiteUrl();

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

const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-R9M0QWD1H3";
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SEO_TITLE_HOME,
    template: `%s | ${site.name}`,
  },
  description: SEO_DESCRIPTION_HOME,
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: "Lofthouse 14" }],
  creator: "Lofthouse 14",
  category: "Lodging",
  applicationName: "Lofthouse 14",
  other: {
    "geo.region": "CO-VAC",
    "geo.placename": "Cali, Colombia",
    "geo.position": `${site.coordinates.latitude};${site.coordinates.longitude}`,
    ICBM: `${site.coordinates.latitude}, ${site.coordinates.longitude}`,
  },
  openGraph: {
    title: SEO_TITLE_HOME,
    description: SEO_DESCRIPTION_HOME,
    url: siteUrl,
    locale: "es_CO",
    alternateLocale: ["en_US"],
    type: "website",
    siteName: "Lofthouse 14",
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE_HOME,
    description: SEO_DESCRIPTION_HOME,
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
  themeColor: "#1A1A2E",
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
      <head>
        <link rel="llms-txt" href="/llms.txt" />
        <JsonLdGraph items={sitewideJsonLdGraph()} />
      </head>
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
              Lofts en Cali Miraflores — Lofthouse 14
            </p>
            <p>
              14 lofts privados junto al Parque del Perro. Desde $80.000/noche.
              WhatsApp {site.phoneDisplay}. Activa JavaScript para reservar en
              el sitio o escribe directo.
            </p>
          </div>
        </noscript>
        <ThemeProvider>
          <LegacyHashRedirect />
          {children}
          <ConsentBanner />
        </ThemeProvider>
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
        {gtmId ? (
          <>
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                title="Google Tag Manager"
              />
            </noscript>
          </>
        ) : (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}
            </Script>
          </>
        )}
        {metaPixelId ? (
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
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
          </Script>
        ) : null}
        {clarityId ? (
          <Script id="ms-clarity" strategy="afterInteractive">
            {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
