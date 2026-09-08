import type { ReservationSource } from "@/lib/pms/types";

/** Colores timeline (origen OTA / directa / bloqueo / estado operativo). */
export function reservationBarClasses(source: string, status: string): string {
  const st = status.toLowerCase();
  if (st === "blocked" || st === "cancelled") {
    return "bg-zinc-500/90 text-white ring-1 ring-zinc-700/30";
  }
  if (st === "pending") {
    return "bg-amber-500/90 text-zinc-900 ring-1 ring-amber-800/25";
  }
  if (st === "checked_in") {
    return "bg-teal-600/95 text-white ring-1 ring-teal-900/25";
  }
  if (st === "checked_out" || st === "no_show") {
    return "bg-zinc-400/80 text-white ring-1 ring-zinc-600/20 opacity-80";
  }

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
  return "bg-zinc-400/90 text-white ring-1 ring-zinc-700/20";
}

/** Estilos de bloqueo según block_type (migración 021). */
export function blockBarClasses(blockType?: string | null): string {
  const t = (blockType ?? "manual").toLowerCase();
  if (t === "out_of_service") {
    return "bg-red-700/55 ring-1 ring-red-900/40 dark:bg-red-800/50";
  }
  if (t === "maintenance") {
    return "bg-orange-700/45 ring-1 ring-orange-900/30 dark:bg-orange-800/40";
  }
  if (t === "owner") {
    return "bg-indigo-600/40 ring-1 ring-indigo-900/25 dark:bg-indigo-700/40";
  }
  return "bg-zinc-500/40 ring-1 ring-zinc-600/25 dark:bg-zinc-600/45";
}

export function blockTypeLabel(blockType?: string | null): string {
  const m: Record<string, string> = {
    manual: "Manual",
    maintenance: "Mantenimiento",
    out_of_service: "Fuera de servicio",
    owner: "Owner",
    other: "Otro",
  };
  const t = (blockType ?? "manual").toLowerCase();
  return m[t] ?? blockType ?? "Manual";
}

export function statusLabel(status: string): string {
  const m: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    blocked: "Bloqueada",
    cancelled: "Cancelada",
    checked_in: "Check-in",
    checked_out: "Check-out",
    no_show: "No-show",
  };
  return m[status.toLowerCase()] ?? status;
}

export function isOutOfServiceUnit(
  status?: string | null,
): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "out_of_service" || s === "maintenance" || s === "inactive";
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
