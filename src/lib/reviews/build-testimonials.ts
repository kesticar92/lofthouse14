import googleReviewsData from "@/app/scrapper/reviews/reseñas_google.json";
import airbnbReviewsData from "@/app/scrapper/reviews/reseñas_airbnb.json";
import bookingReviewsData from "@/app/scrapper/reviews/reseñas_booking.json";
import type {
  AirbnbReviewRow,
  AirbnbReviewsFile,
  BookingReviewRow,
  BookingReviewsFile,
  GoogleReviewRow,
  Testimonial,
} from "./types";
import { airbnbListingById } from "./airbnb-listings";
import { sanitizeReviewText } from "./sanitize-review-text";
import { format } from "date-fns";

function parseNumeric(raw: string): number | null {
  const n = parseFloat(raw.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isNaN(n) ? null : n;
}

function parseStarRating(raw: string): number {
  const n = parseNumeric(raw);
  if (n === null) return 5;
  return Math.min(5, Math.max(0, n));
}

function parseBookingScore(raw: string): number {
  const n = parseNumeric(raw);
  if (n === null) return 8;
  return Math.min(10, Math.max(0, n));
}

export function formatBookingScore(score: number): string {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: score % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(score);
}

function assertRequiredSources(items: Testimonial[]): void {
  const hasGoogle = items.some((i) => i.source === "google");
  const hasBooking = items.some((i) => i.source === "booking");
  if (!hasGoogle || !hasBooking) {
    throw new Error(
      "Reseñas incompletas: Google y Booking deben estar presentes en los JSON de reviews/.",
    );
  }
}

function bookingPart(raw: string | undefined): string | null {
  const cleaned = sanitizeReviewText(raw ?? "");
  if (!cleaned) return null;
  if (/^(n\/a|na|n\.a\.)$/i.test(cleaned)) return null;
  return cleaned;
}

function bookingDisplayText(
  pos: string | null,
  neg: string | null,
  legacy?: string,
): string {
  const parts = [pos, neg].filter(Boolean) as string[];
  if (parts.length) return parts.join(" · ");
  return reviewText(legacy);
}

function reviewText(raw: string | undefined): string {
  const cleaned = sanitizeReviewText(raw ?? "");
  if (cleaned) return cleaned;
  return "(Sin comentario escrito)";
}

function googleFallbackDate(id: number): string {
  const base = new Date("2024-08-01T12:00:00Z");
  base.setDate(base.getDate() + id * 21);
  return base.toISOString().slice(0, 10);
}

function bookingFallbackDate(index: number): string {
  const base = new Date("2026-06-01T12:00:00Z");
  base.setDate(base.getDate() - index * 14);
  return base.toISOString().slice(0, 10);
}

function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function isOnOrBeforeToday(iso: string | null): boolean {
  if (!iso) return true;
  return iso <= todayISO();
}

export function buildTestimonialsFromSources(
  googleReviewsData: unknown,
  airbnbReviewsData: unknown,
  bookingReviewsData: unknown,
): Testimonial[] {
  const airbnbFile = airbnbReviewsData as AirbnbReviewsFile;
  const items: Testimonial[] = [];
  const bookingFile = bookingReviewsData as BookingReviewsFile;

  const googleRows: GoogleReviewRow[] = Array.isArray(googleReviewsData)
    ? (googleReviewsData as GoogleReviewRow[])
    : ((googleReviewsData as { reseñas?: GoogleReviewRow[] }).reseñas ?? []);

  for (const r of googleRows) {
    items.push({
      id: `google-${r.id}`,
      text: reviewText(r.comentario),
      image: "/default-avatar.png",
      name: r.nombre.trim(),
      starRating: parseStarRating(r.calificacion),
      source: "google",
      reviewDate: r.fecha?.trim() || googleFallbackDate(r.id),
    });
  }

  for (const r of airbnbFile.reseñas as AirbnbReviewRow[]) {
    const meta = airbnbListingById(r.listing_id);
    items.push({
      id: `airbnb-${r.listing_id}-${r.nombre}-${r.fecha}`.replace(/\s+/g, "-"),
      text: reviewText(r.comentario),
      image: r.avatar?.trim() || "/default-avatar.png",
      name: r.nombre.trim(),
      starRating: parseStarRating(r.calificacion),
      source: "airbnb",
      reviewDate: r.fecha,
      listingUrl: meta?.url,
      listingLabel: meta?.label,
      loftCode: meta?.loftCode,
    });
  }

  for (let index = 0; index < bookingFile.reseñas.length; index++) {
    const r = bookingFile.reseñas[index] as BookingReviewRow;
    const bookingPositive = bookingPart(r.comentario_positivo);
    const bookingNegative = bookingPart(r.comentario_negativo);
    items.push({
      id: `booking-${r.nombre}-${index}`.replace(/\s+/g, "-"),
      text: bookingDisplayText(
        bookingPositive,
        bookingNegative,
        r.comentario,
      ),
      image: "/default-avatar.png",
      name: r.nombre.trim(),
      starRating: 0,
      bookingScore: parseBookingScore(r.calificacion),
      source: "booking",
      reviewDate: r.fecha?.trim() || bookingFallbackDate(index),
      bookingPositive,
      bookingNegative,
    });
  }

  items.sort((a, b) => {
    if (!a.reviewDate && !b.reviewDate) return 0;
    if (!a.reviewDate) return 1;
    if (!b.reviewDate) return -1;
    return b.reviewDate.localeCompare(a.reviewDate);
  });

  assertRequiredSources(items);

  return items.filter((item) => isOnOrBeforeToday(item.reviewDate));
}

export function buildTestimonials(): Testimonial[] {
  return buildTestimonialsFromSources(
    googleReviewsData,
    airbnbReviewsData,
    bookingReviewsData,
  );
}

export type ReviewSourceCounts = {
  total: number;
  google: number;
  airbnb: number;
  booking: number;
};

export function countBySource(items: Testimonial[]): ReviewSourceCounts {
  const counts: ReviewSourceCounts = {
    total: items.length,
    google: 0,
    airbnb: 0,
    booking: 0,
  };
  for (const item of items) {
    counts[item.source] += 1;
  }
  return counts;
}

export function formatReviewDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function monthKey(iso: string | null): string | null {
  if (!iso || iso.length < 7) return null;
  return iso.slice(0, 7);
}

export function formatMonthLabel(monthKeyStr: string): string {
  const d = new Date(`${monthKeyStr}-01T12:00:00`);
  if (Number.isNaN(d.getTime())) return monthKeyStr;
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(d);
}
