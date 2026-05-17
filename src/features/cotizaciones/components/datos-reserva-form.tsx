// =============================================================================
// src/features/cotizaciones/components/datos-reserva-form.tsx
// -----------------------------------------------------------------------------
// Formulario controlado con los datos del cliente y la reserva. La page padre
// mantiene el state (cliente, documento, fechas, etc.) y lo pasa por props
// para mantener la composición simple.
// =============================================================================
"use client";

import { AdminCard } from "@/components/admin/admin-shell";
import { formatCOP } from "@/lib/pricing";
import { Field, NumInput, inputClass } from "./atoms";

export type DatosReservaFormProps = {
  cliente: string;
  setCliente: (v: string) => void;
  documento: string;
  setDocumento: (v: string) => void;
  telefono: string;
  setTelefono: (v: string) => void;
  emailCliente: string;
  setEmailCliente: (v: string) => void;
  ingreso: string;
  setIngreso: (v: string) => void;
  salida: string;
  setSalida: (v: string) => void;
  huespedes: number;
  setHuespedes: (v: number) => void;
  lofts: number;
  setLofts: (v: number) => void;
  observaciones: string;
  setObservaciones: (v: string) => void;
  recargoHuesped: number;
};

export function DatosReservaForm(props: DatosReservaFormProps) {
  const {
    cliente,
    setCliente,
    documento,
    setDocumento,
    telefono,
    setTelefono,
    emailCliente,
    setEmailCliente,
    ingreso,
    setIngreso,
    salida,
    setSalida,
    huespedes,
    setHuespedes,
    lofts,
    setLofts,
    observaciones,
    setObservaciones,
    recargoHuesped,
  } = props;
  return (
    <AdminCard title="Datos de la reserva">
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente">
            <input
              className={inputClass}
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre completo o razón social"
            />
          </Field>
          <Field label="Documento (CC / NIT / Pasaporte)">
            <input
              className={inputClass}
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ej: CC 1234567890"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono (opcional)">
            <input
              className={inputClass}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 3001234567"
              inputMode="tel"
            />
          </Field>
          <Field label="Correo (opcional)">
            <input
              className={inputClass}
              type="email"
              value={emailCliente}
              onChange={(e) => setEmailCliente(e.target.value)}
              placeholder="cliente@correo.com"
              inputMode="email"
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
              Base incluye 1–2. Desde el 3º se cobra {formatCOP(recargoHuesped)}{" "}
              por huésped y por noche.
            </p>
          </Field>
          <Field label="Cantidad de lofts">
            <NumInput value={lofts} setValue={setLofts} min={1} max={13} />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Multiplica el impuesto de aseo. Si la reserva requiere más de un
              loft, cuéntalos aquí.
            </p>
          </Field>
        </div>

        <Field label="Observaciones (opcional)">
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Preferencias, anticipo recibido, requerimientos especiales, etc."
          />
        </Field>
      </div>
    </AdminCard>
  );
}
