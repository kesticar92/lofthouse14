/**
 * Alertas stub para dashboard admin (sin depender de notificaciones DB).
 */

import { listLocalMaintenanceTickets } from "@/lib/ops/maintenance";
import { listLocalPayments } from "@/lib/payments/local-store";
import { listLocalReservations } from "@/lib/availability/local-store";
import { listDigitalCheckIns } from "@/lib/guest/check-in-store";

export type OpsAlert = {
  id: string;
  level: "info" | "warn" | "critical";
  title: string;
  message: string;
  href?: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function buildStubOpsAlerts(now = new Date()): OpsAlert[] {
  const today = now.toISOString().slice(0, 10);
  const alerts: OpsAlert[] = [];

  const openMaint = listLocalMaintenanceTickets().filter(
    (t) => t.status === "open" || t.status === "in_progress" || t.status === "blocked",
  );
  if (openMaint.length > 0) {
    const blocking = openMaint.filter((t) => t.blocks_availability).length;
    alerts.push({
      id: "maint-open",
      level: blocking > 0 ? "critical" : "warn",
      title: `${openMaint.length} ticket(s) de mantenimiento`,
      message:
        blocking > 0
          ? `${blocking} bloquean availability (OUT_OF_SERVICE).`
          : "Revisa prioridad y asignación.",
      href: "/admin/mantenimiento",
    });
  }

  const duePayments = listLocalPayments().filter(
    (p) => p.status === "pending" || p.status === "stub",
  );
  if (duePayments.length > 0) {
    const dueSum = duePayments.reduce(
      (acc, p) => acc + Math.max(0, p.amount - p.amount_paid),
      0,
    );
    alerts.push({
      id: "payments-due",
      level: "warn",
      title: `${duePayments.length} pago(s) pendientes`,
      message: `Saldo estimado ${dueSum.toLocaleString("es-CO")} COP (stub local).`,
      href: "/admin/pagos",
    });
  }

  const arrivals = listLocalReservations().filter(
    (r) =>
      r.status !== "cancelled" &&
      r.status !== "checked_out" &&
      r.check_in === today,
  );
  if (arrivals.length > 0) {
    const checked = listDigitalCheckIns().map((c) => c.reservation_code);
    const missing = arrivals.filter(
      (r) => !checked.includes(r.reservation_code),
    );
    alerts.push({
      id: "arrivals-today",
      level: missing.length ? "info" : "info",
      title: `${arrivals.length} llegada(s) hoy`,
      message:
        missing.length > 0
          ? `${missing.length} sin check-in digital aún.`
          : "Todas con check-in digital registrado (stub).",
      href: "/admin/reservas",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      level: "info",
      title: "Sin alertas operativas",
      message: `Stub · ${todayISO()} — crea mantenimiento, pagos o reservas locales para ver avisos.`,
      href: "/admin/mantenimiento",
    });
  }

  return alerts;
}
