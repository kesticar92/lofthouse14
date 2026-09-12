/**
 * Catálogo semilla del muro de Instagram (@lofthouse.14).
 * Con INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID el feed live
 * reemplaza esto. Sin token, se usa este listado (+ overrides en `.data/instagram-feed.json`).
 */

export type InstagramPostSeed = {
  id: string;
  url: string;
  thumbnailUrl: string;
  isVideo: boolean;
  caption: string;
  /** ISO date — más reciente primero en el muro */
  publishedAt?: string;
};

export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/lofthouse.14/";

/** Todas las piezas conocidas / curadas del perfil público. */
export const INSTAGRAM_POSTS_SEED: InstagramPostSeed[] = [
  {
    id: "reel-DdKc3lKjVaB",
    url: "https://www.instagram.com/reel/DdKc3lKjVaB/",
    thumbnailUrl: "/gallery/lofthouse-14-redes-cali-01.webp",
    isVideo: true,
    caption:
      "Tour completo por tu próximo aparta-estudio. Reserva directo: mejor tarifa y trato personal.",
    publishedAt: "2026-09-11T22:00:00.000Z",
  },
  {
    id: "reel-DdHzLPtjdml",
    url: "https://www.instagram.com/reel/DdHzLPtjdml/",
    thumbnailUrl: "/gallery/lofthouse-14-redes-cali-02.webp",
    isVideo: true,
    caption:
      "Recorre LOFTHOUSE 14 en 15 segundos. Reserva directo por WhatsApp.",
    publishedAt: "2026-09-11T12:00:00.000Z",
  },
  {
    id: "reel-DZxlocpsg5n",
    url: "https://www.instagram.com/reel/DZxlocpsg5n/",
    thumbnailUrl: "/gallery/lofthouse-14-redes-cali-04.webp",
    isVideo: true,
    caption:
      "A veces no hace falta salir de tu ciudad para vivir algo distinto.",
    publishedAt: "2026-03-01T12:00:00.000Z",
  },
  {
    id: "reel-DZdMqSyNjBh",
    url: "https://www.instagram.com/reel/DZdMqSyNjBh/",
    thumbnailUrl: "/gallery/lofthouse-14-redes-cali-03.webp",
    isVideo: true,
    caption: "Vive Cali como un local.",
    publishedAt: "2026-02-20T12:00:00.000Z",
  },
  {
    id: "reel-DS_NhgWEQoS",
    url: "https://www.instagram.com/reel/DS_NhgWEQoS/",
    thumbnailUrl: "/gallery/lofthouse-14-redes-cali-01.webp",
    isVideo: true,
    caption: "Desde Cristo Rey, Cali se ilumina cada noche.",
    publishedAt: "2025-12-18T12:00:00.000Z",
  },
  {
    id: "reel-DS7rZ57EUaw",
    url: "https://www.instagram.com/reel/DS7rZ57EUaw/",
    thumbnailUrl: "/gallery/lofthouse-14-redes-cali-02.webp",
    isVideo: true,
    caption: "Entrar, subir y sentir que ya estás en tu lugar.",
    publishedAt: "2025-12-15T12:00:00.000Z",
  },
  {
    id: "curated-fachada",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/lofthouse-14-fachada-miraflores-cali.webp",
    isVideo: false,
    caption: "Fachada LOFTHOUSE 14 — Miraflores, Parque del Perro.",
    publishedAt: "2025-11-01T12:00:00.000Z",
  },
  {
    id: "curated-entrada",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loftHouse14-entrada_resultado_resultado.webp",
    isVideo: false,
    caption: "La entrada al loft: primer contacto con el espacio.",
    publishedAt: "2025-10-20T12:00:00.000Z",
  },
  {
    id: "curated-sala",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-sala-sofa-miraflores-cali.webp",
    isVideo: false,
    caption: "Sala con sofá — espacio para estar y compartir.",
    publishedAt: "2025-10-10T12:00:00.000Z",
  },
  {
    id: "curated-cocina",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-cocina-equipada-miraflores-cali.webp",
    isVideo: false,
    caption: "Cocina equipada para cocinar como en casa.",
    publishedAt: "2025-09-28T12:00:00.000Z",
  },
  {
    id: "curated-mesa",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/mesaServida_resultado.webp",
    isVideo: false,
    caption: "Mesa servida — detalles que hacen la estadía.",
    publishedAt: "2025-09-15T12:00:00.000Z",
  },
  {
    id: "curated-dormitorio",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-dormitorio-entrepiso-miraflores-cali.webp",
    isVideo: false,
    caption: "Dormitorio en entrepiso — descanso con estilo.",
    publishedAt: "2025-09-01T12:00:00.000Z",
  },
  {
    id: "curated-romantico",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-habitacion-romantica-cali.webp",
    isVideo: false,
    caption: "Ambiente romántico en el loft.",
    publishedAt: "2025-08-20T12:00:00.000Z",
  },
  {
    id: "curated-cali",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/cali_resultado.webp",
    isVideo: false,
    caption: "Cali desde arriba — la ciudad que te recibe.",
    publishedAt: "2025-08-05T12:00:00.000Z",
  },
  {
    id: "curated-loft01",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-01_resultado.webp",
    isVideo: false,
    caption: "Interior LOFTHOUSE — luz y espacio.",
    publishedAt: "2025-07-22T12:00:00.000Z",
  },
  {
    id: "curated-loft02",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-02_resultado.webp",
    isVideo: false,
    caption: "Detalles del loft en Miraflores.",
    publishedAt: "2025-07-10T12:00:00.000Z",
  },
  {
    id: "curated-sofa-cama",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-sofa-cama-miraflores-cali.webp",
    isVideo: false,
    caption: "Sofá cama — capacidad flexible para tu grupo.",
    publishedAt: "2025-06-28T12:00:00.000Z",
  },
  {
    id: "curated-habitacion",
    url: INSTAGRAM_PROFILE_URL,
    thumbnailUrl: "/gallery/loft-habitacion-miraflores-cali.webp",
    isVideo: false,
    caption: "Habitación lista para tu noche en Cali.",
    publishedAt: "2025-06-15T12:00:00.000Z",
  },
];
