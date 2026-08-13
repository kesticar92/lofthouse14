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
    "/gallery/immersive/09-fachada_diurna.jpg",
    "/gallery/immersive/11-fachada_sillas_diurna.jpg",
    "/gallery/immersive/10-fachada_nocturna.jpg",
    "/gallery/immersive/06-corredor_salida.jpg",
    "/gallery/immersive/18-sala_cocina_escalera.jpg",
    "/gallery/immersive/01-cocina_completa_comedor_escalera_izquierda.jpg",
    "/gallery/immersive/21-sofacamas_izquierda.jpg",
    "/gallery/immersive/07-escalera_5.jpg",
    "/gallery/immersive/53-comedor_con_cena.jpg",
    "/gallery/immersive/40-img_0446.jpg",
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
