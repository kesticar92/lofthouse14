import { site } from "@/lib/site";

export type LandingPage = {
  slug: string;
  path: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  bullets: string[];
  ctaLabel: string;
  waMessage: string;
};

export const LANDINGS: LandingPage[] = [
  {
    slug: "grupos",
    path: "/grupos",
    title: "Alquiler Lofts para Grupos en Cali · Hasta 63 personas",
    h1: "Lofts para grupos en Cali — hasta 63 personas en Miraflores",
    description:
      "Aloja a tu grupo completo en Cali. Hasta 63 personas en lofts privados en Miraflores. Coordinación incluida, precio por loft. Solicita cotización vía WhatsApp.",
    intro:
      "Delegaciones, familias grandes, equipos y viajes corporativos: reserva varios lofts en el mismo edificio cerca del Parque del Perro. Cada unidad es privada; la logística es una sola.",
    bullets: [
      `Hasta ${site.maxGuests} huéspedes en ${site.maxLofts} lofts`,
      "Precio por loft, cotización clara por WhatsApp",
      "Check-in autónomo coordinado para todo el grupo",
      "Misma ubicación: Miraflores, Cali",
    ],
    ctaLabel: "Cotizar grupo por WhatsApp",
    waMessage:
      "Hola! Somos un grupo y quiero cotizar varios lofts en Lofthouse 14. Fechas ____, personas ____.",
  },
  {
    slug: "nomadas",
    path: "/nomadas-digitales",
    title: "Lofts con WiFi para Nómadas Digitales en Cali",
    h1: "Lofts con WiFi para nómadas digitales en Cali",
    description:
      "Lofts en Miraflores con cocina, A/C y WiFi para trabajo remoto. Cerca del Parque del Perro. Reserva directa desde $90.000/noche.",
    intro:
      "Trabaja remoto desde un loft real en Miraflores: cocina propia, WiFi estable y un barrio caminable. Ideal para semanas o meses sin el costo fijo de hotel.",
    bullets: [
      "WiFi para calls y streaming",
      "Cocina equipada para ahorrar",
      "Check-in autónomo y horarios flexibles",
      "Barrio con cafés a pasos",
    ],
    ctaLabel: "Reservar como nómada",
    waMessage:
      "Hola! Soy nómada digital y quiero reservar un loft en Lofthouse 14. Fechas ____.",
  },
  {
    slug: "medico",
    path: "/alojamiento-medico",
    title: "Alojamiento Médico Cali · Cerca Clínicas",
    h1: "Alojamiento médico en Cali cerca de clínicas",
    description:
      "Lofts tranquilos en Miraflores para pacientes y acompañantes. Cocina, WiFi y check-in autónomo. Reserva directa por WhatsApp.",
    intro:
      "Si vienes a Cali por tratamiento o acompañamiento, necesitas silencio, cocina sencilla y ubicación práctica. Nuestros lofts en Miraflores están pensados para eso.",
    bullets: [
      "Espacio privado para recuperar energía",
      "Cocina para dietas y horarios irregulares",
      "Ingreso autónomo según tu agenda médica",
      "Opción de varios lofts para la familia",
    ],
    ctaLabel: "Consultar estadía médica",
    waMessage:
      "Hola! Necesito alojamiento médico en Cali cerca de clínicas. Fechas ____, personas ____.",
  },
  {
    slug: "salsa",
    path: "/salsa-cali",
    title: "Hospedaje para Salsa en Cali · Miraflores",
    h1: "Hospedaje para amantes de la salsa en Cali",
    description:
      "Duerme en Miraflores cerca del Parque del Perro y vive la noche caleña. Lofts con cocina y check-in autónomo. Reserva directo.",
    intro:
      "Cali es salsa. Hospedarte en Miraflores te deja cerca de la energía de la ciudad y con un loft seguro al volver. Ideal para bailarines, festivales y escapadas de fin de semana.",
    bullets: [
      "Base cerca de la vida nocturna y cultural",
      "Check-in autónomo si llegas tarde",
      "Cocina y A/C para recuperar",
      "Grupos: varios lofts en el mismo edificio",
    ],
    ctaLabel: "Reservar para salsa",
    waMessage:
      "Hola! Vengo a Cali por salsa y quiero reservar en Lofthouse 14. Fechas ____.",
  },
];

export function getLandingBySlug(slug: string) {
  return LANDINGS.find((l) => l.slug === slug);
}
