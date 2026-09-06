import { LOFTS_HABITACIONALES } from "@/lib/inventory-catalog";

export type LoftPage = {
  number: number;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  highlight: string;
  maxGuests: number;
  beds: number;
  bedType: string;
  priceFromCop: number;
  floorHint: string;
  amenities: string[];
  images: string[];
};

const SHARED_AMENITIES = [
  "WiFi",
  "Aire acondicionado",
  "Cocina equipada",
  "Smart TV",
  "Baño privado",
  "Check-in autónomo",
];

const IMAGE_SETS = [
  [
    "/gallery/cocina_1_resultado.webp",
    "/gallery/immersive/01-cocina_completa_comedor_escalera_izquierda.jpg",
    "/gallery/immersive/18-sala_cocina_escalera.jpg",
  ],
  [
    "/gallery/cuarto_1_resultado.webp",
    "/gallery/immersive/21-sofacamas_izquierda.jpg",
    "/gallery/immersive/07-escalera_5.jpg",
  ],
  [
    "/gallery/sofa_1_resultado.webp",
    "/gallery/immersive/19-sofa_cocina_escalera.jpg",
    "/gallery/immersive/53-comedor_con_cena.jpg",
  ],
  [
    "/gallery/cuarto_4_resultado.webp",
    "/gallery/immersive/20-sofaca_escalera_5.jpg",
    "/gallery/immersive/02-cocina_derecha.jpg",
  ],
] as const;

const COPY: Record<
  number,
  { name: string; highlight: string; description: string; floorHint: string }
> = {
  1: {
    name: "Loft 01 — Miraflores Cali",
    highlight: "Vista cercana al ritmo del barrio y cocina completa",
    floorHint: "Unidad con buena luz natural y acceso ágil",
    description:
      "El Loft 01 en Lofthouse 14 es un apartaestudio moderno en el barrio Miraflores de Cali, a pasos del Parque del Perro. Ideal para pareja o viajero solo, combina cocina equipada, aire acondicionado y WiFi estable para trabajo remoto o turismo. El check-in autónomo te permite llegar a tu hora sin filas. Desde aquí caminas a cafés, clínicas cercanas y vida nocturna caleña. Reserva directo y evita comisiones de intermediarios: cotizamos por WhatsApp con fechas claras y tarifa desde $80.000 por noche en temporada baja.",
  },
  2: {
    name: "Loft 02 — Base en Parque del Perro",
    highlight: "Tranquilo para descansar después de recorrer Cali",
    floorHint: "Espacio compacto y funcional",
    description:
      "El Loft 02 de Lofthouse 14 te ubica en el corazón de Miraflores, la zona del Parque del Perro en Cali. Es un loft con cocina, baño privado y área de descanso pensado para estadías cortas o semanales. Perfecto si vienes por gastronomía, salsa o citas médicas y quieres un hospedaje limpio cerca de todo. Incluye WiFi, A/C y Smart TV. Coordinamos tu ingreso autónomo tras el anticipo. Consulta disponibilidad por WhatsApp y arma tu reserva directa con nosotros.",
  },
  3: {
    name: "Loft 03 — Cocina y descanso en Cali",
    highlight: "Cocina práctica para ahorrar en restaurantes",
    floorHint: "Distribución tipo loft con entrepiso",
    description:
      "En el Loft 03 de Lofthouse 14 cocinas con comodidad y descansas en un espacio moderno del barrio Miraflores. Este alojamiento en Cali conviene a parejas, nómadas digitales y viajeros que valoran privacidad sin hotel tradicional. Estás cerca del Parque del Perro, restaurantes y servicios. WiFi para reuniones, aire acondicionado y check-in autónomo. Capacidad ideal para 2 personas (máx. 5). Reserva sin intermediarios desde $80.000/noche según temporada.",
  },
  5: {
    name: "Loft 05 — Miraflores con privacidad",
    highlight: "Distribución íntima para parejas o trabajo remoto",
    floorHint: "Layout más íntimo dentro del conjunto",
    description:
      "El Loft 05 en Lofthouse 14 ofrece un layout más íntimo dentro del conjunto de lofts en Miraflores, Cali. Ideal si buscas silencio para trabajar o recuperarte tras una cita médica, sin alejarte del Parque del Perro. Cocina equipada, WiFi, A/C y baño privado. El ingreso es autónomo: verificamos identidad, confirmas anticipo y entras con instrucciones claras. Cotiza fechas por WhatsApp y asegura tu loft con reserva directa.",
  },
  6: {
    name: "Loft 06 — Hospedaje cerca de todo",
    highlight: "Punto de partida para gastronomía y cultura",
    floorHint: "Acceso cómodo al corredor del edificio",
    description:
      "El Loft 06 de Lofthouse 14 es tu base en Cali para recorrer Miraflores y el Parque del Perro. Apartaestudio con lo esencial: cama cómoda, cocina, WiFi y aire acondicionado. Sirve igual para turismo de fin de semana, rotaciones médicas o grupos que reservan varios lofts en el mismo edificio. Check-in flexible y autónomo. Escribe por WhatsApp con fechas y número de huéspedes para una cotización clara en COP.",
  },
  7: {
    name: "Loft 07 — Luz y barrio caleño",
    highlight: "Ambiente luminoso cerca de cafés y clínicas",
    floorHint: "Buena iluminación natural",
    description:
      "El Loft 07 en Lofthouse 14 destaca por un ambiente luminoso en el barrio Miraflores de Cali. Hospedaje tipo loft con cocina, Smart TV y WiFi para streaming o trabajo. A minutos a pie de gastronomía, cultura y servicios médicos de la zona Parque del Perro. Perfecto para estadías de 2 a 7 noches o más. Reserva directa: sin sorpresas de plataforma, anticipo del 50% y saldo al check-in.",
  },
  8: {
    name: "Loft 08 — Estadía flexible en Cali",
    highlight: "Buena opción para noches sueltas o semanas",
    floorHint: "Versátil para corta o media estadía",
    description:
      "El Loft 08 de Lofthouse 14 está pensado para estadías flexibles en Cali: desde una noche hasta semanas de trabajo remoto. Ubicado en Miraflores, cerca del Parque del Perro, incluye cocina equipada, A/C y baño privado. Puedes combinarlo con otros lofts del edificio si viajas en grupo (hasta 63 personas en total). Confirmamos disponibilidad y tarifa por WhatsApp con check-in autónomo.",
  },
  9: {
    name: "Loft 09 — Refugio urbano Miraflores",
    highlight: "Espacio moderno para parejas y viajeros",
    floorHint: "Refugio urbano dentro del conjunto",
    description:
      "El Loft 09 en Lofthouse 14 es un refugio urbano en Miraflores, Cali. Ideal para parejas que quieren privacidad y cocina propia cerca de la vida del Parque del Perro. WiFi estable, aire acondicionado y Smart TV. El proceso de reserva es simple: fechas, huéspedes, anticipo y acceso digital. Evita intermediarios y recibe atención directa del anfitrión. Tarifa desde $80.000 por noche en temporada baja para 2 personas.",
  },
  10: {
    name: "Loft 10 — Ideal para nómadas digitales",
    highlight: "WiFi y cocina para semanas de trabajo remoto",
    floorHint: "Orientado a estancias productivas",
    description:
      "El Loft 10 de Lofthouse 14 conviene a nómadas digitales que buscan loft en Cali con WiFi confiable, cocina y un barrio con cafés a pasos. Estás en Miraflores, zona Parque del Perro: mix de vida local, gastronomía y tranquilidad para enfocarte. Check-in autónomo, A/C y espacio tipo apartaestudio. Cotiza estancias semanales o mensuales por WhatsApp y reserva directo con Lofthouse 14.",
  },
  11: {
    name: "Loft 11 — Cerca de clínicas y servicios",
    highlight: "Ubicación estratégica para estadías médicas",
    floorHint: "Práctico para acompañantes y pacientes",
    description:
      "El Loft 11 en Lofthouse 14 está pensado para quienes llegan a Cali por citas médicas o acompañamiento familiar. En Miraflores tienes acceso a servicios y un espacio tranquilo para recuperarte, con cocina y baño privado. El Parque del Perro queda cerca para una caminata suave. Ingreso autónomo, WiFi y A/C. Reserva directa por WhatsApp con fechas flexibles según tu agenda clínica.",
  },
  12: {
    name: "Loft 12 — Salsa, noche y descanso",
    highlight: "Vuelve a descansar cerca de la vida caleña",
    floorHint: "Perfecto tras noches de salsa y ciudad",
    description:
      "El Loft 12 de Lofthouse 14 es la base perfecta si vienes a Cali por salsa, cultura o turismo nocturno. Duerme en Miraflores, a pasos del Parque del Perro, y despierta en un loft con cocina y aire acondicionado. Ideal para bailarines, parejas y amigos que reservan uno o varios lofts juntos. Check-in autónomo a cualquier hora razonable tras confirmación. Escribe por WhatsApp y asegura tu unidad.",
  },
  13: {
    name: "Loft 13 — Grupos y familia en el mismo edificio",
    highlight: "Combínalo con lofts vecinos para más capacidad",
    floorHint: "Fácil de combinar con unidades contiguas",
    description:
      "El Loft 13 en Lofthouse 14 funciona solo o en combinación con lofts vecinos para familias y grupos en Cali. Cada unidad es privada, con cocina y baño, pero todos comparten el mismo edificio en Miraflores. Así evitas hoteles dispersos y coordinas un solo punto de encuentro cerca del Parque del Perro. Capacidad por loft hasta 5 personas. Pedimos fechas y total de huéspedes por WhatsApp para armar la cotización.",
  },
  14: {
    name: "Loft 14 — Cierre del conjunto en Miraflores",
    highlight: "Misma calidad, misma ubicación estratégica",
    floorHint: "Misma experiencia Lofthouse 14",
    description:
      "El Loft 14 completa el conjunto habitacional de Lofthouse 14 en el barrio Miraflores de Cali. Mismo estándar: cocina equipada, WiFi, A/C, Smart TV y check-in autónomo. Perfecto para turistas, nómadas, pacientes y grupos que necesitan varias unidades en el mismo lugar. Ubicación estratégica junto al Parque del Perro. Reserva directo desde $80.000/noche (2 personas, temporada baja) y recibe confirmación clara por WhatsApp.",
  },
};

export const LOFTS: LoftPage[] = LOFTS_HABITACIONALES.map((number, index) => {
  const copy = COPY[number];
  const padded = String(number).padStart(2, "0");
  return {
    number,
    slug: `loft-${padded}-cali-miraflores`,
    name: copy.name,
    shortName: `Loft ${padded}`,
    description: copy.description,
    highlight: copy.highlight,
    maxGuests: 5,
    beds: 1,
    bedType: "Queen / sofá cama según unidad",
    priceFromCop: 80_000,
    floorHint: copy.floorHint,
    amenities: SHARED_AMENITIES,
    images: [...IMAGE_SETS[index % IMAGE_SETS.length]],
  };
});

export function getLoftBySlug(slug: string) {
  return LOFTS.find((l) => l.slug === slug);
}
