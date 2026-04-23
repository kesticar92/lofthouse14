/** Ajusta en `.env.local` (ver `.env.example`). */

const n = (v: string | undefined, fallback: string) =>
  (v && v.replace(/\D/g, "")) || fallback;

const defaultWa = "573174246076";

export const site = {
  name: "LOFTHOUSE 14",
  brandLine: "Hospedaje y experiencias",
  tagline: "Vive Cali desde el lugar correcto",
  city: "Cali, Colombia",
  neighborhood: "Miraflores — Parque del Perro",
  addressLine: "Carrera 26 # 2 - 91",
  description:
    "14 alojamientos tipo loft / apartaestudio en Miraflores (Cali), cerca de gastronomía, cultura y servicios. Reservas claras por WhatsApp: fechas, huéspedes, capacidad, pago y verificación de identidad para ingreso autónomo.",
  whatsappNumber: n(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, defaultWa),
  whatsappDefaultMessage:
    "Hola LOFTHOUSE 14, quiero información para reservar (fechas y número de personas).",
  phoneDisplay:
    process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+57 317 424 6076",
  phoneTel: "+573174246076",
  email: process.env.NEXT_PUBLIC_EMAIL || "lofthouse14cali@gmail.com",
  /** Para mapas / JSON-LD */
  mapQuery: "Carrera 26 2-91, Miraflores, Cali, Valle del Cauca, Colombia",
  checkIn: "Desde las 3:00 PM",
  checkOut: "Hasta las 11:00 AM",
  priceFromCop: 80_000,
  gallery: [
    "/gallery/loft-01.jpg",
    "/gallery/loft-02.jpg",
    "/gallery/loft-03.jpg",
    "/gallery/loft-04.jpg",
    "/gallery/loft-05.jpg",
    "/gallery/loft-06.jpg",
    "/gallery/loft-07.jpg",
  ],
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
