/** Generación de códigos de reserva públicos (Fase 4). */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReservationCode(prefix = "LH"): string {
  let body = "";
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 6; i++) {
    body += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${prefix}-${body}`;
}

export function isValidReservationCode(code: string): boolean {
  return /^[A-Z]{2}-[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}
