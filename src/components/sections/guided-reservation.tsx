"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { site, waLink } from "@/lib/site";
import { formatCOP } from "@/lib/pricing";
import { publicStayQuote } from "@/lib/public-stay-quote";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import {
  CONFIGURATOR_EXTRAS,
  TRIP_PROFILES,
  extrasTotalCop,
  extraLineTotalCop,
  mealDefaultDays,
  airportTransferLegCount,
  type AirportTransferChoice,
  type MealExtraId,
  type MealExtraQuantity,
  type TripProfile,
} from "@/lib/configurator-extras";
import { cn } from "@/lib/cn";
import { ConfiguratorOrbitalSteps } from "@/components/sections/configurator-orbital-steps";

const STEPS = [
  "Tu viaje",
  "Fechas",
  "Huéspedes",
  "Extras",
  "Confirmar",
] as const;

export function GuidedReservation() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<TripProfile | null>(null);
  const [name, setName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [lofts, setLofts] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [mealQuantities, setMealQuantities] = useState<
    Partial<Record<MealExtraId, MealExtraQuantity>>
  >({
    breakfast: { days: 0, guests: 2 },
    lunch: { days: 0, guests: 2 },
  });
  const [airportTransfer, setAirportTransfer] =
    useState<AirportTransferChoice>({
      pickup: true,
      dropoff: true,
    });

  const profileMeta = TRIP_PROFILES.find((p) => p.id === profile);

  const quoteResult = useMemo(
    () =>
      publicStayQuote({
        checkIn,
        checkOut,
        huespedes: guests,
        lofts,
      }),
    [checkIn, checkOut, guests, lofts],
  );

  const mealDaysDefault = useMemo(
    () => (quoteResult.ok ? mealDefaultDays(quoteResult.noches) : 0),
    [quoteResult.ok, quoteResult.noches],
  );

  const mealDaysMin =
    quoteResult.ok && quoteResult.noches === 1 ? 1 : 0;

  useEffect(() => {
    const days = Math.max(mealDaysMin, mealDaysDefault);
    setMealQuantities({
      breakfast: { days, guests },
      lunch: { days, guests },
    });
  }, [mealDaysDefault, mealDaysMin, guests, checkIn, checkOut]);

  const extrasCop = extrasTotalCop(extras, mealQuantities, airportTransfer);
  const grandTotal =
    quoteResult.ok && quoteResult.totalReserva > 0
      ? quoteResult.totalReserva + extrasCop
      : null;

  function toggleExtra(id: string) {
    setExtras((prev) => {
      const on = prev.includes(id);
      if (on) return prev.filter((x) => x !== id);
      if (id === "airport-transfer") {
        setAirportTransfer({ pickup: true, dropoff: true });
      }
      if (id === "breakfast" || id === "lunch") {
        const mealId = id as MealExtraId;
        setMealQuantities((mq) => ({
          ...mq,
          [mealId]: {
            days: Math.max(
              mealDaysMin,
              mq[mealId]?.days ?? 0,
              mealDaysDefault,
            ),
            guests: mq[mealId]?.guests ?? guests,
          },
        }));
      }
      return [...prev, id];
    });
  }

  function applyProfileSuggestion(id: TripProfile) {
    setProfile(id);
    const p = TRIP_PROFILES.find((x) => x.id === id);
    if (p) setLofts(p.suggestedLofts);
  }

  function canAdvance(): boolean {
    if (step === 0) return profile !== null;
    if (step === 1) return Boolean(checkIn && checkOut && quoteResult.ok);
    if (step === 2) return guests >= 1 && lofts >= 1 && quoteResult.ok;
    if (step === 3) {
      if (
        extras.includes("airport-transfer") &&
        airportTransferLegCount(airportTransfer) === 0
      ) {
        return false;
      }
      return true;
    }
    if (step === 4) return quoteResult.ok;
    return false;
  }

  function updateMealQty(
    id: MealExtraId,
    patch: Partial<MealExtraQuantity>,
  ) {
    setMealQuantities((prev) => ({
      ...prev,
      [id]: {
        days: Math.max(
          mealDaysMin,
          patch.days ?? prev[id]?.days ?? mealDaysDefault,
        ),
        guests: patch.guests ?? prev[id]?.guests ?? guests,
      },
    }));
  }

  function handleWhatsApp() {
    const extraLines = CONFIGURATOR_EXTRAS.filter((e) =>
      extras.includes(e.id),
    ).map((e) => {
      if (e.interestOnly || e.priceCop <= 0) {
        return `• ${e.label}: me interesa`;
      }
      const lineTotal = extraLineTotalCop(e, {
        mealQty:
          e.id === "breakfast" || e.id === "lunch"
            ? mealQuantities[e.id]
            : undefined,
        airport: e.id === "airport-transfer" ? airportTransfer : undefined,
      });
      if (e.pricing === "perAirportLeg") {
        const parts: string[] = [];
        if (airportTransfer.pickup) parts.push("recogida en aeropuerto");
        if (airportTransfer.dropoff) parts.push("traslado al aeropuerto");
        return `• ${e.label}: ${parts.join(" + ") || "—"} (${formatCOP(lineTotal)} estimado)`;
      }
      if (e.pricing === "perGuestPerDay") {
        const q = mealQuantities[e.id as MealExtraId];
        return `• ${e.label}: ${formatCOP(e.priceCop)}/pers./día × ${q?.guests ?? guests} huésped(es) × ${q?.days ?? mealDaysDefault} día(s) = ${formatCOP(lineTotal)} (estimado)`;
      }
      return `• ${e.label}: ${formatCOP(e.priceCop)} (estimado)`;
    });

    const lines = [
      `Hola ${site.name}, quiero reservar:`,
      name.trim() ? `Nombre: ${name.trim()}` : "",
      profileMeta ? `Tipo de viaje: ${profileMeta.title}` : "",
      checkIn && checkOut ? `Fechas: ${checkIn} → ${checkOut}` : "",
      `Huéspedes: ${guests} · Lofts: ${lofts}`,
      extraLines.length ? `\nExtras:\n${extraLines.join("\n")}` : "",
      grandTotal !== null
        ? `\nTotal estimado (web): ${formatCOP(grandTotal)}`
        : "",
      quoteResult.ok
        ? `(Alojamiento+aseo: ${formatCOP(quoteResult.totalReserva)}${extrasCop ? ` + extras ${formatCOP(extrasCop)}` : ""})`
        : "",
      "",
      "Confirmo que la tarifa final y descuentos de grupo o larga estadía se cierran por WhatsApp.",
    ].filter(Boolean);

    window.open(waLink(lines.join("\n")), "_blank", "noopener");
  }

  return (
    <section
      id="reservas"
      className="scroll-mt-24 border-y border-zinc-200 bg-[#f2f0eb] px-4 py-14 dark:border-zinc-800 dark:bg-zinc-950 md:px-20 md:py-20"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="font-display text-4xl tracking-tight text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
              Configura tu estadía
            </h2>
            <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
              Un paso a la vez, como en recepción: tú eliges, nosotros te
              mostramos el total estimado antes de reservar.
            </p>
          </div>
          <ConfiguratorOrbitalSteps
            activeStep={step}
            onStepSelect={(i) => setStep(i)}
            className="md:mr-2"
          />
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    ¿Cómo vienes a Cali?
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {TRIP_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyProfileSuggestion(p.id)}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          profile === p.id
                            ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                            : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-400",
                        )}
                      >
                        <span className="block font-semibold">{p.title}</span>
                        <span
                          className={cn(
                            "mt-1 block text-xs",
                            profile === p.id
                              ? "text-white/80 dark:text-zinc-600"
                              : "text-zinc-500",
                          )}
                        >
                          {p.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    ¿Qué fechas necesitas?
                  </h3>
                  <StayDateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={(a, b) => {
                      setCheckIn(a);
                      setCheckOut(b);
                    }}
                    required
                  />
                  {quoteResult.ok && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {quoteResult.noches} noche(s) · base alojamiento{" "}
                      {formatCOP(quoteResult.subtotalAlojamiento)} (
                      {lofts} loft(s) en el siguiente paso)
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Huéspedes y lofts
                  </h3>
                  {profileMeta ? (
                    <p className="text-sm text-zinc-500">
                      Sugerencia para {profileMeta.title.toLowerCase()}:{" "}
                      {profileMeta.hint}
                    </p>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Personas
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={site.maxGuests}
                        value={guests}
                        onChange={(e) =>
                          setGuests(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Lofts
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={site.maxLofts}
                        value={lofts}
                        onChange={(e) =>
                          setLofts(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </div>
                  </div>
                  {!quoteResult.ok && quoteResult.error ? (
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {quoteResult.error}
                    </p>
                  ) : null}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    ¿Algo más para tu viaje?
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Opciones que suman al total estimado o que coordinamos
                    contigo (precio final en WhatsApp si aplica). Las comidas
                    se precargan según noches y huéspedes; puedes aumentar días
                    y personas.
                  </p>
                  <ul className="space-y-3">
                    {CONFIGURATOR_EXTRAS.map((e) => {
                      const isMeal =
                        e.id === "breakfast" || e.id === "lunch";
                      const isAirport = e.id === "airport-transfer";
                      const mealId = isMeal ? (e.id as MealExtraId) : null;
                      const checked = extras.includes(e.id);
                      const lineTotal = checked
                        ? extraLineTotalCop(e, {
                            mealQty: mealId
                              ? mealQuantities[mealId]
                              : undefined,
                            airport: isAirport ? airportTransfer : undefined,
                          })
                        : 0;

                      return (
                        <li key={e.id}>
                          <label className="flex cursor-pointer gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-600">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleExtra(e.id)}
                              className="mt-1 size-4"
                            />
                            <span className="flex-1">
                              <span className="flex flex-wrap items-center justify-between gap-2 font-medium">
                                {e.label}
                                {e.interestOnly ? (
                                  <span className="text-xs text-zinc-500">
                                    Consultar
                                  </span>
                                ) : e.pricing === "perGuestPerDay" ? (
                                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                    {checked && lineTotal > 0
                                      ? `+ ${formatCOP(lineTotal)}`
                                      : `+ ${formatCOP(e.priceCop)} / pers. / día`}
                                  </span>
                                ) : e.pricing === "perAirportLeg" ? (
                                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                    {checked && lineTotal > 0
                                      ? `+ ${formatCOP(lineTotal)}`
                                      : `+ ${formatCOP(e.priceCop)} / trayecto`}
                                  </span>
                                ) : (
                                  <span className="text-sm">
                                    + {formatCOP(e.priceCop)}
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block text-xs text-zinc-500">
                                {e.description}
                              </span>
                              {checked && isAirport ? (
                                <div className="mt-3 space-y-2">
                                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                                    <input
                                      type="checkbox"
                                      checked={airportTransfer.pickup}
                                      onChange={(ev) =>
                                        setAirportTransfer((prev) => ({
                                          ...prev,
                                          pickup: ev.target.checked,
                                        }))
                                      }
                                      onClick={(ev) => ev.stopPropagation()}
                                      className="size-4"
                                    />
                                    Recogida en aeropuerto (llegada)
                                  </label>
                                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                                    <input
                                      type="checkbox"
                                      checked={airportTransfer.dropoff}
                                      onChange={(ev) =>
                                        setAirportTransfer((prev) => ({
                                          ...prev,
                                          dropoff: ev.target.checked,
                                        }))
                                      }
                                      onClick={(ev) => ev.stopPropagation()}
                                      className="size-4"
                                    />
                                    Traslado al aeropuerto (salida)
                                  </label>
                                  {airportTransferLegCount(airportTransfer) ===
                                  0 ? (
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                      Marca al menos un trayecto para continuar.
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              {checked && isMeal && mealId ? (
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                      Días de comida
                                    </label>
                                    <input
                                      type="number"
                                      min={mealDaysMin}
                                      max={30}
                                      value={
                                        mealQuantities[mealId]?.days ??
                                        mealDaysDefault
                                      }
                                      onChange={(ev) =>
                                        updateMealQty(mealId, {
                                          days: Math.max(
                                            mealDaysMin,
                                            Number(ev.target.value) || 0,
                                          ),
                                        })
                                      }
                                      onClick={(ev) => ev.stopPropagation()}
                                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                    />
                                    <p className="mt-1 text-[10px] text-zinc-400">
                                      {mealDaysMin >= 1
                                        ? "Una noche: mínimo 1 día de comida; puedes sumar más días."
                                        : "Desde el día después del check-in; puedes sumar más días."}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                      Huéspedes
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={site.maxGuests}
                                      value={
                                        mealQuantities[mealId]?.guests ?? guests
                                      }
                                      onChange={(ev) =>
                                        updateMealQty(mealId, {
                                          guests: Math.max(
                                            1,
                                            Number(ev.target.value) || 1,
                                          ),
                                        })
                                      }
                                      onClick={(ev) => ev.stopPropagation()}
                                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                    />
                                  </div>
                                </div>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Tu resumen
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">Viaje</dt>
                      <dd className="font-medium">{profileMeta?.title ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">Fechas</dt>
                      <dd className="text-right font-medium">
                        {checkIn} → {checkOut}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">Huéspedes / lofts</dt>
                      <dd className="font-medium">
                        {guests} / {lofts}
                      </dd>
                    </div>
                  </dl>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Tu nombre (opcional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                  {quoteResult.ok && (
                    <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/80">
                      <p className="text-xs uppercase text-zinc-500">
                        Total estimado
                      </p>
                      <p className="font-display text-3xl text-zinc-900 dark:text-white">
                        {formatCOP(grandTotal ?? quoteResult.totalReserva)}
                      </p>
                      <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
                        {quoteResult.disclaimers.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-col gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              {grandTotal !== null && step >= 1 ? (
                <>
                  <span className="text-zinc-500">Total estimado: </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {formatCOP(grandTotal)}
                  </span>
                </>
              ) : (
                <span className="text-zinc-500">
                  El precio se actualiza al avanzar.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold dark:border-zinc-600"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Atrás
                </button>
              ) : null}
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canAdvance()}
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                >
                  Siguiente
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!quoteResult.ok}
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                >
                  <Image
                    src="/logos/whatsapp.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="size-5"
                    aria-hidden
                  />
                  Reservar por WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
