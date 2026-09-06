export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingMinutes: number;
  keywords: string[];
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "que-hacer-cerca-del-parque-del-perro-en-cali",
    title: "Qué hacer cerca del Parque del Perro en Cali",
    description:
      "Guía local: gastronomía, cultura y planes a pasos de Lofthouse 14 en Miraflores, Cali.",
    date: "2026-08-15",
    readingMinutes: 6,
    keywords: [
      "parque del perro cali",
      "miraflores cali",
      "qué hacer en cali",
      "lofts miraflores",
    ],
    body: [
      "El Parque del Perro es uno de los epicentros gastronómicos y sociales de Cali. Si te hospedas en Lofthouse 14, en el barrio Miraflores, tienes a minutos a pie cafés, restaurantes, bares y rincones culturales sin depender de taxis largos.",
      "Para una primera noche, camina la zona al atardecer: prueba un café especial, cena criolla o internacional y cierra con un plan suave. Si vienes por salsa, usa el loft como base segura: cocina propia, WiFi y check-in autónomo te dan flexibilidad cuando regresas tarde.",
      "En el día, combina Miraflores con San Fernando y puntos cercanos de cultura. Quienes llegan por citas médicas valoran la cercanía a clínicas y la posibilidad de descansar en un espacio privado con cocina.",
      "Reserva tu loft en Cali Miraflores directo con nosotros: fechas claras, tarifa desde $80.000/noche en temporada baja y coordinación por WhatsApp.",
    ],
  },
  {
    slug: "guia-nomadas-digitales-cali-miraflores",
    title: "Guía para nómadas digitales en Cali (Miraflores)",
    description:
      "WiFi, cafés, costos y por qué un loft en Miraflores funciona mejor que un hotel para trabajo remoto.",
    date: "2026-08-22",
    readingMinutes: 5,
    keywords: [
      "nómadas digitales cali",
      "wifi loft cali",
      "trabajo remoto miraflores",
    ],
    body: [
      "Cali atrae cada vez más nómadas digitales que buscan clima, comida y un barrio caminable. Miraflores, junto al Parque del Perro, mezcla vida local con espacios para trabajar.",
      "Un loft con cocina y WiFi estable reduce costos de restaurantes y te da rutina: mañana productiva, tarde explorando la ciudad. En Lofthouse 14 el check-in autónomo evita horarios rígidos de hotel.",
      "Tip práctico: avísanos si tienes llamadas importantes para orientarte sobre la unidad más adecuada. Cotiza estancias semanales o mensuales por WhatsApp.",
    ],
  },
  {
    slug: "alojamiento-medico-en-cali-cerca-de-clinicas",
    title: "Alojamiento médico en Cali cerca de clínicas",
    description:
      "Cómo elegir un loft tranquilo en Miraflores si vienes a Cali por tratamiento o acompañamiento familiar.",
    date: "2026-09-01",
    readingMinutes: 5,
    keywords: [
      "alojamiento médico cali",
      "hospedaje cerca clínicas cali",
      "loft miraflores",
    ],
    body: [
      "Quienes viajan a Cali por salud necesitan silencio, cocina sencilla y ubicación práctica. Un loft en Miraflores permite descansar entre citas sin el ruido de un hotel grande.",
      "En Lofthouse 14 puedes reservar una o varias unidades si viaja el núcleo familiar. El ingreso autónomo facilita llegadas irregulares según horarios médicos.",
      "Escríbenos con fechas flexibles: armamos cotización clara y te orientamos sobre la mejor unidad para tu estadía.",
    ],
  },
];

export function getPostBySlug(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
