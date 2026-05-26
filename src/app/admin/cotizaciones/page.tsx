"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ApiClientError } from "@/lib/api/client";
import {
  DEFAULT_PRICING,
  type PricingConfig,
  type QuoteInput,
  formatCOP,
  quote,
} from "@/lib/pricing";
import { getPricingConfig } from "@/lib/cotizaciones-store";
import { KEYS, safeRemove } from "@/lib/storage";
import { site, waLink } from "@/lib/site";
import {
  PrintableQuote,
  generarFolio,
} from "@/components/admin/printable-quote";
import {
  useCotizaciones,
  useCotizacionesPricing,
  useCreateCotizacion,
  useDeleteCotizacion,
  useSaveCotizacionesPricing,
} from "@/features/cotizaciones/hooks";
import type { Cotizacion } from "@/features/cotizaciones/types";
import { MigrateLocalCotizacionesBanner } from "@/features/cotizaciones/migrate-banner";
import { useToast, useConfirm } from "@/components/ui";
import { useRequireAdminModule } from "@/hooks/useRequireAdminModule";
import { DatosReservaForm } from "@/features/cotizaciones/components/datos-reserva-form";
import { ResumenTotalCard } from "@/features/cotizaciones/components/resumen-total-card";
import { DesgloseNochesTable } from "@/features/cotizaciones/components/desglose-noches-table";
import { ConfigTarifasCard } from "@/features/cotizaciones/components/config-tarifas-card";
import { CotizacionesGuardadasList } from "@/features/cotizaciones/components/cotizaciones-guardadas-list";

function todayISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);
}

function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

function describeApiFailure(err: unknown): string {
  if (err instanceof ApiClientError && err.code === "NETWORK_ERROR") {
    return "Sin conexión con el servidor. Revisa tu red y que Supabase esté accesible.";
  }
  return err instanceof Error ? err.message : "Error desconocido";
}

export default function CotizacionesPage() {
  const { ready } = useRequireAdminModule();
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING);
  const [cliente, setCliente] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ingreso, setIngreso] = useState<string>("");
  const [salida, setSalida] = useState<string>("");
  const [huespedes, setHuespedes] = useState<number>(2);
  const [lofts, setLofts] = useState<number>(1);
  const [printFolio, setPrintFolio] = useState<string>("");
  const [printEmision, setPrintEmision] = useState<string>("");

  const toast = useToast();
  const confirm = useConfirm();
  const cotizacionesQuery = useCotizaciones();
  const saved = cotizacionesQuery.data ?? [];
  const createMut = useCreateCotizacion();
  const deleteMut = useDeleteCotizacion();
  const pricingQuery = useCotizacionesPricing();
  const savePricingMut = useSaveCotizacionesPricing();
  const migratedLocalPricing = useRef(false);

  useEffect(() => {
    const t = todayISO();
    setIngreso(t);
    setSalida(addDaysISO(t, 2));
  }, []);

  useEffect(() => {
    if (!pricingQuery.data) return;
    setConfig(pricingQuery.data);
  }, [pricingQuery.data]);

  useEffect(() => {
    if (!pricingQuery.isSuccess || migratedLocalPricing.current) return;
    migratedLocalPricing.current = true;
    const local = getPricingConfig(DEFAULT_PRICING);
    const remote = pricingQuery.data;
    const localDiffers =
      JSON.stringify(local) !== JSON.stringify(DEFAULT_PRICING) &&
      JSON.stringify(local) !== JSON.stringify(remote);
    if (localDiffers) {
      savePricingMut.mutate(local, {
        onSuccess: () => safeRemove(KEYS.pricing),
      });
    }
  }, [pricingQuery.isSuccess, pricingQuery.data, savePricingMut]);

  const input: QuoteInput = useMemo(
    () => ({
      checkIn: ingreso,
      checkOut: salida,
      huespedes,
      lofts,
    }),
    [ingreso, salida, huespedes, lofts],
  );
  const result = useMemo(() => quote(input, config), [input, config]);

  function handleConfigChange<K extends keyof PricingConfig>(
    key: K,
    value: PricingConfig[K],
  ) {
    const next = { ...config, [key]: value };
    setConfig(next);
    savePricingMut.mutate(next);
  }

  function handleConfigReset() {
    setConfig(DEFAULT_PRICING);
    savePricingMut.mutate(DEFAULT_PRICING);
  }

  async function handleSave() {
    if (!result.ok) return;
    const trimmedCliente = cliente.trim() || "Sin nombre";
    try {
      await createMut.mutateAsync({
        guest_name: trimmedCliente,
        check_in: input.checkIn,
        check_out: input.checkOut,
        guests: Math.max(1, input.huespedes),
        loft_id: String(input.lofts ?? 1),
        price_per_night:
          result.noches > 0 ? result.subtotalAlojamiento / result.noches : 0,
        total: result.totalReserva,
        notes: observaciones.trim(),
        status: "draft",
        metadata: {
          cliente: trimmedCliente,
          documento: documento.trim(),
          telefono: telefono.trim(),
          email: emailCliente.trim(),
          observaciones: observaciones.trim(),
          input,
          config,
          result,
        },
      });
      toast.success("Cotización guardada correctamente.");
    } catch (err) {
      const msg = describeApiFailure(err);
      toast.error("No se pudo guardar la cotización", { description: msg });
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: "¿Eliminar esta cotización?",
      description: "No se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Cotización eliminada.");
    } catch (err) {
      const msg = describeApiFailure(err);
      toast.error("No se pudo eliminar la cotización", { description: msg });
    }
  }

  function buildShareText(): string {
    if (!result.ok) return "";
    const lines = [
      `Hola ${cliente || ""}, esta es tu cotización con ${site.name}:`,
      `• Ingreso: ${ingreso}`,
      `• Salida: ${salida}`,
      `• Noches: ${result.noches} (${result.nochesLJ} L-J, ${result.nochesVD} V-D)`,
      `• Huéspedes: ${huespedes}  •  Lofts: ${lofts}`,
      "",
      `Alojamiento: ${formatCOP(result.subtotalAlojamiento)}`,
      result.recargoHuespedes > 0
        ? `Huésped(es) adicional(es): ${formatCOP(result.recargoHuespedes)}`
        : "",
      `Aseo: ${formatCOP(result.aseoTotal)}  (${result.aseoDetalle})`,
      result.descuento < 0
        ? `Descuento: ${formatCOP(result.descuento)}`
        : "Descuento: 0",
      `TOTAL RESERVA: ${formatCOP(result.totalReserva)}`,
      "",
      "Incluye acceso autónomo, limpieza completa y soporte por WhatsApp.",
      `📍 ${site.addressLine} · ${site.neighborhood} · ${site.city}`,
    ].filter(Boolean);
    return lines.join("\n");
  }

  function handleWhatsApp() {
    const text = buildShareText();
    if (!text) return;
    window.open(waLink(text), "_blank", "noopener,noreferrer");
  }

  function handlePrint() {
    if (!result.ok) return;
    const now = new Date();
    setPrintFolio(generarFolio(now));
    setPrintEmision(now.toISOString());
    requestAnimationFrame(() => {
      window.print();
    });
  }

  function handleCopy() {
    const text = buildShareText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Resumen copiado al portapapeles.");
    });
  }

  function loadCotizacion(c: Cotizacion) {
    setCliente(c.cliente);
    setDocumento(c.documento ?? "");
    setTelefono(c.telefono);
    setEmailCliente(c.email ?? "");
    setObservaciones(c.observaciones);
    setIngreso(c.input.checkIn);
    setSalida(c.input.checkOut);
    setHuespedes(c.input.huespedes);
    setLofts(c.input.lofts);
    if (c.config && Object.keys(c.config as object).length > 0) {
      setConfig(c.config);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!ready || pricingQuery.isLoading) {
    return (
      <AdminShell>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Cargando…</p>
      </AdminShell>
    );
  }

  if (pricingQuery.isError) {
    return (
      <AdminShell>
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudieron cargar las tarifas: {describeApiFailure(pricingQuery.error)}
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
            COTIZADOR
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Calcula el precio exacto de una reserva directa. Genera una
            cotización formal en PDF con los datos legales del establecimiento.
          </p>
        </div>
      </div>

      <MigrateLocalCotizacionesBanner />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DatosReservaForm
          cliente={cliente}
          setCliente={setCliente}
          documento={documento}
          setDocumento={setDocumento}
          telefono={telefono}
          setTelefono={setTelefono}
          emailCliente={emailCliente}
          setEmailCliente={setEmailCliente}
          ingreso={ingreso}
          setIngreso={setIngreso}
          salida={salida}
          setSalida={setSalida}
          huespedes={huespedes}
          setHuespedes={setHuespedes}
          lofts={lofts}
          setLofts={setLofts}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
          recargoHuesped={config.recargoHuesped}
        />

        <ResumenTotalCard
          result={result}
          onSave={handleSave}
          onWhatsApp={handleWhatsApp}
          onCopy={handleCopy}
          onPrint={handlePrint}
          saving={createMut.isPending}
        />
      </div>

      <DesgloseNochesTable result={result} />

      <ConfigTarifasCard
        config={config}
        onChange={handleConfigChange}
        onReset={handleConfigReset}
      />

      <CotizacionesGuardadasList
        cotizaciones={saved}
        onLoad={loadCotizacion}
        onDelete={handleDelete}
      />

      {/* Versión imprimible (PDF). Oculta en pantalla, visible solo al imprimir. */}
      {result.ok && printFolio && (
        <PrintableQuote
          folio={printFolio}
          emisionISO={printEmision}
          cliente={{
            nombre: cliente.trim() || "Sin nombre",
            documento: documento.trim(),
            telefono: telefono.trim(),
            email: emailCliente.trim() || undefined,
          }}
          estadia={{
            checkIn: ingreso,
            checkOut: salida,
            huespedes,
            lofts,
          }}
          result={result}
          observaciones={observaciones.trim() || undefined}
        />
      )}
    </AdminShell>
  );
}
