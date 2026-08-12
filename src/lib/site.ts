/** Contacto oficial (WhatsApp y teléfono). */

export const WHATSAPP_E164 = "+573174246076";
export const WHATSAPP_DIGITS = "573174246076";
export const PHONE_DISPLAY = "+57 317 424 6076";

export const site = {
  name: "LOFTHOUSE 14",
  brandLine: "Hospedaje y experiencias",
  tagline: "Vive Cali desde el lugar correcto",
  city: "Cali",
  country: "Colombia",
  timezone: "America/Bogota",
  neighborhood: "Miraflores — Parque del Perro",
  google_url: "https://maps.app.goo.gl/cz2t16H1CGzNh5CJ7",
  addressLine: "Carrera 26 # 2 - 91",
  coordinates: { longitude: -76.54356082617328, latitude: 3.4369468662280838 },
  description:
    "14 alojamientos tipo loft / apartaestudio en Miraflores (Cali), cerca de gastronomía, cultura y servicios. Reservas claras por WhatsApp: fechas, huéspedes, capacidad, pago y verificación de identidad para ingreso autónomo.",
  whatsappNumber: WHATSAPP_DIGITS,
  whatsappDefaultMessage:
    "Hola! Estuve por lofthouse14.com y quiero reservar para las fechas ____ y ____ personas.",
  phoneDisplay: PHONE_DISPLAY,
  phoneTel: WHATSAPP_E164,
  email: process.env.NEXT_PUBLIC_EMAIL || "lofthouse14cali@gmail.com",
  /** Para mapas / JSON-LD */
  mapQuery: "Carrera 26 2-91, Miraflores, Cali, Valle del Cauca, Colombia",
  checkIn: "Desde las 3:00 PM",
  checkOut: "Hasta las 11:00 AM",
  priceFromCop: 80_000,
  /** Capacidad del conjunto (14 lofts × hasta 5 pers. c/u, con ajustes operativos). */
  maxGuests: 63,
  maxLofts: 14,
  maxGuestsPerLoft: 5,
  gallery: [
    "/gallery/loft-01_resultado.webp",
    "/gallery/loft-02_resultado.webp",
    "/gallery/loft-03_resultado.webp",
    "/gallery/loft-04_resultado.webp",
    "/gallery/loft-07_resultado.webp",
    "/gallery/loftHouse14-entrada_resultado_resultado.webp",
    "/gallery/cuarto_1_resultado.webp",
    "/gallery/cocina_1_resultado.webp",
    "/gallery/sofa_1_resultado.webp",
    "/gallery/lofthouse_afuera.webp",
  ],
  instagramUrl: "https://www.instagram.com/lofthouse.14/",
  tiktokUrl: "https://www.tiktok.com/@lofthouse.14",
  audiences: [
    "Turistas nacionales e internacionales",
    "Nómadas digitales",
    "Pacientes médicos",
    "Estudiantes y médicos en rotación",
    "Bailarines de salsa",
    "Deportistas y delegaciones",
    "Parejas y familias",
    "Grupos (hasta 63 personas)",
  ],
} as const;

export function waLink(text?: string) {
  const msg = encodeURIComponent(text || site.whatsappDefaultMessage);
  return `https://wa.me/${site.whatsappNumber}?text=${msg}`;
}
