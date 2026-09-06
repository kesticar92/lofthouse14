/** Contacto oficial (WhatsApp y teléfono). */

export const WHATSAPP_E164 = "+573181585801";
export const WHATSAPP_DIGITS = "573181585801";
export const PHONE_DISPLAY = "+57 318 158 5801";

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
    "Lofts modernos en Cali, barrio Miraflores, a pasos del Parque del Perro. WiFi, A/C, cocina equipada. Desde $90.000/noche (2 personas, entre semana). Check-in autónomo. Reserva directo.",
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
  /** Tarifa base entre semana (L–J) para 1–2 huéspedes. */
  priceFromCop: 90_000,
  /** Capacidad del conjunto (14 lofts × hasta 5 pers. c/u, con ajustes operativos). */
  maxGuests: 63,
  maxLofts: 14,
  maxGuestsPerLoft: 5,
  legal: {
    razonSocial: "Lofthouse 14",
    nit: "Consultar al reservar",
    regimen: "Persona natural / responsable de IVA según operación",
    vigenciaDias: 3,
    moneda: "COP",
    monedaNombre: "pesos colombianos",
    avisoImpuestos:
      "Las tarifas se expresan en pesos colombianos. Impuestos y retenciones se informan en la cotización si aplican.",
    amenitiesIncluidos: [
      "WiFi",
      "Aire acondicionado",
      "Cocina equipada",
      "Smart TV",
    ],
    metodosPago: ["Transferencia", "Nequi", "Daviplata", "Efectivo"],
    politicaPago:
      "Anticipo del 50% para confirmar. Saldo a más tardar el día del check-in.",
    politicaCancelacion: [
      "Más de 7 días: reembolso del 80% del anticipo.",
      "Entre 3 y 7 días: 50% del anticipo.",
      "Menos de 72 horas o no-show: sin reembolso del anticipo, salvo fuerza mayor documentada.",
    ],
  },
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
