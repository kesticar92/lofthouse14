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
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+57 317 424 6076",
  phoneTel: "+573174246076",
  email: process.env.NEXT_PUBLIC_EMAIL || "lofthouse14cali@gmail.com",
  /** Para mapas / JSON-LD */
  mapQuery: "Carrera 26 2-91, Miraflores, Cali, Valle del Cauca, Colombia",
  checkIn: "Desde las 3:00 PM",
  checkOut: "Hasta las 11:00 AM",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  priceFromCop: 80_000,
  /**
   * Datos legales del establecimiento para documentos formales (cotizaciones,
   * facturas/comprobantes). EDITAR antes de emitir el primer documento real.
   */
  legal: {
    razonSocial:
      process.env.NEXT_PUBLIC_LEGAL_RAZON_SOCIAL ||
      "Kevin Stiven Cardoso Echeverri",
    nit: process.env.NEXT_PUBLIC_LEGAL_NIT || "1.151.947.292-8",
    regimen: "Régimen Simple de Tributación / Reserva ocasional",
    moneda: "COP",
    monedaNombre: "Pesos colombianos",
    vigenciaDias: 7,
    metodosPago: [
      "Transferencia bancaria",
      "Nequi",
      "Daviplata",
      "Efectivo (coordinado previamente)",
    ],
    amenitiesIncluidos: [
      "Wi-Fi de alta velocidad",
      "Acceso autónomo (cerradura digital)",
      "Limpieza completa al ingreso",
      "Agua, luz y servicios públicos",
      "Soporte por WhatsApp 24/7",
    ],
    politicaCancelacion: [
      "Más de 7 días antes del check-in: reembolso del 80% del anticipo.",
      "Entre 3 y 7 días antes: reembolso del 50% del anticipo.",
      "Menos de 72 horas o no presentación: sin reembolso del anticipo.",
    ],
    politicaPago:
      "Anticipo del 50% para confirmar la reserva. Saldo restante el día del check-in antes del ingreso.",
    avisoImpuestos:
      "Tarifas finales en pesos colombianos (COP). El servicio de alojamiento ocasional no genera IVA bajo el régimen aplicable.",
  },
  /** Fotografías reales para la cuadrícula «Así se vive LOFTHOUSE» y JSON-LD. */
  gallery: [
    {
      src: "/gallery/vive/01-fachada.png",
      alt: "Fachada de LOFTHOUSE 14 con escaleras de ingreso y cartel del establecimiento",
    },
    {
      src: "/gallery/vive/02-entrada.png",
      alt: "Interior luminoso del loft visto desde la puerta abierta, sofá y ventanal",
    },
    {
      src: "/gallery/vive/03-cocina.png",
      alt: "Cocina tipo loft bajo escalera con mesa para dos y equipamiento completo",
    },
    {
      src: "/gallery/vive/04-mesa.png",
      alt: "Mesa redonda con copas de vino y vajilla en rincón acogedor",
    },
    {
      src: "/gallery/vive/05-dormitorio.png",
      alt: "Dormitorio tendido con almohadas, televisión y cortinas",
    },
    {
      src: "/gallery/vive/06-sala.png",
      alt: "Sala de descanso con sofá junto a baranda en nivel elevado",
    },
    {
      src: "/gallery/vive/07-exterior.png",
      alt: "Zona exterior con bancas blancas y sombra de árboles",
    },
    {
      src: "/gallery/vive/08-acceso.png",
      alt: "Cerradura digital con teclado iluminado en puerta blanca",
    },
    {
      src: "/gallery/vive/09-detalle.png",
      alt: "Detalle de baño luminoso con cortina decorativa",
    },
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
