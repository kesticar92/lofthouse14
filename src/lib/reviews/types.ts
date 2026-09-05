export type ReviewSource = "google" | "airbnb" | "booking";

export interface Testimonial {
  id: string;
  text: string;
  image: string;
  name: string;
  /** 1–5 estrellas (Google y Airbnb). */
  starRating: number;
  /** Escala 0–10 de Booking.com (solo source booking). */
  bookingScore?: number;
  source: ReviewSource;
  /** ISO 8601 (YYYY-MM-DD). Null = sin fecha conocida (se ordena al final). */
  reviewDate: string | null;
  /** Solo reseñas Airbnb: enlace a la publicación. */
  listingUrl?: string;
  listingLabel?: string;
  /** Código de unidad: 01, 02, … 14 o casa (grupos). */
  loftCode?: string;
  /** Booking: bloque positivo / negativo como en Booking.com */
  bookingPositive?: string | null;
  bookingNegative?: string | null;
}

export interface GoogleReviewRow {
  id: number;
  nombre: string;
  calificacion: string;
  comentario: string;
  /** Opcional: YYYY-MM-DD */
  fecha?: string;
}

export interface AirbnbReviewRow {
  nombre: string;
  calificacion: string;
  comentario: string;
  fecha: string;
  listing_id: string;
  avatar?: string;
}

export interface AirbnbReviewsFile {
  origen: string;
  actualizado?: string;
  listings: { id: string; url: string; label: string; loftCode?: string }[];
  reseñas: AirbnbReviewRow[];
}

export interface BookingReviewRow {
  nombre: string;
  calificacion: string;
  /** Legacy: texto combinado (solo respaldo). */
  comentario?: string;
  comentario_positivo?: string;
  comentario_negativo?: string;
  fecha?: string;
}

export interface BookingReviewsFile {
  origen: string;
  total_reseñas: number;
  reseñas: BookingReviewRow[];
}
