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
import {
  STAY_DRAFT_EVENT,
  readStayDraft,
  type StayDraft,
} from "@/lib/stay-draft";
import {
  LOFT_CATEGORIES,
  availableLoftsForGuests,
  getLoftCategory,
  type LoftCategoryId,
} from "@/data/loft-categories";

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
  const [categoryId, setCategoryId] = useState<LoftCategoryId | null>(null);
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

  /** Si el banner ya trajo fechas+huéspedes, no volver a pedirlos. */
  const [skipStaySteps, setSkipStaySteps] = useState(false);

  useEffect(() => {
    const applyDraft = (draft: StayDraft | null) => {
      if (!draft) return;
      if (draft.checkIn) setCheckIn(draft.checkIn);
      if (draft.checkOut) setCheckOut(draft.checkOut);
      if (draft.guests && draft.guests > 0) {
        setGuests(draft.guests);
        // Ajusta lofts al llegar desde el banner si hay más personas.
        setLofts((prev) =>
          Math.max(
            prev,
            Math.ceil(draft.guests! / site.maxGuestsPerLoft),
          ),
        );
      }
      if (draft.categoryId) {
        setCategoryId(draft.categoryId);
      }

      const hasDates = Boolean(
        draft.checkIn &&
          draft.checkOut &&
          draft.checkOut > draft.checkIn,
      );
      const hasGuests = Boolean(draft.guests && draft.guests > 0);
      const stayReady = hasDates && hasGuests;

      if (stayReady) {
        setSkipStaySteps(true);
      }

      if (typeof draft.step === "number") {
        let next = Math.min(STEPS.length - 1, Math.max(0, draft.step));
        // Si el draft pedía Fechas/Huéspedes pero ya están, arrancar en Tu viaje
        // (Siguiente saltará a Extras) o en el paso pedido si es ≥ Extras.
        if (stayReady && next > 0 && next < 3) {
          next = 0;
        }
        setStep(next);
      } else if (stayReady) {
        setStep(0);
      } else if (hasDates) {
        setStep(2);
      }
      // No limpiamos el draft aquí: el banner y las cards siguen
      // enlazados al mismo borrador hasta sobrescribirlo.
    };

    applyDraft(readStayDraft());

    const onDraft = (event: Event) => {
      const custom = event as CustomEvent<StayDraft>;
      applyDraft(custom.detail ?? null);
    };
    window.addEventListener(STAY_DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(STAY_DRAFT_EVENT, onDraft);
  }, []);

  const minLoftsForGuests = Math.max(
    1,
    Math.ceil(guests / site.maxGuestsPerLoft),
  );
  const capacityOk =
    guests <= site.maxGuests && lofts >= minLoftsForGuests;
  const datesOk = Boolean(checkIn && checkOut && checkOut > checkIn);

  /** En Fechas cotizamos con lofts suficientes para no bloquear por capacidad. */
  const quoteLofts =
    step === 1 ? Math.max(lofts, minLoftsForGuests) : lofts;

  const quoteResult = useMemo(
    () =>
      publicStayQuote({
        checkIn,
        checkOut,
        huespedes: guests,
        lofts: quoteLofts,
      }),
    [checkIn, checkOut, guests, quoteLofts],
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
    if (p) {
      setLofts((prev) =>
        Math.max(
          p.suggestedLofts,
          prev,
          Math.ceil(guests / site.maxGuestsPerLoft),
        ),
      );
    }
  }

  function canAdvance(): boolean {
    if (step === 0) return profile !== null;
    // Fechas: solo rango válido. Capacidad se resuelve en Huéspedes.
    if (step === 1) return datesOk;
    if (step === 2)
      return guests >= 1 && lofts >= 1 && capacityOk && quoteResult.ok;
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

    const categoryMeta = categoryId ? getLoftCategory(categoryId) : null;
    const lines = [
      `Hola ${site.name}, quiero reservar:`,
      name.trim() ? `Nombre: ${name.trim()}` : "",
      profileMeta ? `Tipo de viaje: ${profileMeta.title}` : "",
      categoryMeta
        ? `Preferencia: ${categoryMeta.name} (${categoryMeta.tagline})`
        : "",
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
              Personaliza tu experiencia
            </h2>
            <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
              Completa tu preferencia de viaje y extras. Si ya elegiste fechas y
              huéspedes en el banner, no te los pedimos de nuevo; al final te
              llevamos a WhatsApp con el resumen para confirmar.
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Entrada = día que llegas. Salida = día que te vas. Con eso
                    calculamos noches y un precio estimado (aún no es reserva
                    confirmada). Personas y lofts los eliges en el siguiente
                    paso.
                  </p>
                  <StayDateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={(a, b) => {
                      setCheckIn(a);
                      setCheckOut(b);
                    }}
                    required
                  />
                  {datesOk && quoteResult.ok ? (
                    <div className="rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-zinc-800/60">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {quoteResult.noches} noche
                        {quoteResult.noches === 1 ? "" : "s"} · estimado
                        orientativo
                      </p>
                      <ul className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
                        <li className="flex justify-between gap-3">
                          <span>Alojamiento</span>
                          <span>{formatCOP(quoteResult.subtotalAlojamiento)}</span>
                        </li>
                        {quoteResult.recargoHuespedes > 0 ? (
                          <li className="flex justify-between gap-3">
                            <span>Recargo huéspedes</span>
                            <span>
                              {formatCOP(quoteResult.recargoHuespedes)}
                            </span>
                          </li>
                        ) : null}
                        {quoteResult.aseoTotal > 0 ? (
                          <li className="flex justify-between gap-3">
                            <span>Aseo (una vez)</span>
                            <span>{formatCOP(quoteResult.aseoTotal)}</span>
                          </li>
                        ) : null}
                        <li className="flex justify-between gap-3 border-t border-zinc-200 pt-2 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-white">
                          <span>Total estimado</span>
                          <span>{formatCOP(quoteResult.totalReserva)}</span>
                        </li>
                      </ul>
                      <p className="mt-2 text-xs text-zinc-500">
                        Luego eliges cuántas personas y lofts. Cada loft admite
                        hasta {site.maxGuestsPerLoft} personas; el total se
                        recalcula ahí.
                      </p>
                    </div>
                  ) : checkIn && checkOut && !datesOk ? (
                    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                      La salida debe ser después de la entrada.
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Elige entrada y salida para continuar. El detalle de
                      personas y lofts viene después.
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Huéspedes y lofts
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Cada loft admite hasta {site.maxGuestsPerLoft} personas. Si
                    viajan más, aumenta el número de lofts para ver el total.
                  </p>
                  {profileMeta ? (
                    <p className="text-sm text-zinc-500">
                      Sugerencia para {profileMeta.title.toLowerCase()}:{" "}
                      {profileMeta.hint}
                    </p>
                  ) : null}
                  <div>
                    <p className="mb-2 text-sm font-medium">Tipo de loft</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {LOFT_CATEGORIES.map((cat) => {
                        const fits = availableLoftsForGuests(cat, guests).length > 0;
                        const active = categoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={!fits}
                            onClick={() => setCategoryId(cat.id)}
                            className={
                              "rounded-2xl border px-3 py-3 text-left transition " +
                              (active
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                                : "border-zinc-200 dark:border-zinc-700") +
                              (fits ? "" : " cursor-not-allowed opacity-40")
                            }
                          >
                            <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                              {cat.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              Desde {cat.priceFromCop.toLocaleString("es-CO")} COP
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {categoryId ? (
                      <p className="mt-2 text-xs text-zinc-500">
                        {getLoftCategory(categoryId).tagline}
                      </p>
                    ) : null}
                  </div>
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
                        onChange={(e) => {
                          const next = Math.max(
                            1,
                            Math.min(
                              site.maxGuests,
                              Number(e.target.value) || 1,
                            ),
                          );
                          setGuests(next);
                          setLofts((prev) =>
                            Math.max(
                              prev,
                              Math.ceil(next / site.maxGuestsPerLoft),
                            ),
                          );
                        }}
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
                          setLofts(
                            Math.max(
                              1,
                              Math.min(
                                site.maxLofts,
                                Number(e.target.value) || 1,
                              ),
                            ),
                          )
                        }
                        className="w-full rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </div>
                  </div>

                  {guests > site.maxGuests ? (
                    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                      <p>
                        Para más de {site.maxGuests} personas coordinamos la
                        estadía directo por WhatsApp.
                      </p>
                      <a
                        href={waLink(
                          `Hola ${site.name}, somos más de ${site.maxGuests} personas y queremos cotizar: ${checkIn || "____"} → ${checkOut || "____"}.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                      >
                        Escribir por WhatsApp
                      </a>
                    </div>
                  ) : lofts < minLoftsForGuests ? (
                    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                      <p>
                        Con {guests} persona{guests === 1 ? "" : "s"} necesitas
                        al menos {minLoftsForGuests} loft
                        {minLoftsForGuests === 1 ? "" : "s"} (máx.{" "}
                        {site.maxGuestsPerLoft} por loft).
                      </p>
                      <button
                        type="button"
                        onClick={() => setLofts(minLoftsForGuests)}
                        className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900"
                      >
                        Usar {minLoftsForGuests} loft
                        {minLoftsForGuests === 1 ? "" : "s"}
                      </button>
                    </div>
                  ) : quoteResult.ok ? (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Capacidad ok · estimado alojamiento{" "}
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {formatCOP(quoteResult.totalReserva)}
                      </span>
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
                  onClick={() =>
                    setStep((s) => {
                      if (skipStaySteps && s === 3) return 0;
                      return s - 1;
                    })
                  }
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
                  onClick={() =>
                    setStep((s) => {
                      if (skipStaySteps && s === 0 && datesOk) return 3;
                      return s + 1;
                    })
                  }
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
