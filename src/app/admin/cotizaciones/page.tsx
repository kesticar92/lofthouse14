"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import {
  DEFAULT_PRICING,
  type PricingConfig,
  type QuoteInput,
  formatCOP,
  quote,
} from "@/lib/pricing";
import {
  getPricingConfig,
  guardarCotizacion,
  listarCotizaciones,
  eliminarCotizacion,
  setPricingConfig,
  type CotizacionGuardada,
} from "@/lib/cotizaciones-store";
import { site, waLink } from "@/lib/site";

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

function newId() {
  return (
    "c_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  );
}

export default function CotizacionesPage() {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ingreso, setIngreso] = useState<string>("");
  const [salida, setSalida] = useState<string>("");
  const [huespedes, setHuespedes] = useState<number>(2);
  const [lofts, setLofts] = useState<number>(1);
  const [saved, setSaved] = useState<CotizacionGuardada[]>([]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getPricingConfig(DEFAULT_PRICING));
    setSaved(listarCotizaciones());
    const t = todayISO();
    setIngreso(t);
    setSalida(addDaysISO(t, 2));
  }, []);

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
    setPricingConfig(next);
  }

  function handleSave() {
    if (!result.ok) return;
    const cot: CotizacionGuardada = {
      id: newId(),
      creadaEn: new Date().toISOString(),
      cliente: cliente.trim() || "Sin nombre",
      telefono: telefono.trim(),
      observaciones: observaciones.trim(),
      input,
      config,
      result,
    };
    guardarCotizacion(cot);
    setSaved(listarCotizaciones());
    setSavedMsg("Cotización guardada correctamente.");
    setTimeout(() => setSavedMsg(null), 3500);
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta cotización?")) return;
    eliminarCotizacion(id);
    setSaved(listarCotizaciones());
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
    const telDigits = telefono.replace(/\D/g, "");
    if (telDigits.length >= 10) {
      const digits = telDigits.startsWith("57") ? telDigits : `57${telDigits}`;
      window.open(
        `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
        "_blank",
      );
    } else {
      window.open(waLink(text), "_blank");
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleCopy() {
    const text = buildShareText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setSavedMsg("Resumen copiado al portapapeles.");
      setTimeout(() => setSavedMsg(null), 2500);
    });
  }

  function loadCotizacion(c: CotizacionGuardada) {
    setCliente(c.cliente);
    setTelefono(c.telefono);
    setObservaciones(c.observaciones);
    setIngreso(c.input.checkIn);
    setSalida(c.input.checkOut);
    setHuespedes(c.input.huespedes);
    setLofts(c.input.lofts);
    setConfig(c.config);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
            COTIZADOR
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Calcula el precio exacto de una reserva. La lógica replica la
            Calculadora de Tarifas de LOFTHOUSE 14.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminCard title="Datos de la reserva">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cliente">
                <input
                  className={inputClass}
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nombre completo"
                />
              </Field>
              <Field label="Teléfono (opcional)">
                <input
                  className={inputClass}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 3001234567"
                  inputMode="tel"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha de ingreso">
                <input
                  type="date"
                  className={inputClass}
                  value={ingreso}
                  onChange={(e) => setIngreso(e.target.value)}
                />
              </Field>
              <Field label="Fecha de salida">
                <input
                  type="date"
                  className={inputClass}
                  value={salida}
                  onChange={(e) => setSalida(e.target.value)}
                  min={ingreso}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cantidad de huéspedes">
                <NumInput
                  value={huespedes}
                  setValue={setHuespedes}
                  min={1}
                  max={63}
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Base incluye 1–2. Desde el 3º se cobra{" "}
                  {formatCOP(config.recargoHuesped)} por huésped y por noche.
                </p>
              </Field>
              <Field label="Cantidad de lofts">
                <NumInput value={lofts} setValue={setLofts} min={1} max={13} />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Multiplica el impuesto de aseo. Si la reserva requiere más de
                  un loft, cuéntalos aquí.
                </p>
              </Field>
            </div>

            <Field label="Observaciones (opcional)">
              <textarea
                className={`${inputClass} min-h-[80px]`}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Preferencias, medio de pago, origen (Airbnb / Booking / Directo), etc."
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Resumen y total">
          {!result.ok ? (
            <p className="rounded-lg bg-amber-200/50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
              {result.error || "Completa los datos para ver el cálculo."}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MiniStat label="Noches" value={result.noches.toString()} />
                <MiniStat
                  label="L-J / V-D"
                  value={`${result.nochesLJ} / ${result.nochesVD}`}
                />
              </div>

              <dl className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white/70 text-sm dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900/60">
                <Line label="Alojamiento">
                  {formatCOP(result.subtotalAlojamiento)}
                </Line>
                <Line label="Recargo huéspedes">
                  {formatCOP(result.recargoHuespedes)}
                </Line>
                <Line label="Impuesto de aseo" sublabel={result.aseoDetalle}>
                  {formatCOP(result.aseoTotal)}
                </Line>
                <Line label="Subtotal">
                  {formatCOP(result.subtotalReserva)}
                </Line>
                <Line label="Descuento" sublabel={result.descuentoDetalle}>
                  {formatCOP(result.descuento)}
                </Line>
                <Line label="TOTAL RESERVA" strong>
                  {formatCOP(result.totalReserva)}
                </Line>
                <Line
                  label={`Total si aplica Airbnb (+${(config.comisionAirbnb * 100).toFixed(0)}%)`}
                  muted
                >
                  {formatCOP(result.totalConComisionAirbnb)}
                </Line>
              </dl>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-zinc-800 dark:bg-[#f2f0eb] dark:text-zinc-900"
                >
                  Guardar cotización
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#1ebe5b]"
                >
                  Enviar por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100"
                >
                  Copiar resumen
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100"
                >
                  Imprimir / PDF
                </button>
              </div>
              {savedMsg && (
                <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                  {savedMsg}
                </p>
              )}
            </div>
          )}
        </AdminCard>
      </div>

      {result.ok && (
        <AdminCard title="Desglose noche por noche">
          <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-black/5 text-[11px] uppercase tracking-wider text-zinc-600 dark:bg-white/5 dark:text-zinc-300">
                <tr>
                  <th className="px-3 py-2 text-left">Noche</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Día</th>
                  <th className="px-3 py-2 text-right">Tarifa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {result.nightByNight.map((n) => (
                  <tr
                    key={n.n}
                    className={n.esFinDeSemana ? "bg-amber-200/10" : ""}
                  >
                    <td className="px-3 py-2">{n.n}</td>
                    <td className="px-3 py-2">{n.date}</td>
                    <td className="px-3 py-2">{n.dia}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCOP(n.tarifa)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-black/5 font-semibold dark:bg-white/5">
                  <td className="px-3 py-2" colSpan={3}>
                    Total alojamiento
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCOP(result.subtotalAlojamiento)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </AdminCard>
      )}

      <AdminCard
        title="Configuración de tarifas"
        subtitle="Ajusta las tarifas y se guardarán automáticamente. Modifica solo si cambiaste los precios oficialmente."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MoneyField
            label="Tarifa por noche (Lun-Jue)"
            value={config.tarifaLJ}
            onChange={(v) => handleConfigChange("tarifaLJ", v)}
          />
          <MoneyField
            label="Tarifa por noche (Vie-Dom)"
            value={config.tarifaVD}
            onChange={(v) => handleConfigChange("tarifaVD", v)}
          />
          <MoneyField
            label="Recargo huésped adicional (por noche)"
            value={config.recargoHuesped}
            onChange={(v) => handleConfigChange("recargoHuesped", v)}
          />
          <MoneyField
            label="Aseo 1–2 noches (por loft)"
            value={config.aseoCorta}
            onChange={(v) => handleConfigChange("aseoCorta", v)}
          />
          <MoneyField
            label="Aseo 3–7 noches (por loft)"
            value={config.aseoMedia}
            onChange={(v) => handleConfigChange("aseoMedia", v)}
          />
          <MoneyField
            label="Aseo por semana (>7 noches)"
            value={config.aseoSemanal}
            onChange={(v) => handleConfigChange("aseoSemanal", v)}
          />
          <PercentField
            label="Descuento semanal (≥7 noches)"
            value={config.descuentoSemanal}
            onChange={(v) => handleConfigChange("descuentoSemanal", v)}
          />
          <PercentField
            label="Descuento mensual (≥28 noches)"
            value={config.descuentoMensual}
            onChange={(v) => handleConfigChange("descuentoMensual", v)}
          />
          <PercentField
            label="Comisión Airbnb (opcional)"
            value={config.comisionAirbnb}
            onChange={(v) => handleConfigChange("comisionAirbnb", v)}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setConfig(DEFAULT_PRICING);
            setPricingConfig(DEFAULT_PRICING);
          }}
          className="mt-4 rounded-full border border-black/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-100"
        >
          Restablecer valores por defecto
        </button>
      </AdminCard>

      <AdminCard
        title={`Cotizaciones guardadas (${saved.length})`}
        subtitle="Tus últimas cotizaciones. Toca una para recargarla y volver a editarla."
      >
        {saved.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aún no hay cotizaciones guardadas.
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {saved.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{c.cliente}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {c.input.checkIn} → {c.input.checkOut} · {c.result.noches}{" "}
                    noche(s) · {c.input.huespedes} huésped(es) · {c.input.lofts}{" "}
                    loft(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold dark:bg-white/10">
                    {formatCOP(c.result.totalReserva)}
                  </span>
                  <button
                    type="button"
                    onClick={() => loadCotizacion(c)}
                    className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
                  >
                    Cargar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-700 hover:bg-red-500/10 dark:text-red-300"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </AdminShell>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none ring-amber-800/25 focus:ring-2 dark:border-white/10 dark:bg-zinc-900/70";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumInput({
  value,
  setValue,
  min = 1,
  max = 99,
}: {
  value: number;
  setValue: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => setValue(Math.max(min, value - 1))}
        className="w-10 rounded-xl border border-black/10 bg-white/80 text-lg font-semibold text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-200"
        aria-label="Disminuir"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10) || min)}
        className={`${inputClass} text-center`}
      />
      <button
        type="button"
        onClick={() => setValue(Math.min(max, value + 1))}
        className="w-10 rounded-xl border border-black/10 bg-white/80 text-lg font-semibold text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-200"
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-stretch">
        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-black/10 bg-black/5 px-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5">
          $
        </span>
        <input
          type="number"
          min={0}
          step={1000}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className={`${inputClass} rounded-l-none`}
        />
      </div>
    </Field>
  );
}

function PercentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-stretch">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={Math.round(value * 100)}
          onChange={(e) =>
            onChange(
              Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)) /
                100,
            )
          }
          className={`${inputClass} rounded-r-none`}
        />
        <span className="inline-flex items-center rounded-r-xl border border-l-0 border-black/10 bg-black/5 px-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5">
          %
        </span>
      </div>
    </Field>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-zinc-900/50">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="font-display text-2xl tracking-wide">{value}</p>
    </div>
  );
}

function Line({
  label,
  sublabel,
  children,
  strong,
  muted,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 px-3 py-2 ${
        strong ? "bg-amber-200/30 dark:bg-amber-400/10" : ""
      }`}
    >
      <div className="min-w-0">
        <dt
          className={`${strong ? "font-display text-base tracking-wide" : "font-medium"} ${
            muted ? "text-zinc-500 dark:text-zinc-400" : ""
          }`}
        >
          {label}
        </dt>
        {sublabel && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</p>
        )}
      </div>
      <dd
        className={`whitespace-nowrap tabular-nums ${
          strong ? "font-display text-lg" : "font-semibold"
        } ${muted ? "text-zinc-500 dark:text-zinc-400" : ""}`}
      >
        {children}
      </dd>
    </div>
  );
}
