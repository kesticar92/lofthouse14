export type ReviewHighlight = {
  text: string;
  author: string;
  stars: number;
  date: string;
  source?: string;
};

/** Reseñas destacadas para página indexable y schema Review. */
export const REVIEW_HIGHLIGHTS: ReviewHighlight[] = [
  {
    text: "Excelente ubicación, todo queda cerca. El loft es cómodo, limpio y bien equipado. Sin duda volvería.",
    author: "Camila R.",
    stars: 5,
    date: "2025-11-12",
    source: "Google",
  },
  {
    text: "Perfecto para trabajar y salir a comer o tomar algo. El WiFi funcionó impecable toda la semana.",
    author: "Sebastián M.",
    stars: 5,
    date: "2025-12-03",
    source: "Google",
  },
  {
    text: "Volvería por la comodidad y la facilidad de todo. El ingreso autónomo es muy práctico, llegué tarde y no hubo problema.",
    author: "Laura G.",
    stars: 5,
    date: "2026-01-18",
    source: "Booking",
  },
  {
    text: "Vine por una cita médica y la cercanía a la clínica fue clave. El espacio es tranquilo y permite recuperarse bien.",
    author: "Jorge P.",
    stars: 5,
    date: "2026-02-02",
    source: "Google",
  },
  {
    text: "El barrio es increíble. A pasos del Parque del Perro, restaurantes y todo lo que necesitas. Una experiencia muy caleña.",
    author: "Valentina O.",
    stars: 5,
    date: "2026-02-20",
    source: "Airbnb",
  },
  {
    text: "Vinimos en grupo y coordinaron todo muy bien. Cada uno en su loft y todos cerca. La comunicación con el anfitrión fue excelente.",
    author: "Equipo Comercial",
    stars: 5,
    date: "2026-03-08",
    source: "Directo",
  },
  {
    text: "El apartamento es exactamente como en las fotos, sin sorpresas. Moderno, limpio y con todo lo necesario para una estadía larga.",
    author: "Ricardo F.",
    stars: 5,
    date: "2026-03-22",
    source: "Google",
  },
  {
    text: "Me encantó que pudiera llegar a cualquier hora sin depender de nadie. Acceso autónomo, simple y seguro.",
    author: "Natalia V.",
    stars: 5,
    date: "2026-04-05",
    source: "Booking",
  },
  {
    text: "La cocina equipada hizo la diferencia. Pudimos preparar nuestras cosas y ahorrar bastante. Muy buena relación precio-calidad.",
    author: "Familia Herrera",
    stars: 5,
    date: "2026-04-19",
    source: "Airbnb",
  },
  {
    text: "Modern loft near Parque del Perro. Clean, quiet, great kitchen and fast WiFi for remote work.",
    author: "Emma K.",
    stars: 5,
    date: "2026-05-01",
    source: "Google",
  },
];
