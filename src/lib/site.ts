/** Ajusta en `.env.local` (ver `.env.example`). */

const n = (v: string | undefined, fallback: string) =>
  (v && v.replace(/\D/g, "")) || fallback;

export const site = {
  name: "LOFTHOUSE 14",
  tagline: "Vive Cali desde el lugar correcto",
  city: "Cali, Colombia",
  neighborhood: "Miraflores — Parque del Perro",
  description:
    "14 alojamientos tipo loft / apartaestudio en Miraflores (Cali), cerca de gastronomía, cultura y servicios. Reserva directa por WhatsApp, sin comisiones de OTAs.",
  whatsappNumber: n(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER, "573001234567"),
  whatsappDefaultMessage:
    "Hola LOFTHOUSE 14, quiero información de disponibilidad y tarifas 🏠",
  phoneDisplay:
    process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+57 300 000 0000",
  email: process.env.NEXT_PUBLIC_EMAIL || "reservas@lofthouse14.com",
  bookingUrl: "https://www.booking.com/Share-Qyj5CR",
  mapQuery: "Parque del Perro, Miraflores, Cali, Valle del Cauca, Colombia",
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
  airbnbListings: [
    "https://airbnb.com.co/h/lofthouse14",
    "https://airbnb.com.co/h/lofthouse14a",
    "https://airbnb.com.co/h/lofthouse14b",
    "https://airbnb.com.co/h/lofthouse14c",
    "https://airbnb.com.co/h/lofthouse14e",
    "https://airbnb.com.co/h/lofthouse14f",
    "https://airbnb.com.co/h/lofthouse14g",
    "https://airbnb.com.co/h/lofthouse14h",
    "https://airbnb.com.co/h/lofthouse14i",
    "https://airbnb.com.co/h/lofthouse14j",
    "https://airbnb.com.co/h/lofthouse14k",
    "https://airbnb.com.co/h/lofthouse14l",
    "https://airbnb.com.co/h/lofthouse14m",
    "https://airbnb.com.co/h/lofthouse14n",
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
