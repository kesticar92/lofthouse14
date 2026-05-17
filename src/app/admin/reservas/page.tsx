"use client";

import {
  AdminShell,
  AdminCard,
} from "@/components/admin/admin-shell";
import { PmsCalendarHub } from "@/components/admin/pms/pms-calendar-hub";
import { ReservationsTimeline } from "@/components/admin/pms/reservations-timeline";
import { usePmsModule } from "@/hooks/usePms";
import { useRequireAdminModule } from "@/hooks/useRequireAdminModule";
import {
  BlockDatesModal,
  NewReservationModal,
} from "@/features/pms/components/reservation-modals";
import { useReservasAdminPage } from "@/features/pms/hooks/use-reservas-admin-page";
import { cn } from "@/lib/cn";

export default function AdminReservasPage() {
  const { ready } = useRequireAdminModule();
  const pms = usePmsModule();
  const ui = useReservasAdminPage(pms);

  if (!ready) {
    return (
      <AdminShell>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Cargando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <ReservasPageContent ui={ui} pms={pms} />
    </AdminShell>
  );
}

function ReservasPageContent({
  ui,
  pms,
}: {
  ui: ReturnType<typeof useReservasAdminPage>;
  pms: ReturnType<typeof usePmsModule>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Reservas & ocupación
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
          Calendario tipo timeline para los{" "}
          <strong>14 lofts</strong> (el 4 es bodega) y el listado{" "}
          <strong>casa completa</strong> en Airbnb: importación iCal (solo
          lectura), arrastre de reservas entre alojamientos, reservas manuales y
          exportación iCal (delay de minutos, no en tiempo real).
        </p>
      </div>

      {(ui.msg || ui.err || pms.error) && (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-sm",
            ui.err || pms.error
              ? "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
          )}
        >
          <span>{ui.err || pms.error || ui.msg}</span>
          {ui.msg && !ui.err && !pms.error ? (
            <button
              type="button"
              className="shrink-0 text-xs underline opacity-80 hover:opacity-100"
              onClick={() => ui.setMsg(null)}
            >
              Cerrar
            </button>
          ) : null}
        </div>
      )}

      <AdminCard
        title="Calendarios iCal — importar y exportar"
        subtitle="Varias URLs de Airbnb → una propiedad en el PMS · un solo iCal de salida con todos los bloqueos (OTAs + manual)"
      >
        <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
          Estado:{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            Airbnb en lectura; hacia Airbnb/OTAs solo bloqueos vía iCal
            exportado (minutos de retraso).
          </strong>
        </p>
        {pms.loading ? (
          <p className="text-sm text-zinc-500">Cargando propiedades…</p>
        ) : (
          <PmsCalendarHub
            properties={pms.properties}
            sources={pms.icalSources}
            reservations={pms.reservations}
            selectedPropertyId={ui.selectedPropertyId}
            onSelectPropertyId={ui.setSelectedPropertyId}
            exportUrl={ui.exportUrl}
            busy={ui.busy}
            isSuperAdmin={ui.isSuperAdmin}
            onSyncAll={() => void ui.syncNow()}
            onAddImportUrl={ui.addImportUrl}
            onSyncOneSource={ui.syncOneSource}
            onDeleteSource={ui.deleteSource}
            onCopyExport={() => void ui.copyExport()}
            onOpenExport={() => {
              if (ui.exportUrl) {
                window.open(ui.exportUrl, "_blank", "noopener,noreferrer");
              }
            }}
            onRegenerateToken={() => void ui.regenerateToken()}
            onAddProperty={ui.addProperty}
            onRenameProperty={ui.renameProperty}
            onDeleteProperty={ui.deleteProperty}
          />
        )}
      </AdminCard>

      <AdminCard
        title="Vista calendario"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider dark:border-white/10"
              onClick={() => ui.shiftView(-7)}
            >
              ← 7 días
            </button>
            <button
              type="button"
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider dark:border-white/10"
              onClick={() => ui.shiftView(7)}
            >
              7 días →
            </button>
            <button
              type="button"
              disabled={ui.busy}
              onClick={ui.openNewReservation}
              className="rounded-full bg-amber-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
            >
              Nueva reserva
            </button>
          </div>
        }
      >
        {pms.loading ? (
          <p className="text-sm text-zinc-500">Cargando datos…</p>
        ) : (
          <ReservationsTimeline
            properties={pms.properties}
            reservations={pms.reservations}
            blocks={pms.blocks}
            viewFrom={pms.viewFrom}
            viewDays={pms.viewDays}
            onBlockRange={(propertyId, start, endInclusive) => {
              ui.setBlockDraft({ propertyId, start, endInclusive });
              ui.setShowBlock(true);
            }}
            onReservationPatch={ui.onReservationPatch}
          />
        )}
      </AdminCard>

      <NewReservationModal
        open={ui.showRes}
        busy={ui.busy}
        properties={pms.properties}
        selectedPropertyId={ui.selectedPropertyId}
        form={ui.resForm}
        onChange={(patch) => ui.setResForm((f) => ({ ...f, ...patch }))}
        onClose={() => ui.setShowRes(false)}
        onSubmit={(e) => void ui.submitReservation(e)}
      />

      <BlockDatesModal
        open={ui.showBlock}
        busy={ui.busy}
        draft={ui.blockDraft}
        reason={ui.blockReason}
        onReasonChange={ui.setBlockReason}
        onClose={() => ui.setShowBlock(false)}
        onSubmit={(e) => void ui.submitBlock(e)}
      />
    </div>
  );
}
