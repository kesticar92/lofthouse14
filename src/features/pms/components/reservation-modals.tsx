"use client";

import type { FormEvent } from "react";
import type { PropertyRow } from "@/lib/pms/types";
import { Field, Modal } from "@/features/pms/components/admin-modals";

const inputCls =
  "w-full rounded-lg border border-black/10 px-2 py-2 text-sm dark:border-white/10 dark:bg-zinc-900";

export type ReservationFormState = {
  property_id: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: string;
  price: string;
  notes: string;
  source: string;
  referrer_name: string;
  commission_amount: string;
};

export function NewReservationModal({
  open,
  busy,
  properties,
  selectedPropertyId,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  properties: PropertyRow[];
  selectedPropertyId: string;
  form: ReservationFormState;
  onChange: (patch: Partial<ReservationFormState>) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  if (!open) return null;
  return (
    <Modal title="Nueva reserva" onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Field label="Propiedad">
          <select
            className={inputCls}
            value={form.property_id || selectedPropertyId}
            onChange={(e) => onChange({ property_id: e.target.value })}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nombre huésped">
          <input
            required
            className={inputCls}
            value={form.guest_name}
            onChange={(e) => onChange({ guest_name: e.target.value })}
          />
        </Field>
        <Field label="Teléfono">
          <input
            className={inputCls}
            value={form.guest_phone}
            onChange={(e) => onChange({ guest_phone: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Check-in">
            <input
              required
              type="date"
              className={inputCls}
              value={form.check_in}
              onChange={(e) => onChange({ check_in: e.target.value })}
            />
          </Field>
          <Field label="Check-out (exclusivo)">
            <input
              required
              type="date"
              className={inputCls}
              value={form.check_out}
              onChange={(e) => onChange({ check_out: e.target.value })}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Huéspedes">
            <input
              type="number"
              min={1}
              className={inputCls}
              value={form.guests}
              onChange={(e) => onChange({ guests: e.target.value })}
            />
          </Field>
          <Field label="Precio (opcional)">
            <input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.price}
              onChange={(e) => onChange({ price: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Origen (color en calendario)">
          <select
            className={inputCls}
            value={form.source}
            onChange={(e) => {
              const source = e.target.value;
              onChange(
                source === "referral"
                  ? { source }
                  : { source, referrer_name: "", commission_amount: "" },
              );
            }}
          >
            <option value="direct">Directa (sin comisión a terceros)</option>
            <option value="referral">
              Referido (lleva comisión al referidor)
            </option>
            <option value="booking">Booking</option>
            <option value="expedia">Expedia</option>
            <option value="lofthouse14.com">lofthouse14.com</option>
          </select>
          <p className="mt-1 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
            Airbnb llega por iCal. Directa y referido son reservas que cargas
            tú: solo &quot;Referido&quot; registra a quién pagar comisión.
          </p>
        </Field>
        {form.source === "referral" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Referidor (quién recibe la comisión)">
              <input
                required
                className={inputCls}
                placeholder="Nombre o canal"
                value={form.referrer_name}
                onChange={(e) => onChange({ referrer_name: e.target.value })}
              />
            </Field>
            <Field label="Comisión estimada (opcional, COP)">
              <input
                type="number"
                min={0}
                step={1000}
                className={inputCls}
                placeholder="Ej. 50000"
                value={form.commission_amount}
                onChange={(e) =>
                  onChange({ commission_amount: e.target.value })
                }
              />
            </Field>
          </div>
        ) : null}
        <Field label="Notas">
          <textarea
            className={`min-h-[72px] ${inputCls}`}
            value={form.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </Field>
        <ModalActions busy={busy} onCancel={onClose} submitLabel="Guardar" />
      </form>
    </Modal>
  );
}

function ModalActions({
  busy,
  onCancel,
  submitLabel,
}: {
  busy: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-600"
        onClick={onCancel}
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-amber-500 dark:text-zinc-900"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export function BlockDatesModal({
  open,
  busy,
  draft,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  draft: { start: string; endInclusive: string } | null;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  if (!open || !draft) return null;
  return (
    <Modal title="Bloquear fechas" onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {draft.start} → {draft.endInclusive} (inclusive). Se guardará con fin
          exclusivo en base de datos.
        </p>
        <Field label="Motivo (ej. reparaciones)">
          <input
            className={inputCls}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Mantenimiento, uso propio…"
          />
        </Field>
        <ModalActions
          busy={busy}
          onCancel={onClose}
          submitLabel="Crear bloqueo"
        />
      </form>
    </Modal>
  );
}
