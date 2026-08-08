import type { NextConfig } from "next";

/**
 * CSP alineada al sitio actual:
 * - Fuentes self-hosted (next/font) + data: en @font-face
 * - JSON-LD y Next: script inline → 'unsafe-inline' (sin nonce en layout estático)
 * - Mapa embebido: Google Maps
 * - Supabase (REST, Realtime, Auth) y Sentry (cuando integres el SDK)
 * En desarrollo, 'unsafe-eval' evita romper el hot reload de Next.
 */
function contentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'" as const] : []),
    "https://browser.sentry-cdn.com",
  ].join(" ");

  // En dev (p. ej. http://192.168.x.x desde el móvil) algunos navegadores
  // interpretan 'self' + IPs locales de forma restrictiva y bloquean fetch a la
  // misma API → "Failed to fetch". Permitimos esquemas en desarrollo únicamente.
  const connectSrc = isDev
    ? [
        "'self'",
        "http:",
        "https:",
        "ws:",
        "wss:",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://*.ingest.sentry.io",
        "https://*.ingest.de.sentry.io",
        "https://*.ingest.us.sentry.io",
      ].join(" ")
    : "'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io";

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self'",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://maps.google.com https://www.google.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Solo en prod: en http://localhost el upgrade fuerza https:// y rompe
    // fetch() a /api/* (“Failed to fetch”) si no hay TLS local.
    ...(process.env.NODE_ENV === "production"
      ? (["upgrade-insecure-requests"] as const)
      : []),
  ];

  return directives.join("; ");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Inventario admin: captura de fotos desde el mismo origen
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy(),
  },
];

const nextConfig: NextConfig = {
  /** node-ical + temporal: evitar bundle que rompe BigInt en el servidor. */
  serverExternalPackages: ["node-ical", "rrule-temporal", "temporal-polyfill"],
  /** Fotos inventario (multipart): evitar truncado por defecto (~1 MB en algunas rutas). */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"], // Next las convertirá automáticamente a estos formatos modernos
    remotePatterns: [
      {
        protocol: "https",
        hostname: "me7aitdbxq.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
