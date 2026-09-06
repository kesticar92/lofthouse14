export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  body: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "que-hacer-parque-del-perro-cali",
    title: "Qué hacer cerca del Parque del Perro en Cali",
    description:
      "Guía local: gastronomía, salsa y servicios a pasos de Lofthouse 14 en Miraflores. Dónde hospedarse junto al Parque del Perro.",
    date: "2026-09-05",
    body: [
      "El Parque del Perro es el punto de encuentro de Miraflores: bares, restaurantes y una plaza que se llena al atardecer. Si te hospedas en un loft en Cali a pocos minutos a pie, puedes salir a cenar sin pedir un Uber cada noche.",
      "Desde Lofthouse 14 (Carrera 26 # 2-91) caminas hacia la zona gastronómica, farmacias y cajeros. San Fernando queda al lado, útil si vienes por clínicas o por el Estadio Pascual Guerrero. San Antonio y el centro histórico se alcanzan en un trayecto corto.",
      "Para una noche de salsa, combina una academia o un bar de la zona con un loft con ducha y aire acondicionado al volver. No hace falta un hotel genérico al otro lado de la ciudad: el valor de Miraflores es precisamente esa densidad de comida, cultura y servicios.",
      "Si viajas en grupo, reserva varios lofts en el mismo edificio y reúnanse en la calle o en un restaurante; las unidades no están pensadas para fiestas privadas. Familias y nómadas digitales usan la misma receta: cocina en el loft para desayunar y el Parque del Perro para todo lo demás.",
      "Reserva directo en lofthouse14.com con fechas y número de personas. El check-in es autónomo y el precio base parte desde $90.000 COP por noche en temporada baja.",
    ],
  },
  {
    slug: "restaurantes-miraflores-cali",
    title: "Restaurantes en Miraflores, Cali: cómo moverte desde el loft",
    description:
      "Dónde comer en Miraflores y el Parque del Perro si te hospedas en Lofthouse 14. Plan práctico para turistas y nómadas.",
    date: "2026-09-05",
    body: [
      "Miraflores concentra una de las ofertas gastronómicas más caminables de Cali. Hospedarte en un loft con cocina te da desayuno en casa; el almuerzo y la cena pueden ser en el Parque del Perro o en locales de San Fernando sin cruzar la ciudad.",
      "La recomendación local es simple: camina primero, reserva mesa en fines de semana, y deja el loft como base —no como restaurante clandestino para 20 personas. Cada unidad de Lofthouse 14 está equipada para comidas cotidianas, no para catering.",
      "Si viajas por trabajo o rotación médica, ten a mano farmacias y supermercados del barrio; no necesitas un mall para resolver la semana. El mapa de ubicación del sitio marca gastronomía, cultura y ocio alrededor de Carrera 26 # 2-91.",
    ],
  },
  {
    slug: "salsa-en-cali-donde-hospedarse",
    title: "Salsa en Cali: dónde hospedarse cerca del Parque del Perro",
    description:
      "Guía para bailarines y turistas de salsa: academias, rumba y loft privado en Miraflores. Check-in autónomo y A/C.",
    date: "2026-09-12",
    body: [
      "Cali es capital de la salsa: academias, socials y bares se concentran en el sur y el centro-sur. Si tu prioridad es bailar y dormir bien, un loft en Miraflores te deja a pasos del Parque del Perro sin ruido de hostel.",
      "Lofthouse 14 ofrece lofts privados con aire acondicionado, ducha y cocina. Ideal para parejas de baile o teams que toman varias unidades en el mismo edificio. El check-in es autónomo: llegas después de la clase o del aeropuerto sin esperar recepción.",
      "Reserva fechas con anticipación en temporada de festivales. No se permiten fiestas en el inmueble; la rumba está afuera. WhatsApp y el motor de reservas del sitio cierran la cotización en minutos.",
    ],
  },
  {
    slug: "hospedaje-cerca-clinicas-san-fernando-cali",
    title: "Hospedaje cerca de clínicas en San Fernando, Cali",
    description:
      "Lofts en Miraflores para pacientes y acompañantes: cocina, nevera, WiFi y check-in autónomo cerca de San Fernando.",
    date: "2026-09-19",
    body: [
      "Quien viaja por tratamiento o cirugía necesita nevera, cocina y silencio más que un lobby de hotel. Miraflores y San Fernando concentran clínicas, farmacias y consultorios a un trayecto corto.",
      "En Lofthouse 14 cada loft es privado: útil para paciente + acompañante (ideal 2, hasta 5). El check-in autónomo permite llegar a la hora de la cita. Estadías de varias noches o semanas se cotizan por WhatsApp.",
      "Si viene familia adicional, se asignan lofts extra en el mismo predio para no dispersarse por la ciudad. Reserva directo en el sitio o escribe con fechas y número de personas.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
