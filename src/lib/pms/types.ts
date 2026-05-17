// =============================================================================
// src/lib/pms/types.ts
// -----------------------------------------------------------------------------
// Tipos del dominio PMS (propiedades, reservas, bloqueos, fuentes iCal).
//
// IMPORTANTE: los `*Row` se derivan AUTOMÁTICAMENTE de los tipos generados
// de Supabase (`@/types/database.types`). NO los redefinas a mano: si una
// columna cambia en la BD, regenera `database.types.ts` y este archivo se
// actualiza solo.
//
// Los union literals (`ReservationStatus`, `ReservationSource`) son tipos
// del *dominio* (UI, validación, lógica de negocio). Se mantienen aparte
// porque la BD guarda `status`/`source` como `text` libre — usa los helpers
// `isReservationStatus()` y `isReservationSource()` para narrow seguro.
// =============================================================================

import type { Tables } from "@/types/database.types";

// ----- Filas tal como vienen de la BD (Database type generado) --------------
export type PropertyRow = Tables<"properties">;
export type ReservationRow = Tables<"reservations">;
export type AvailabilityBlockRow = Tables<"availability_blocks">;
export type IcalSourceRow = Tables<"ical_sources">;
export type CleaningTaskRow = Tables<"cleaning_tasks">;

// ----- Tipos del dominio (no en la BD; usados por UI/validación) ------------
export const RESERVATION_STATUSES = [
  "confirmed",
  "blocked",
  "cancelled",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_SOURCES = [
  "airbnb",
  "booking",
  "expedia",
  "lofthouse14.com",
  "direct",
  "referral",
  "manual",
] as const;
export type ReservationSource = (typeof RESERVATION_SOURCES)[number] | string;

export function isReservationStatus(s: string): s is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(s);
}

// ----- Alertas calculadas (no son tablas) ----------------------------------
export type SuspiciousGapAlert = {
  property_id: string;
  property_name?: string;
  gap_start: string;
  gap_end: string;
  nights: number;
  message: string;
};
