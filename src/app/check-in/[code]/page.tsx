"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { site } from "@/lib/site";
import { GuestBottomNav } from "@/components/guest/guest-bottom-nav";
import {
  readCheckInLocalBrowser,
  saveCheckInLocalBrowser,
  type DigitalCheckInPayload,
} from "@/lib/guest/check-in-store";

type Step = 1 | 2 | 3 | "done";

type Reservation = {
  reservation_code?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  guests?: number;
  check_in?: string;
  check_out?: string;
  status?: string;
};

export default function CheckInPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeURIComponent(params.code ?? "").toUpperCase();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guests, setGuests] = useState(1);
  const [dataConfirmed, setDataConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [arrivalEta, setArrivalEta] = useState("15:00");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = readCheckInLocalBrowser(code);
      if (existing) {
        setStep("done");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/public/booking/${encodeURIComponent(code)}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Reserva no encontrada");
          setLoading(false);
          return;
        }
        if (data.check_in) {
          setStep("done");
          setLoading(false);
          return;
        }
        const r = data.reservation as Reservation;
        setReservation(r);
        setGuestName(r.guest_name ?? "");
        setGuestPhone(r.guest_phone ?? "");
        setGuestEmail(r.guest_email ?? "");
        setGuests(r.guests ?? 1);
      } catch {
        if (!cancelled) setError("Error de red");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const payload: DigitalCheckInPayload = {
      reservation_code: code,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: guestEmail,
      guests,
      arrival_eta: arrivalEta,
      terms_accepted: termsAccepted,
      data_confirmed: dataConfirmed,
      notes,
      completed_at: new Date().toISOString(),
    };
    try {
      const res = await fetch(
        `/api/public/booking/${encodeURIComponent(code)}/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }
      saveCheckInLocalBrowser(data.check_in ?? payload);
      setStep("done");
    } catch {
      setError("Error de red");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-16 pb-28 md:pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {site.name}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Check-in digital
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Reserva <span className="font-mono font-semibold">{code}</span>. No
          pedimos documentos de identidad en este flujo.
        </p>

        {loading ? (
          <p className="mt-8 text-sm">Cargando…</p>
        ) : error && step !== "done" ? (
          <p className="mt-8 text-sm text-red-700">{error}</p>
        ) : step === "done" ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
              Check-in digital completado. Te esperamos el día de llegada.
            </p>
            <button
              type="button"
              onClick={() =>
                router.push(`/confirmacion/${encodeURIComponent(code)}`)
              }
              className="rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
            >
              Ver mi reserva
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <ol className="flex gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {[1, 2, 3].map((n) => (
                <li
                  key={n}
                  className={
                    step === n
                      ? "text-amber-900 dark:text-amber-300"
                      : undefined
                  }
                >
                  {n === 1 ? "Datos" : n === 2 ? "Términos" : "Llegada"}
                  {n < 3 ? " ·" : ""}
                </li>
              ))}
            </ol>

            {step === 1 ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  Confirma los datos de tu estancia
                  {reservation?.check_in
                    ? ` (${reservation.check_in} → ${reservation.check_out})`
                    : ""}
                  .
                </p>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nombre
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Teléfono
                  <input
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Email (opcional)
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Huéspedes
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value) || 1)}
                  />
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={dataConfirmed}
                    onChange={(e) => setDataConfirmed(e.target.checked)}
                    className="mt-1"
                  />
                  Confirmo que estos datos son correctos.
                </label>
                <button
                  type="button"
                  disabled={!dataConfirmed || !guestName.trim()}
                  onClick={() => setStep(2)}
                  className="rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                >
                  Continuar
                </button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900/50">
                  <p className="font-semibold">Términos de hospedaje</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-300">
                    <li>Check-in desde las 3:00 PM · check-out hasta las 11:00 AM</li>
                    <li>Respeto a vecinos y normas del conjunto</li>
                    <li>No se almacenan documentos de identidad en este portal</li>
                    <li>
                      Políticas completas en{" "}
                      <Link href="/politicas" className="underline">
                        /politicas
                      </Link>
                    </li>
                  </ul>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1"
                  />
                  Acepto los términos de hospedaje.
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    disabled={!termsAccepted}
                    onClick={() => setStep(3)}
                    className="rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Hora estimada de llegada
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={arrivalEta}
                    onChange={(e) => setArrivalEta(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Notas (opcional, sin datos sensibles)
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Llego en Uber, necesito cuna…"
                  />
                </label>
                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full border border-zinc-300 px-4 py-2.5 text-xs font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    disabled={busy || !arrivalEta}
                    onClick={() => void submit()}
                    className="rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                  >
                    {busy ? "Guardando…" : "Confirmar check-in"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
      <GuestBottomNav />
    </>
  );
}
