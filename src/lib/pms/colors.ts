import type { ReservationSource } from "@/lib/pms/types";

/** Colores timeline (origen OTA / directa / bloqueo).
 *  Las OTA conservan su color aun cuando el `status` sea `blocked`: muchos
 *  feeds iCal (caso Airbnb "Not available") clasifican como bloqueo lo que en
 *  realidad es una reserva confirmada sin datos del huésped. Pintarla del
 *  color de la OTA permite distinguirla a simple vista de un bloqueo manual.
 *  Solo cuando el `source` no es una OTA reconocida y el `status` es
 *  `blocked`, usamos el gris zinc. */
export function reservationBarClasses(source: string, status: string): string {
  const s = source.toLowerCase();
  if (s === "booking" || s === "booking.com") {
    return "bg-sky-600/90 text-white ring-1 ring-sky-900/20";
  }
  if (s === "airbnb") {
    return "bg-orange-500/90 text-white ring-1 ring-orange-900/20";
  }
  if (s === "expedia") {
    return "bg-amber-300/95 text-zinc-900 ring-1 ring-amber-700/25";
  }
  if (s === "lofthouse14.com" || s === "web" || s === "website") {
    return "bg-violet-600/90 text-white ring-1 ring-violet-900/20";
  }
  if (s === "referral" || s === "referido") {
    return "bg-rose-600/90 text-white ring-1 ring-rose-900/20";
  }
  if (s === "direct" || s === "manual") {
    return "bg-emerald-600/90 text-white ring-1 ring-emerald-900/20";
  }
  if (status === "blocked") {
    return "bg-zinc-500/90 text-white ring-1 ring-zinc-700/30";
  }
  return "bg-zinc-400/90 text-white ring-1 ring-zinc-700/20";
}

export function sourceLabel(source: ReservationSource): string {
  const m: Record<string, string> = {
    airbnb: "Airbnb",
    booking: "Booking.com",
    "booking.com": "Booking.com",
    expedia: "Expedia",
    "lofthouse14.com": "lofthouse14.com",
    web: "Web",
    direct: "Directa",
    manual: "Directa",
    referral: "Referido",
    referido: "Referido",
  };
  return m[String(source).toLowerCase()] ?? source;
}
