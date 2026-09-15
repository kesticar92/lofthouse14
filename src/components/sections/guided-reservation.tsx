"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { site, waLink } from "@/lib/site";
import {
  stashWhatsAppReservationMessage,
} from "@/lib/whatsapp-reservation-message";
import { trackWhatsAppClick, trackBeginCheckout } from "@/lib/analytics";
import { formatCOP } from "@/lib/pricing";
import {
  PUBLIC_PRICING_CONFIG,
  publicStayQuote,
} from "@/lib/public-stay-quote";
import { pricingConfigForCategory } from "@/lib/pricing/unified";
import { StayDateRangePicker } from "@/components/ui/stay-date-range-picker";
import {
  CONFIGURATOR_EXTRAS,
  TRIP_PROFILES,
  extrasTotalCop,
  extraLineTotalCop,
  mealDefaultDays,
  airportTransferLegCount,
  minAirportVehicles,
  clampAirportVehicles,
  clampMealDays,
  clampPetCount,
  clampTimingUnits,
  isEarlyCheckInOffered,
  AIRPORT_VEHICLE_CAPACITY,
  PETS_PER_LOFT,
  mealMaxDays,
  maxPetsForLofts,
  type AirportTransferChoice,
  type MealExtraId,
  type MealExtraQuantity,
  type TimingExtraId,
  type TimingExtraQuantity,
  type TripProfile,
} from "@/lib/configurator-extras";
import { cn } from "@/lib/cn";
import {
  ConfiguratorOrbitalSteps,
  ConfiguratorOrbitalTransition,
} from "@/components/sections/configurator-orbital-steps";
import { AvailabilityCheckingPanel } from "@/components/sections/availability-checking-panel";
import {
  STAY_DRAFT_EVENT,
  mergeStayDraft,
  readStayDraft,
  stayDraftFromQuery,
  type StayDraft,
  type StayDraftFrom,
} from "@/lib/stay-draft";
import {
  WIZARD_STEPS as STEPS,
  STEP_TU_VIAJE,
  STEP_FECHAS,
  STEP_HUESPEDES,
  STEP_LOFT,
  STEP_EXTRAS,
  STEP_CONFIRMAR,
  draftHasValidDates,
  nextLogicalStep as nextWizardStep,
  prevLogicalStep as prevWizardStep,
  resolveEntryStep,
  stepAfterSelectingLoft,
} from "@/lib/wizard-flow";
import {
  LOFT_CATEGORIES,
  availableLoftsForGuests,
  categoryReservationMaxGuests,
  getLoftCategory,
  GUESTS_PER_LOFT_MAX,
  type LoftCategoryId,
} from "@/data/loft-categories";
import { SEED_CANCELLATION_POLICY } from "@/lib/policies/cancellation";
import {
  ASEO_CORTA_COP,
  ASEO_ESTANDAR_COP,
  ASEO_SEMANAL_EXTRA_COP,
  DAMAGE_DEPOSIT_LONG_COP,
  DAMAGE_DEPOSIT_SHORT_COP,
  MAX_STAY_NIGHTS,
} from "@/lib/policies/house";
import { depositPercentFromEnv } from "@/lib/payments/deposit";

const TRANSITION_MS = 900;

export function GuidedReservation({
  /** Densidad: en `/reservar` y home embed, sin padding de sección marketing. */
  compact = false,
}: {
  compact?: boolean;
} = {}) {
  "use no memo"; // evitar que el React Compiler reescriba deps de efectos
  const [step, setStep] = useState(0);
  const [transitionTo, setTransitionTo] = useState<number | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      vehicles: 1,
    });
  const [timingQuantities, setTimingQuantities] = useState<
    Partial<Record<TimingExtraId, TimingExtraQuantity>>
  >({
    "early-checkin": { units: 1 },
    "late-checkout": { units: 1 },
    pet: { units: 1 },
  });
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  /** Verificación iCal al llegar al resumen (antes de RESERVAR). */
  const [availCheck, setAvailCheck] = useState<{
    status: "idle" | "checking" | "ok" | "fail";
    message?: string;
  }>({ status: "idle" });
  const [liveOffer, setLiveOffer] = useState<{
    message: string;
    categoryId: LoftCategoryId;
    name: string;
    priceFromCop: number;
    assignedUnits: number[];
    warning?: string;
    /** Tipos sin cupo en las fechas pedidas (se deshabilitan en el paso loft). */
    blockedCategoryIds: LoftCategoryId[];
  } | null>(null);
  /** Tipos bloqueados por iCal aunque se cierre el aviso. */
  const [blockedCategoryIds, setBlockedCategoryIds] = useState<LoftCategoryId[]>(
    [],
  );
  const [liveWarning, setLiveWarning] = useState<string | null>(null);
  const [assignedUnitsHint, setAssignedUnitsHint] = useState<number[] | null>(
    null,
  );
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [bookingChannel, setBookingChannel] = useState<
    "direct" | "corporate" | "referral" | "whatsapp"
  >("direct");
  const [corporateName, setCorporateName] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const depositPct = depositPercentFromEnv();
  const availCtxRef = useRef({
    checkIn: "",
    checkOut: "",
    categoryId: null as LoftCategoryId | null,
    guests: 2,
    lofts: 1,
    quoteOk: false,
  });

  const profileMeta = TRIP_PROFILES.find((p) => p.id === profile);

  /** Si el banner ya trajo fechas+huéspedes, no volver a pedirlos. */
  const [skipStaySteps, setSkipStaySteps] = useState(false);
  /** Banner con estadía lista o llegada desde card Vista/Atrio/Cielo → no pedir «Cómo vienes». */
  const [skipTripStep, setSkipTripStep] = useState(false);
  /** Desde card: categoría ya elegida → no reabrir paso Loft. */
  const [skipLoftStep, setSkipLoftStep] = useState(false);
  /** Huéspedes ya vindieron del draft (no el default UI). */
  const [guestsFromDraft, setGuestsFromDraft] = useState(false);
  const [entryFrom, setEntryFrom] = useState<StayDraftFrom | null>(null);

  useEffect(() => {
    /**
     * Entrada: alinear campos + paso/skips.
     * Patch (eventos del propio wizard vía mergeStayDraft): solo campos.
     * Si no, cada «Siguiente» que persiste el draft re-ejecutaba
     * resolveEntryStep y podía pelear con goToStep / dejar el CTA raro.
     */
    const applyDraft = (
      draft: StayDraft | null,
      mode: "entry" | "patch",
    ) => {
      if (!draft) return;
      if (draft.checkIn) setCheckIn(draft.checkIn);
      if (draft.checkOut) setCheckOut(draft.checkOut);
      if (draft.guests && draft.guests > 0) {
        setGuests(draft.guests);
        setGuestsFromDraft(true);
        setLofts((prev) =>
          Math.max(
            prev,
            Math.ceil(draft.guests! / site.maxGuestsPerLoft),
          ),
        );
      }
      if (draft.categoryId) {
        setCategoryId(draft.categoryId);
      } else if (draft.from === "banner") {
        setCategoryId(null);
      }

      const hasDates = draftHasValidDates(draft);
      const hasGuests = Boolean(draft.guests && draft.guests > 0);
      const stayReady = hasDates && hasGuests;
      const hasCategory = Boolean(draft.categoryId);
      const from: StayDraftFrom | undefined =
        draft.from ??
        (hasCategory ? "card" : stayReady ? "banner" : undefined);

      const externalNav = mode === "entry" || Boolean(draft.from);

      if (!externalNav) return;

      if (from) setEntryFrom(from);
      if (stayReady) setSkipStaySteps(true);
      if (from || stayReady || hasCategory) setSkipTripStep(true);
      if (from === "card" && hasCategory) setSkipLoftStep(true);

      setStep(resolveEntryStep(draft));
    };

    // Query params tienen prioridad sobre sessionStorage (links compartibles).
    let queryDraft: StayDraft | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      if ([...params.keys()].length > 0) {
        queryDraft = stayDraftFromQuery(params);
        mergeStayDraft(queryDraft);
      }
    } catch {
      /* ignore */
    }

    applyDraft(queryDraft ?? readStayDraft(), "entry");

    const onDraft = (event: Event) => {
      const custom = event as CustomEvent<StayDraft>;
      applyDraft(custom.detail ?? null, "patch");
    };
    window.addEventListener(STAY_DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(STAY_DRAFT_EVENT, onDraft);
  }, []);

  const coveredSteps = useMemo(() => {
    const covered = new Set<number>();
    if (skipTripStep) covered.add(STEP_TU_VIAJE);
    if (skipStaySteps) {
      covered.add(STEP_FECHAS);
      covered.add(STEP_HUESPEDES);
    }
    if (skipLoftStep) covered.add(STEP_LOFT);
    return covered;
  }, [skipTripStep, skipStaySteps, skipLoftStep]);

  const minLoftsForGuests = Math.max(
    1,
    Math.ceil(guests / site.maxGuestsPerLoft),
  );
  const capacityOk =
    guests <= site.maxGuests && lofts >= minLoftsForGuests;
  const datesOk = Boolean(checkIn && checkOut && checkOut > checkIn);

  // Si cambian las fechas/huéspedes, liberar bloqueos y realinear comidas.
  useEffect(() => {
    setBlockedCategoryIds([]);
    setLiveOffer(null);

    let nights = 0;
    if (checkIn && checkOut && checkOut > checkIn) {
      const a = new Date(`${checkIn}T12:00:00`);
      const b = new Date(`${checkOut}T12:00:00`);
      nights = Math.max(
        0,
        Math.round((b.getTime() - a.getTime()) / 86_400_000),
      );
    }
    const minDays = nights === 1 ? 1 : 0;
    const days = clampMealDays(
      Math.max(minDays, mealDefaultDays(nights)),
      nights,
      minDays,
    );
    setMealQuantities({
      breakfast: { days, guests },
      lunch: { days, guests },
    });
  }, [checkIn, checkOut, guests]);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
        transitionTimer.current = null;
      }
    };
  }, []);

  function goToStep(target: number, { animate = true } = {}) {
    const clamped = Math.min(STEPS.length - 1, Math.max(0, target));
    if (clamped === step && transitionTo === null) return;

    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }

    // Commit del paso ya: si el timer se cancela (Strict Mode / HMR),
    // la navegación no debe quedar a medias con el overlay encima.
    setStep(clamped);

    if (!animate) {
      setTransitionTo(null);
      return;
    }

    setTransitionTo(clamped);
    transitionTimer.current = setTimeout(() => {
      setTransitionTo(null);
      transitionTimer.current = null;
    }, TRANSITION_MS);
  }

  const flowFlags = {
    skipTripStep,
    skipStaySteps,
    skipLoftStep,
    hasDates: datesOk,
    // Solo draft/banner (no el default UI de 2) para no saltar Huéspedes.
    hasGuests: skipStaySteps || guestsFromDraft,
    hasCategory: categoryId !== null,
  };

  function nextLogicalStep(from: number): number {
    return nextWizardStep(from, flowFlags);
  }

  function prevLogicalStep(from: number): number | null {
    return prevWizardStep(from, flowFlags);
  }

  function persistStayDraft(extra: Partial<StayDraft> = {}) {
    mergeStayDraft({
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests > 0 ? guests : undefined,
      ...(categoryId ? { categoryId } : {}),
      ...(entryFrom ? { from: entryFrom } : {}),
      ...extra,
    });
  }

  function advanceFromCurrentStep() {
    if (step === STEP_FECHAS || step === STEP_HUESPEDES) {
      persistStayDraft();
      if (step === STEP_HUESPEDES && datesOk && guests >= 1) {
        setGuestsFromDraft(true);
        setSkipStaySteps(true);
      }
    }
    if (step === STEP_LOFT && categoryId) {
      if (datesOk && guests >= 1) setSkipStaySteps(true);
      persistStayDraft({
        categoryId,
        step: STEP_EXTRAS,
      });
    }
    goToStep(nextLogicalStep(step));
  }

  const canGoBack = prevLogicalStep(step) !== null;
  const displayStep = transitionTo ?? step;

  /** En Fechas cotizamos con lofts suficientes para no bloquear por capacidad. */
  const quoteLofts =
    step === 1 ? Math.max(lofts, minLoftsForGuests) : lofts;

  const quotePricing = useMemo(
    () => pricingConfigForCategory(categoryId, PUBLIC_PRICING_CONFIG),
    [categoryId],
  );

  const quoteResult = useMemo(
    () =>
      publicStayQuote(
        {
          checkIn,
          checkOut,
          huespedes: guests,
          lofts: quoteLofts,
        },
        quotePricing,
      ),
    [checkIn, checkOut, guests, quoteLofts, quotePricing],
  );

  const mealDaysDefault = useMemo(
    () => (quoteResult.ok ? mealDefaultDays(quoteResult.noches) : 0),
    [quoteResult.ok, quoteResult.noches],
  );

  const mealDaysMax = useMemo(
    () => (quoteResult.ok ? mealMaxDays(quoteResult.noches) : 0),
    [quoteResult.ok, quoteResult.noches],
  );

  const mealDaysMin =
    quoteResult.ok && quoteResult.noches === 1 ? 1 : 0;

  const earlyCheckInOffered = isEarlyCheckInOffered(checkIn);

  /** Si el early ya no aplica (mismo día ≥ 14:00), quitarlo de la selección. */
  useEffect(() => {
    if (earlyCheckInOffered) return;
    setExtras((prev) =>
      prev.includes("early-checkin")
        ? prev.filter((id) => id !== "early-checkin")
        : prev,
    );
  }, [earlyCheckInOffered]);

  /** Vehículos de traslado: mínimo según huéspedes (máx. 4 por vehículo). */
  useEffect(() => {
    setAirportTransfer((prev) => {
      const next = clampAirportVehicles(prev.vehicles, guests);
      return next === prev.vehicles ? prev : { ...prev, vehicles: next };
    });
  }, [guests]);

  /** Early/late/mascota: cantidades acotadas al número de lofts. */
  useEffect(() => {
    setTimingQuantities((prev) => {
      const early = clampTimingUnits(
        prev["early-checkin"]?.units ?? lofts,
        lofts,
      );
      const late = clampTimingUnits(
        prev["late-checkout"]?.units ?? lofts,
        lofts,
      );
      const pet = clampPetCount(prev.pet?.units ?? 1, lofts);
      if (
        prev["early-checkin"]?.units === early &&
        prev["late-checkout"]?.units === late &&
        prev.pet?.units === pet
      ) {
        return prev;
      }
      return {
        "early-checkin": { units: early },
        "late-checkout": { units: late },
        pet: { units: pet },
      };
    });
  }, [lofts]);

  /** Snapshot para verificar cupo al entrar a Confirmar (deps fijas: solo `step`). */
  availCtxRef.current = {
    checkIn,
    checkOut,
    categoryId,
    guests,
    lofts,
    quoteOk: quoteResult.ok,
  };

  useEffect(() => {
    if (step !== STEP_CONFIRMAR) {
      setAvailCheck((prev) =>
        prev.status === "idle" ? prev : { status: "idle" },
      );
      return;
    }

    const ctx = availCtxRef.current;
    if (!ctx.checkIn || !ctx.checkOut || !ctx.categoryId || !ctx.quoteOk) {
      setAvailCheck({
        status: "fail",
        message: "Faltan fechas o tipo de loft para verificar cupo.",
      });
      return;
    }

    let cancelled = false;
    setAvailCheck({ status: "checking" });
    setBookingError(null);

    void (async () => {
      try {
        const liveRes = await fetch("/api/public/availability/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            check_in: ctx.checkIn,
            check_out: ctx.checkOut,
            guests: ctx.guests,
            lofts: ctx.lofts,
            category_id: ctx.categoryId,
          }),
        });
        if (cancelled) return;
        if (!liveRes.ok) {
          setAvailCheck({
            status: "fail",
            message:
              "No se pudo verificar disponibilidad en vivo. Revisa fechas o intenta de nuevo.",
          });
          return;
        }
        const live = (await liveRes.json()) as {
          ok?: boolean;
          message?: string;
          warning?: string;
          assignedUnits?: number[];
          alternative?: {
            categoryId: LoftCategoryId;
            name: string;
            priceFromCop: number;
            assignedUnits: number[];
          } | null;
          alternatives?: Array<{
            categoryId: LoftCategoryId;
            name: string;
            priceFromCop: number;
            assignedUnits: number[];
          }>;
        };

        if (live.warning) setLiveWarning(live.warning);
        else setLiveWarning(null);

        if (!live.ok) {
          if (live.alternative) {
            const availableIds = new Set<LoftCategoryId>([
              live.alternative.categoryId,
              ...(live.alternatives ?? []).map((a) => a.categoryId),
            ]);
            const blocked = LOFT_CATEGORIES.map((c) => c.id).filter(
              (id) => !availableIds.has(id),
            );
            if (
              ctx.categoryId &&
              !availableIds.has(ctx.categoryId) &&
              !blocked.includes(ctx.categoryId)
            ) {
              blocked.push(ctx.categoryId);
            }
            setBlockedCategoryIds(blocked);
            setLiveOffer({
              message:
                live.message ??
                "No hay cupo del tipo elegido. Hay otra opción disponible.",
              categoryId: live.alternative.categoryId,
              name: live.alternative.name,
              priceFromCop: live.alternative.priceFromCop,
              assignedUnits: live.alternative.assignedUnits,
              warning: live.warning,
              blockedCategoryIds: blocked,
            });
            setAvailCheck({
              status: "fail",
              message:
                live.message ??
                "Sin cupo del tipo elegido. Revisa la alternativa en el paso Loft.",
            });
            setSkipLoftStep(false);
            goToStep(STEP_LOFT);
            return;
          }
          setAvailCheck({
            status: "fail",
            message:
              live.message ??
              "No hay disponibilidad para esas fechas. Ajusta fechas o continúa por WhatsApp.",
          });
          return;
        }

        if (live.assignedUnits?.length) {
          setAssignedUnitsHint(live.assignedUnits);
          setLofts((prev) => Math.max(prev, live.assignedUnits!.length));
        }
        setAvailCheck({
          status: "ok",
          message: live.assignedUnits?.length
            ? `Cupo confirmado · loft ${live.assignedUnits.join(", ")}`
            : "Cupo confirmado para esas fechas.",
        });
      } catch {
        if (!cancelled) {
          setAvailCheck({
            status: "fail",
            message:
              "Error al consultar calendarios. Intenta de nuevo antes de reservar.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step]);

  const billableExtras = earlyCheckInOffered
    ? extras
    : extras.filter((id) => id !== "early-checkin");
  const extrasCop = extrasTotalCop(
    billableExtras,
    mealQuantities,
    airportTransfer,
    timingQuantities,
  );
  const minTransferVehicles = minAirportVehicles(guests);
  const subtotalBeforeCoupon =
    quoteResult.ok && quoteResult.totalReserva > 0
      ? quoteResult.totalReserva + extrasCop
      : null;
  const grandTotal =
    subtotalBeforeCoupon != null
      ? Math.max(0, subtotalBeforeCoupon - couponDiscount)
      : null;

  const selectedExtras = useMemo(
    () =>
      CONFIGURATOR_EXTRAS.filter(
        (e) =>
          extras.includes(e.id) &&
          (e.id !== "early-checkin" || earlyCheckInOffered),
      ),
    [extras, earlyCheckInOffered],
  );

  const priceBreakdownLines = useMemo(() => {
    if (!quoteResult.ok) return [];
    const cfg = quotePricing;
    const lines: {
      id: string;
      label: string;
      amount: number | null;
      muted?: boolean;
    }[] = [];

    if (quoteResult.nochesLJ > 0) {
      const unit = cfg.tarifaLJ * lofts;
      lines.push({
        id: "stay-lj",
        label: `${quoteResult.nochesLJ} noche${quoteResult.nochesLJ === 1 ? "" : "s"} L–J × ${formatCOP(cfg.tarifaLJ)} × ${lofts} loft${lofts === 1 ? "" : "s"}`,
        amount: quoteResult.nochesLJ * unit,
      });
    }
    if (quoteResult.nochesVD > 0) {
      const unit = cfg.tarifaVD * lofts;
      lines.push({
        id: "stay-vd",
        label: `${quoteResult.nochesVD} noche${quoteResult.nochesVD === 1 ? "" : "s"} V–D × ${formatCOP(cfg.tarifaVD)} × ${lofts} loft${lofts === 1 ? "" : "s"}`,
        amount: quoteResult.nochesVD * unit,
      });
    }
    if (quoteResult.recargoHuespedes > 0) {
      lines.push({
        id: "recargo",
        label: "Recargo huéspedes adicionales",
        amount: quoteResult.recargoHuespedes,
      });
    }
    if (quoteResult.aseoTotal > 0) {
      lines.push({
        id: "aseo",
        label: quoteResult.aseoDetalle || `Aseo × ${lofts} loft${lofts === 1 ? "" : "s"}`,
        amount: quoteResult.aseoTotal,
      });
    }

    if (quoteResult.depositoDanos > 0) {
      lines.push({
        id: "deposito-danos",
        label: `Depósito de daños (${quoteResult.noches < 7 ? formatCOP(DAMAGE_DEPOSIT_SHORT_COP) : formatCOP(DAMAGE_DEPOSIT_LONG_COP)} × ${lofts} loft${lofts === 1 ? "" : "s"}; no incluido en el total)`,
        amount: quoteResult.depositoDanos,
        muted: true,
      });
    }

    for (const e of selectedExtras) {
      if (e.interestOnly || e.priceCop <= 0) {
        lines.push({
          id: `extra-${e.id}`,
          label: e.label,
          amount: null,
          muted: true,
        });
        continue;
      }
      const timingUnits =
        e.id === "early-checkin" || e.id === "late-checkout"
          ? timingQuantities[e.id]?.units ?? lofts
          : undefined;
      const petCount =
        e.id === "pet" ? timingQuantities.pet?.units ?? 1 : undefined;
      const lineTotal = extraLineTotalCop(e, {
        mealQty:
          e.id === "breakfast" || e.id === "lunch"
            ? mealQuantities[e.id]
            : undefined,
        airport: e.id === "airport-transfer" ? airportTransfer : undefined,
        units: timingUnits,
        petCount,
      });
      let detail = e.label;
      if (e.pricing === "perGuestPerDay") {
        const q = mealQuantities[e.id as MealExtraId];
        const g = q?.guests ?? guests;
        const d = q?.days ?? mealDaysDefault;
        detail = `${e.label} (${formatCOP(e.priceCop)} × ${g} pers. × ${d} día${d === 1 ? "" : "s"})`;
      } else if (e.pricing === "perAirportLeg") {
        const legs = airportTransferLegCount(airportTransfer);
        const vehicles = Math.max(1, airportTransfer.vehicles);
        const parts: string[] = [];
        if (airportTransfer.pickup) parts.push("recogida");
        if (airportTransfer.dropoff) parts.push("ida");
        detail = `${e.label} (${formatCOP(e.priceCop)} × ${legs} trayecto${legs === 1 ? "" : "s"} × ${vehicles} vehículo${vehicles === 1 ? "" : "s"}${parts.length ? `: ${parts.join(" + ")}` : ""})`;
      } else if (e.id === "early-checkin" || e.id === "late-checkout") {
        const u = timingUnits ?? 1;
        detail = `${e.label} (${formatCOP(e.priceCop)} × ${u} loft${u === 1 ? "" : "s"})`;
      } else if (e.id === "pet") {
        const c = petCount ?? 1;
        detail = `${e.label} (${formatCOP(e.priceCop)} × ${c} mascota${c === 1 ? "" : "s"})`;
      }
      lines.push({
        id: `extra-${e.id}`,
        label: detail,
        amount: lineTotal,
      });
    }

    if (couponDiscount > 0) {
      lines.push({
        id: "coupon",
        label: couponCode.trim()
          ? `Cupón ${couponCode.trim().toUpperCase()}`
          : "Cupón",
        amount: -couponDiscount,
      });
    }

    if (grandTotal != null) {
      lines.push({
        id: "total",
        label: "Total estimado",
        amount: grandTotal,
      });
    }

    return lines;
  }, [
    quoteResult,
    quotePricing,
    lofts,
    selectedExtras,
    mealQuantities,
    airportTransfer,
    timingQuantities,
    guests,
    mealDaysDefault,
    couponDiscount,
    couponCode,
    grandTotal,
  ]);

  async function applyCoupon() {
    if (!subtotalBeforeCoupon || !couponCode.trim()) {
      setCouponMsg(null);
      setCouponDiscount(0);
      return;
    }
    try {
      const res = await fetch("/api/public/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: subtotalBeforeCoupon,
          nights: quoteResult.ok ? quoteResult.noches : undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        discount?: number;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setCouponDiscount(0);
        setCouponMsg(data.error ?? "Cupón no válido");
        return;
      }
      setCouponDiscount(data.discount ?? 0);
      setCouponMsg(data.message ?? "Cupón aplicado");
    } catch {
      setCouponDiscount(0);
      setCouponMsg("No se pudo validar el cupón");
    }
  }

  function toggleExtra(id: string) {
    setExtras((prev) => {
      const on = prev.includes(id);
      if (on) return prev.filter((x) => x !== id);
      if (id === "airport-transfer") {
        setAirportTransfer({
          pickup: true,
          dropoff: true,
          vehicles: minAirportVehicles(guests),
        });
      }
      if (id === "early-checkin" || id === "late-checkout") {
        const timingId = id as TimingExtraId;
        setTimingQuantities((tq) => ({
          ...tq,
          [timingId]: {
            units: clampTimingUnits(tq[timingId]?.units ?? lofts, lofts),
          },
        }));
      }
      if (id === "pet") {
        setTimingQuantities((tq) => ({
          ...tq,
          pet: {
            units: clampPetCount(tq.pet?.units ?? 1, lofts),
          },
        }));
      }
      if (id === "breakfast" || id === "lunch") {
        const mealId = id as MealExtraId;
        const nights = quoteResult.ok ? quoteResult.noches : mealDaysMax;
        setMealQuantities((mq) => ({
          ...mq,
          [mealId]: {
            days: clampMealDays(
              Math.max(
                mealDaysMin,
                mq[mealId]?.days ?? 0,
                mealDaysDefault,
              ),
              nights,
              mealDaysMin,
            ),
            guests: mq[mealId]?.guests ?? guests,
          },
        }));
      }
      return [...prev, id];
    });
  }

  function updateTimingUnits(id: TimingExtraId, units: number) {
    setTimingQuantities((prev) => ({
      ...prev,
      [id]: {
        units:
          id === "pet"
            ? clampPetCount(units, lofts)
            : clampTimingUnits(units, lofts),
      },
    }));
  }

  function updateAirportVehicles(vehicles: number) {
    setAirportTransfer((prev) => ({
      ...prev,
      vehicles: clampAirportVehicles(vehicles, guests),
    }));
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
    if (step === STEP_TU_VIAJE) return profile !== null;
    // Fechas: solo rango válido. Capacidad se resuelve en Huéspedes.
    if (step === STEP_FECHAS) return datesOk;
    if (step === STEP_HUESPEDES)
      return guests >= 1 && lofts >= 1 && capacityOk && quoteResult.ok;
    if (step === STEP_LOFT) return categoryId !== null;
    if (step === STEP_EXTRAS) {
      if (
        extras.includes("airport-transfer") &&
        airportTransferLegCount(airportTransfer) === 0
      ) {
        return false;
      }
      return true;
    }
    if (step === STEP_CONFIRMAR) return quoteResult.ok && policiesAccepted;
    return false;
  }

  function updateMealQty(
    id: MealExtraId,
    patch: Partial<MealExtraQuantity>,
  ) {
    const nights = quoteResult.ok ? quoteResult.noches : mealDaysMax;
    setMealQuantities((prev) => ({
      ...prev,
      [id]: {
        days: clampMealDays(
          patch.days ?? prev[id]?.days ?? mealDaysDefault,
          nights,
          mealDaysMin,
        ),
        guests: patch.guests ?? prev[id]?.guests ?? guests,
      },
    }));
  }

  function buildWhatsAppLines(
    reservationCode?: string,
    overrides?: {
      categoryId?: LoftCategoryId | null;
      lofts?: number;
      assignedUnits?: number[];
    },
  ) {
    const effectiveCategoryId =
      overrides?.categoryId !== undefined ? overrides.categoryId : categoryId;
    const effectiveLofts = Math.max(
      1,
      overrides?.lofts ??
        overrides?.assignedUnits?.length ??
        lofts,
    );
    const assignedUnits = overrides?.assignedUnits;

    const quotePricingForMsg = pricingConfigForCategory(
      effectiveCategoryId,
      PUBLIC_PRICING_CONFIG,
    );
    const quoteForMsg = publicStayQuote(
      {
        checkIn,
        checkOut,
        huespedes: guests,
        lofts: effectiveLofts,
      },
      quotePricingForMsg,
    );
    const stayTotal = quoteForMsg.ok ? quoteForMsg.totalReserva : null;
    const totalForMsg =
      stayTotal != null ? Math.max(0, stayTotal + extrasCop - couponDiscount) : null;

    const extraLines = CONFIGURATOR_EXTRAS.filter((e) =>
      extras.includes(e.id),
    ).map((e) => {
      if (e.interestOnly || e.priceCop <= 0) {
        return `• ${e.label}: me interesa`;
      }
      const timingUnits =
        e.id === "early-checkin" || e.id === "late-checkout"
          ? timingQuantities[e.id]?.units ?? effectiveLofts
          : undefined;
      const petCount =
        e.id === "pet" ? timingQuantities.pet?.units ?? 1 : undefined;
      const lineTotal = extraLineTotalCop(e, {
        mealQty:
          e.id === "breakfast" || e.id === "lunch"
            ? mealQuantities[e.id]
            : undefined,
        airport: e.id === "airport-transfer" ? airportTransfer : undefined,
        units: timingUnits,
        petCount,
      });
      if (e.pricing === "perAirportLeg") {
        const parts: string[] = [];
        if (airportTransfer.pickup) parts.push("recogida en aeropuerto");
        if (airportTransfer.dropoff) parts.push("traslado al aeropuerto");
        const vehicles = Math.max(1, airportTransfer.vehicles);
        return `• ${e.label}: ${parts.join(" + ") || "—"} · ${vehicles} vehículo${vehicles === 1 ? "" : "s"} (máx. ${AIRPORT_VEHICLE_CAPACITY} pasajeros c/u) · ${formatCOP(lineTotal)} estimado`;
      }
      if (e.pricing === "perGuestPerDay") {
        const q = mealQuantities[e.id as MealExtraId];
        return `• ${e.label}: ${formatCOP(e.priceCop)}/pers./día × ${q?.guests ?? guests} huésped(es) × ${q?.days ?? mealDaysDefault} día(s) = ${formatCOP(lineTotal)} (estimado)`;
      }
      if (e.id === "early-checkin" || e.id === "late-checkout") {
        const u = timingUnits ?? 1;
        return `• ${e.label}: ${formatCOP(e.priceCop)} × ${u} loft${u === 1 ? "" : "s"} = ${formatCOP(lineTotal)} (estimado)`;
      }
      if (e.id === "pet") {
        const c = petCount ?? 1;
        return `• ${e.label}: ${formatCOP(e.priceCop)} × ${c} mascota${c === 1 ? "" : "s"} (máx. ${PETS_PER_LOFT}/loft) = ${formatCOP(lineTotal)} (estimado)`;
      }
      return `• ${e.label}: ${formatCOP(e.priceCop)} (estimado)`;
    });

    const categoryMeta = effectiveCategoryId
      ? getLoftCategory(effectiveCategoryId)
      : null;
    const nights = quoteForMsg.ok ? quoteForMsg.noches : null;
    const channelLabel =
      bookingChannel === "corporate"
        ? "Corporativo / empresa"
        : bookingChannel === "referral"
          ? "Referido"
          : bookingChannel === "whatsapp"
            ? "WhatsApp"
            : "Directo (web)";
    const depositAmount =
      totalForMsg !== null && depositPct > 0
        ? Math.round((totalForMsg * depositPct) / 100)
        : null;
    return [
      `Hola ${site.name}, quiero reservar:`,
      name.trim() ? `Nombre: ${name.trim()}` : "",
      reservationCode ? `Código reserva: ${reservationCode}` : "",
      profileMeta ? `Tipo de viaje: ${profileMeta.title}` : "",
      categoryMeta
        ? `Tipo de loft confirmado: ${categoryMeta.name} (${categoryMeta.tagline})`
        : "",
      assignedUnits?.length
        ? `Unidad(es) asignada(s): loft ${assignedUnits.join(", ")}`
        : "",
      checkIn && checkOut
        ? `Fechas: ${checkIn} → ${checkOut}${nights != null ? ` (${nights} noche${nights === 1 ? "" : "s"})` : ""}`
        : "",
      `Check-in: ${site.checkIn} · Check-out: ${site.checkOut}`,
      `Huéspedes: ${guests} · Lofts: ${effectiveLofts}`,
      `Dirección: ${site.addressLine}, ${site.neighborhood}, ${site.city}`,
      `Canal: ${channelLabel}`,
      bookingChannel === "corporate" && corporateName.trim()
        ? `Empresa: ${corporateName.trim()}`
        : "",
      bookingChannel === "referral" && referrerName.trim()
        ? `Referido por: ${referrerName.trim()}`
        : "",
      extraLines.length ? `\nExtras:\n${extraLines.join("\n")}` : "\nExtras: ninguno",
      totalForMsg !== null
        ? `\nTotal estimado (web): ${formatCOP(totalForMsg)}`
        : "",
      depositAmount != null
        ? `Anticipo sugerido (${depositPct}%): ${formatCOP(depositAmount)}`
        : "",
      couponDiscount > 0 && couponCode
        ? `Cupón ${couponCode.trim().toUpperCase()}: −${formatCOP(couponDiscount)}`
        : "",
      quoteForMsg.ok && stayTotal != null
        ? `(Alojamiento+aseo: ${formatCOP(stayTotal)}${extrasCop ? ` + extras ${formatCOP(extrasCop)}` : ""})`
        : "",
      "",
      "Confirmo que la tarifa final y descuentos de grupo o larga estadía se cierran por WhatsApp.",
    ].filter(Boolean);
  }

  /**
   * Fase 4: verifica disponibilidad Airbnb/iCal en vivo, crea reserva
   * y abre WhatsApp como canal de confirmación.
   */
  async function completeBooking(opts?: {
    categoryOverride?: LoftCategoryId;
    assignedUnits?: number[];
  }) {
    if (!quoteResult.ok || bookingBusy || !policiesAccepted) return;
    if (availCheck.status === "checking") return;
    if (availCheck.status !== "ok" && !opts?.assignedUnits) {
      setBookingError(
        availCheck.message ??
          "Confirma disponibilidad antes de reservar (revisa fechas o el tipo de loft).",
      );
      return;
    }
    const effectiveCategory = opts?.categoryOverride ?? categoryId;
    setBookingBusy(true);
    setBookingError(null);
    setLiveOffer(null);

    const extrasPayload = CONFIGURATOR_EXTRAS.filter((e) =>
      extras.includes(e.id),
    ).map((e) => {
      const timingUnits =
        e.id === "early-checkin" || e.id === "late-checkout"
          ? timingQuantities[e.id]?.units ?? lofts
          : undefined;
      const petCount =
        e.id === "pet" ? timingQuantities.pet?.units ?? 1 : undefined;
      const amountCop =
        e.interestOnly || e.priceCop <= 0
          ? 0
          : extraLineTotalCop(e, {
              mealQty:
                e.id === "breakfast" || e.id === "lunch"
                  ? mealQuantities[e.id]
                  : undefined,
              airport:
                e.id === "airport-transfer" ? airportTransfer : undefined,
              units: timingUnits,
              petCount,
            });
      const base: {
        id: string;
        label: string;
        amountCop: number;
        units?: number;
        vehicles?: number;
        pickup?: boolean;
        dropoff?: boolean;
        mealDays?: number;
        mealGuests?: number;
      } = {
        id: e.id,
        label: e.label,
        amountCop,
      };
      if (e.id === "early-checkin" || e.id === "late-checkout") {
        base.units = timingUnits;
      }
      if (e.id === "pet") {
        base.units = petCount;
      }
      if (e.id === "airport-transfer") {
        base.pickup = airportTransfer.pickup;
        base.dropoff = airportTransfer.dropoff;
        base.vehicles = airportTransfer.vehicles;
      }
      if (e.id === "breakfast" || e.id === "lunch") {
        const q = mealQuantities[e.id];
        base.mealDays = q?.days;
        base.mealGuests = q?.guests;
      }
      return base;
    });

    let reservationCode: string | undefined;
    let confirmedUnits: number[] | undefined = opts?.assignedUnits;
    try {
      if (checkIn && checkOut && effectiveCategory) {
        const liveRes = await fetch("/api/public/availability/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            check_in: checkIn,
            check_out: checkOut,
            guests,
            lofts,
            category_id: effectiveCategory,
          }),
        });
        if (!liveRes.ok) {
          setBookingError(
            "No se pudo verificar disponibilidad en vivo. Intenta de nuevo; no abrimos WhatsApp sin cupo confirmado.",
          );
          setAvailCheck({
            status: "fail",
            message: "Verificación de disponibilidad fallida.",
          });
          setBookingBusy(false);
          return;
        }
        {
          const live = (await liveRes.json()) as {
            ok?: boolean;
            message?: string;
            warning?: string;
            assignedUnits?: number[];
            alternative?: {
              categoryId: LoftCategoryId;
              name: string;
              priceFromCop: number;
              assignedUnits: number[];
            } | null;
            alternatives?: Array<{
              categoryId: LoftCategoryId;
              name: string;
              priceFromCop: number;
              assignedUnits: number[];
            }>;
            reason?: string;
          };

          if (live.warning) setLiveWarning(live.warning);
          else setLiveWarning(null);

          if (!live.ok) {
            if (live.alternative) {
              const availableIds = new Set<LoftCategoryId>([
                live.alternative.categoryId,
                ...(live.alternatives ?? []).map((a) => a.categoryId),
              ]);
              const blocked = LOFT_CATEGORIES.map((c) => c.id).filter(
                (id) => !availableIds.has(id),
              );
              // El tipo pedido también queda bloqueado si falló.
              if (
                effectiveCategory &&
                !availableIds.has(effectiveCategory) &&
                !blocked.includes(effectiveCategory)
              ) {
                blocked.push(effectiveCategory);
              }
              setBlockedCategoryIds(blocked);
              setLiveOffer({
                message:
                  live.message ??
                  "No hay cupo del tipo elegido. Hay otra opción disponible.",
                categoryId: live.alternative.categoryId,
                name: live.alternative.name,
                priceFromCop: live.alternative.priceFromCop,
                assignedUnits: live.alternative.assignedUnits,
                warning: live.warning,
                blockedCategoryIds: blocked,
              });
              setCategoryId(live.alternative.categoryId);
              setAssignedUnitsHint(live.alternative.assignedUnits);
              setLofts(Math.max(1, live.alternative.assignedUnits.length));
              setSkipLoftStep(false);
              setBookingError(null);
              setBookingBusy(false);
              setAvailCheck({ status: "fail", message: live.message });
              // Volver al paso loft con la misma animación orbital del wizard.
              goToStep(STEP_LOFT);
              return;
            }
            setBookingError(
              live.message ??
                "No hay disponibilidad para esas fechas. Ajusta fechas o continúa por WhatsApp.",
            );
            setAvailCheck({
              status: "fail",
              message: live.message ?? "Sin disponibilidad",
            });
            setBookingBusy(false);
            trackWhatsAppClick("guided_reservation_unavailable");
            window.open(
              waLink(
                buildWhatsAppLines(undefined, {
                  categoryId: effectiveCategory,
                  lofts,
                  assignedUnits: assignedUnitsHint ?? undefined,
                }).join("\n"),
              ),
              "_blank",
              "noopener",
            );
            return;
          }

          if (live.assignedUnits?.length) {
            setAssignedUnitsHint(live.assignedUnits);
            setLofts((prev) => Math.max(prev, live.assignedUnits!.length));
            confirmedUnits = live.assignedUnits;
          }
          setAvailCheck({
            status: "ok",
            message: live.assignedUnits?.length
              ? `Cupo confirmado · loft ${live.assignedUnits.join(", ")}`
              : "Cupo confirmado",
          });
        }
      } else {
        setBookingError(
          "Faltan fechas o tipo de loft para confirmar disponibilidad.",
        );
        setBookingBusy(false);
        return;
      }

      const unitsForNotes =
        opts?.assignedUnits ?? confirmedUnits ?? assignedUnitsHint ?? undefined;
      const verifiedLofts = unitsForNotes?.length
        ? unitsForNotes.length
        : lofts;
      const waMessageOverrides = {
        categoryId: effectiveCategory,
        lofts: verifiedLofts,
        assignedUnits: unitsForNotes,
      };

      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_in: checkIn,
          check_out: checkOut,
          guests,
          lofts: verifiedLofts,
          guest_name: name.trim() || "Huésped web",
          category_id: effectiveCategory ?? undefined,
          extras: extrasPayload,
          coupon_code: couponCode.trim() || undefined,
          also_whatsapp: true,
          channel: bookingChannel,
          corporate_name:
            bookingChannel === "corporate"
              ? corporateName.trim() || undefined
              : undefined,
          referrer_name:
            bookingChannel === "referral"
              ? referrerName.trim() || undefined
              : undefined,
          notes: [
            effectiveCategory
              ? `Tipo de loft confirmado: ${getLoftCategory(effectiveCategory).name}`
              : null,
            unitsForNotes?.length
              ? `Unidades sugeridas (iCal): loft ${unitsForNotes.join(", ")}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reservation_code?: string;
        error?: string;
        mode?: string;
      };
      if (!res.ok || !data.ok) {
        setBookingError(
          data.error ??
            "No se pudo crear la reserva (disponibilidad). Puedes continuar por WhatsApp.",
        );
      } else {
        reservationCode = data.reservation_code;
        if (reservationCode) {
          stashWhatsAppReservationMessage(
            buildWhatsAppLines(reservationCode, waMessageOverrides).join("\n"),
          );
          window.location.href = `/confirmacion/${encodeURIComponent(reservationCode)}?wa=1`;
          return;
        }
      }

      trackWhatsAppClick("guided_reservation_submit");
      trackBeginCheckout({
        lofts: Number(verifiedLofts),
        guests: Number(guests),
      });
      window.open(
        waLink(
          buildWhatsAppLines(reservationCode, waMessageOverrides).join("\n"),
        ),
        "_blank",
        "noopener",
      );
      return;
    } catch {
      setBookingError(
        "Motor de reservas no disponible — abriendo WhatsApp (fallback).",
      );
    } finally {
      setBookingBusy(false);
    }

    const fallbackUnits =
      opts?.assignedUnits ?? assignedUnitsHint ?? undefined;
    const fallbackOverrides = {
      categoryId: effectiveCategory,
      lofts: fallbackUnits?.length ?? lofts,
      assignedUnits: fallbackUnits,
    };
    trackWhatsAppClick("guided_reservation_submit");
    trackBeginCheckout({
      lofts: Number(fallbackOverrides.lofts),
      guests: Number(guests),
    });
    window.open(
      waLink(
        buildWhatsAppLines(reservationCode, fallbackOverrides).join("\n"),
      ),
      "_blank",
      "noopener",
    );
  }

  function handleReservar() {
    return completeBooking();
  }

  function acceptLiveOffer() {
    if (!liveOffer) return;
    const offer = liveOffer;
    setCategoryId(offer.categoryId);
    setAssignedUnitsHint(offer.assignedUnits);
    setLofts(Math.max(1, offer.assignedUnits.length));
    setLiveOffer(null);
    setBlockedCategoryIds([]);
    void completeBooking({
      categoryOverride: offer.categoryId,
      assignedUnits: offer.assignedUnits,
    });
  }

  function dismissLiveOffer() {
    // Quedarse en loft con tipos sin cupo deshabilitados.
    setLiveOffer(null);
  }

  return (
    <section
      id="reservas"
      data-wizard-build="extras-v9-vehicles-avail-ui"
      data-wizard-step={String(step)}
      data-wizard-profile={profile ?? ""}
      className={cn(
        "scroll-mt-24 bg-[#f2f0eb] dark:bg-zinc-950",
        compact
          ? "px-0 py-2 md:py-4"
          : "border-y border-zinc-200 px-4 py-14 dark:border-zinc-800 md:px-6 md:py-16",
      )}
    >
      <div className="mx-auto max-w-5xl">
        {/* Solo stepper centrado + contenido del paso (sin intro duplicado). */}
        <div className="mb-8 flex justify-center">
          <ConfiguratorOrbitalSteps
            activeStep={displayStep}
            coveredSteps={coveredSteps}
            onStepSelect={(i) => {
              if (transitionTo !== null) return;
              if (i > step) return;
              // Reabrir etapas saltadas para corregir fechas/huéspedes/loft.
              if (i === STEP_TU_VIAJE && skipTripStep) {
                setSkipTripStep(false);
              }
              if (
                skipStaySteps &&
                (i === STEP_FECHAS || i === STEP_HUESPEDES)
              ) {
                setSkipStaySteps(false);
              }
              if (i === STEP_LOFT && skipLoftStep) {
                setSkipLoftStep(false);
              }
              goToStep(i);
            }}
            className="mx-auto max-w-lg"
          />
        </div>

        <AnimatePresence>
          {transitionTo !== null ? (
            <motion.div
              key="orbital-transition"
              className="pointer-events-none fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-[#f2f0eb]/70 px-4 backdrop-blur-md dark:bg-zinc-950/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              aria-live="polite"
              aria-label={
                liveOffer && transitionTo === STEP_LOFT
                  ? "Buscando loft disponible"
                  : `Pasando a ${STEPS[transitionTo]}`
              }
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <ConfiguratorOrbitalTransition
                  activeStep={transitionTo}
                  coveredSteps={coveredSteps}
                />
              </motion.div>
              {liveOffer && transitionTo === STEP_LOFT ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  className="max-w-md rounded-2xl border border-amber-300/80 bg-amber-50/95 px-5 py-4 text-center shadow-lg dark:border-amber-700/60 dark:bg-amber-950/90"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">
                    Disponibilidad en vivo
                  </p>
                  <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
                    {liveOffer.message}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                    Te llevamos a elegir {liveOffer.name}
                  </p>
                </motion.div>
              ) : null}
            </motion.div>
          ) : null}
          {availCheck.status === "checking" && transitionTo === null ? (
            <motion.div
              key="avail-checking-overlay"
              className="pointer-events-none fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-[#f2f0eb]/75 px-4 backdrop-blur-md dark:bg-zinc-950/75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AvailabilityCheckingPanel
                categoryId={categoryId}
                variant="overlay"
                className="w-full shadow-2xl"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

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
                        data-profile-id={p.id}
                        aria-pressed={profile === p.id}
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
                            <span className="min-w-0 flex-1">
                              {quoteResult.aseoDetalle || "Aseo"}
                            </span>
                            <span className="shrink-0">
                              {formatCOP(quoteResult.aseoTotal)}
                            </span>
                          </li>
                        ) : null}
                        {quoteResult.depositoDanos > 0 ? (
                          <li className="flex justify-between gap-3 text-zinc-500">
                            <span className="min-w-0 flex-1">
                              Depósito de daños (estimado, no incluido)
                            </span>
                            <span className="shrink-0">
                              {formatCOP(quoteResult.depositoDanos)}
                            </span>
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
                  {skipLoftStep && categoryId ? (
                    <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                      Tipo elegido:{" "}
                      <strong>{getLoftCategory(categoryId).name}</strong>
                      <span className="text-zinc-500 dark:text-amber-200/70">
                        {" "}
                        · {getLoftCategory(categoryId).tagline}
                      </span>
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

              {step === STEP_LOFT && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Elige tu tipo de loft
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {entryFrom === "banner"
                      ? "Ya tienes fechas y huéspedes. Escoge Vista, Atrio o Cielo para continuar."
                      : "Vista, Atrio o Cielo — precio desde por noche (temporada baja)."}
                  </p>
                  <AnimatePresence>
                    {liveOffer ? (
                      <motion.div
                        key="live-offer-banner"
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-left dark:border-amber-700/60 dark:bg-amber-950/40"
                      >
                        <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                          Disponibilidad en vivo
                        </p>
                        <p className="mt-1 text-sm text-amber-950 dark:text-amber-100">
                          {liveOffer.message}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                          {liveOffer.name}{" "}
                          <span className="font-normal text-zinc-600 dark:text-zinc-400">
                            · hasta{" "}
                            {categoryReservationMaxGuests(liveOffer.categoryId)}{" "}
                            personas · desde{" "}
                            {formatCOP(liveOffer.priceFromCop)}/noche
                          </span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          Unidades libres ahora: loft{" "}
                          {liveOffer.assignedUnits.join(", ")} · máx.{" "}
                          {GUESTS_PER_LOFT_MAX} huéspedes por loft
                        </p>
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => dismissLiveOffer()}
                            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold dark:border-zinc-600 dark:bg-transparent"
                          >
                            Elegir otro
                          </button>
                          <button
                            type="button"
                            disabled={bookingBusy}
                            onClick={() => acceptLiveOffer()}
                            className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-zinc-900"
                          >
                            Reservar {liveOffer.name}
                          </button>
                        </div>
                      </motion.div>
                    ) : blockedCategoryIds.length > 0 ? (
                      <motion.p
                        key="blocked-hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-amber-800 dark:text-amber-300"
                      >
                        Algunos tipos no tienen cupo en esas fechas y quedaron
                        deshabilitados. Elige uno disponible para continuar.
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {LOFT_CATEGORIES.map((cat) => {
                      const fitsGuests =
                        availableLoftsForGuests(cat, guests).length > 0;
                      const blockedByDates = blockedCategoryIds.includes(cat.id);
                      const fits = fitsGuests && !blockedByDates;
                      const active = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          disabled={!fits}
                          onClick={() => {
                            setCategoryId(cat.id);
                            setLiveOffer(null);
                            const stayReadyNow = datesOk && guests >= 1;
                            if (stayReadyNow) {
                              setSkipStaySteps(true);
                              setGuestsFromDraft(true);
                            }
                            const nextStep = stepAfterSelectingLoft({
                              hasDates: datesOk,
                              hasGuests: stayReadyNow || guestsFromDraft,
                            });
                            const from =
                              entryFrom ??
                              (stayReadyNow ? ("banner" as const) : undefined);
                            mergeStayDraft({
                              categoryId: cat.id,
                              checkIn: checkIn || undefined,
                              checkOut: checkOut || undefined,
                              guests: guests > 0 ? guests : undefined,
                              ...(from ? { from } : {}),
                              step: nextStep,
                            });
                            // Con fechas+huéspedes ya en state/draft → Extras (no repetir).
                            if (stayReadyNow) goToStep(STEP_EXTRAS);
                          }}
                          className={cn(
                            "overflow-hidden rounded-2xl border text-left transition",
                            active
                              ? "border-amber-500 ring-2 ring-amber-500/30"
                              : "border-zinc-200 dark:border-zinc-700",
                            fits
                              ? "hover:border-amber-400/80"
                              : "cursor-not-allowed opacity-40 grayscale",
                          )}
                        >
                          <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-800">
                            <Image
                              src={cat.images?.[0] ?? cat.image}
                              alt={cat.imageAlt}
                              fill
                              sizes="220px"
                              className="object-cover"
                            />
                          </div>
                          <span className="block px-3 pb-3 pt-2">
                            <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                              {cat.name}
                            </span>
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              Desde {cat.priceFromCop.toLocaleString("es-CO")}{" "}
                              COP / noche
                            </span>
                            <span className="mt-1 block text-[11px] text-zinc-500">
                              {cat.tagline}
                            </span>
                            {blockedByDates ? (
                              <span className="mt-1 block text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                Sin cupo en esas fechas
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === STEP_EXTRAS && (
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
                    {CONFIGURATOR_EXTRAS.filter(
                      (e) =>
                        e.id !== "early-checkin" || earlyCheckInOffered,
                    ).map((e) => {
                      const isMeal =
                        e.id === "breakfast" || e.id === "lunch";
                      const isAirport = e.id === "airport-transfer";
                      const isTiming =
                        e.id === "early-checkin" || e.id === "late-checkout";
                      const isPet = e.id === "pet";
                      const mealId = isMeal ? (e.id as MealExtraId) : null;
                      const timingId = isTiming
                        ? (e.id as TimingExtraId)
                        : null;
                      const checked = extras.includes(e.id);
                      const timingUnits = timingId
                        ? timingQuantities[timingId]?.units ?? lofts
                        : undefined;
                      const petCount = isPet
                        ? timingQuantities.pet?.units ?? 1
                        : undefined;
                      const lineTotal = checked
                        ? extraLineTotalCop(e, {
                            mealQty: mealId
                              ? mealQuantities[mealId]
                              : undefined,
                            airport: isAirport ? airportTransfer : undefined,
                            units: timingUnits,
                            petCount,
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
                                      : `+ ${formatCOP(e.priceCop)} / trayecto / vehículo`}
                                  </span>
                                ) : isTiming ? (
                                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                    {checked && lineTotal > 0
                                      ? `+ ${formatCOP(lineTotal)}`
                                      : `+ ${formatCOP(e.priceCop)} / loft`}
                                  </span>
                                ) : isPet ? (
                                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                    {checked && lineTotal > 0
                                      ? `+ ${formatCOP(lineTotal)}`
                                      : `+ ${formatCOP(e.priceCop)} / mascota`}
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
                              {checked && isTiming && timingId && lofts > 1 ? (
                                <div className="mt-3">
                                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                    ¿Para cuántos apartamentos?
                                  </label>
                                  <select
                                    value={timingUnits ?? lofts}
                                    onChange={(ev) =>
                                      updateTimingUnits(
                                        timingId,
                                        Number(ev.target.value) || 1,
                                      )
                                    }
                                    onClick={(ev) => ev.stopPropagation()}
                                    className="w-full max-w-[12rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                  >
                                    {Array.from(
                                      { length: lofts },
                                      (_, i) => i + 1,
                                    ).map((n) => (
                                      <option key={n} value={n}>
                                        {n} loft{n === 1 ? "" : "s"} ·{" "}
                                        {formatCOP(e.priceCop * n)}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="mt-1 text-[10px] text-zinc-400">
                                    El valor es {formatCOP(e.priceCop)} por cada
                                    loft que solicite el servicio.
                                  </p>
                                </div>
                              ) : null}
                              {checked && isPet ? (
                                <div className="mt-3">
                                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                    ¿Cuántas mascotas?
                                  </label>
                                  <select
                                    value={petCount ?? 1}
                                    onChange={(ev) =>
                                      updateTimingUnits(
                                        "pet",
                                        Number(ev.target.value) || 1,
                                      )
                                    }
                                    onClick={(ev) => ev.stopPropagation()}
                                    className="w-full max-w-[14rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                  >
                                    {Array.from(
                                      { length: maxPetsForLofts(lofts) },
                                      (_, i) => i + 1,
                                    ).map((n) => (
                                      <option key={n} value={n}>
                                        {n} mascota{n === 1 ? "" : "s"} ·{" "}
                                        {formatCOP(e.priceCop * n)}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="mt-1 text-[10px] text-zinc-400">
                                    {formatCOP(e.priceCop)} por mascota. Máximo{" "}
                                    {PETS_PER_LOFT} por loft (hasta{" "}
                                    {maxPetsForLofts(lofts)} en esta reserva).
                                  </p>
                                </div>
                              ) : null}
                              {checked && isAirport ? (
                                <div className="mt-3 space-y-3">
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
                                  <div>
                                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                        ¿Cuántos vehículos de traslado?
                                      </label>
                                      <select
                                        value={airportTransfer.vehicles}
                                        onChange={(ev) =>
                                          updateAirportVehicles(
                                            Number(ev.target.value) || 1,
                                          )
                                        }
                                        onClick={(ev) => ev.stopPropagation()}
                                        className="w-full max-w-[14rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                      >
                                        {Array.from(
                                          {
                                            length: Math.max(
                                              5,
                                              minTransferVehicles + 3,
                                            ),
                                          },
                                          (_, i) => i + 1,
                                        ).map((n) => (
                                          <option key={n} value={n}>
                                            {n} vehículo{n === 1 ? "" : "s"} ·
                                            hasta {n * AIRPORT_VEHICLE_CAPACITY}{" "}
                                            pasajeros
                                            {n === minTransferVehicles
                                              ? " (sugerido)"
                                              : ""}
                                          </option>
                                        ))}
                                      </select>
                                      <p className="mt-1 text-[10px] text-zinc-400">
                                        Sugerido para {guests} huésped
                                        {guests === 1 ? "" : "es"}:{" "}
                                        {minTransferVehicles} vehículo
                                        {minTransferVehicles === 1
                                          ? ""
                                          : "s"}{" "}
                                        (máx. {AIRPORT_VEHICLE_CAPACITY}{" "}
                                        pasajeros c/u). Puedes elegir menos si
                                        no los necesitas todos. Precio:{" "}
                                        {formatCOP(e.priceCop)} por trayecto y
                                        por vehículo.
                                      </p>
                                      {airportTransfer.vehicles *
                                        AIRPORT_VEHICLE_CAPACITY <
                                      guests ? (
                                        <p className="mt-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                          Con {airportTransfer.vehicles}{" "}
                                          vehículo
                                          {airportTransfer.vehicles === 1
                                            ? ""
                                            : "s"}{" "}
                                          caben hasta{" "}
                                          {airportTransfer.vehicles *
                                            AIRPORT_VEHICLE_CAPACITY}{" "}
                                          pasajeros; sois {guests}. Coordina el
                                          resto por WhatsApp o suma vehículos.
                                        </p>
                                      ) : null}
                                    </div>
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
                                      max={Math.max(mealDaysMin, mealDaysMax)}
                                      value={
                                        mealQuantities[mealId]?.days ??
                                        mealDaysDefault
                                      }
                                      onChange={(ev) =>
                                        updateMealQty(mealId, {
                                          days: Number(ev.target.value) || 0,
                                        })
                                      }
                                      onClick={(ev) => ev.stopPropagation()}
                                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                                    />
                                    <p className="mt-1 text-[10px] text-zinc-400">
                                      Máximo {mealDaysMax} día
                                      {mealDaysMax === 1 ? "" : "s"} (igual a las
                                      noches de la reserva)
                                      {mealDaysMin >= 1
                                        ? "; mínimo 1 con una noche."
                                        : "."}
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

              {step === STEP_CONFIRMAR && (
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
                      <dt className="text-zinc-500">Categoría</dt>
                      <dd className="font-medium">
                        {categoryId
                          ? getLoftCategory(categoryId).name
                          : "Sin preferencia (tarifa base)"}
                      </dd>
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
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">Disponibilidad</dt>
                      <dd
                        className={cn(
                          "text-right font-medium",
                          availCheck.status === "ok" &&
                            "text-emerald-700 dark:text-emerald-400",
                          availCheck.status === "fail" &&
                            "text-amber-800 dark:text-amber-300",
                          availCheck.status === "checking" && "text-zinc-500",
                        )}
                      >
                        {availCheck.status === "checking"
                          ? "Consultando cupo…"
                          : availCheck.status === "ok"
                            ? availCheck.message ?? "Cupo confirmado"
                            : availCheck.status === "fail"
                              ? availCheck.message ?? "Sin confirmar"
                              : "—"}
                      </dd>
                    </div>
                    {assignedUnitsHint?.length ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-zinc-500">Unidades sugeridas</dt>
                        <dd className="font-medium">
                          loft {assignedUnitsHint.join(", ")}
                        </dd>
                      </div>
                    ) : null}
                    {selectedExtras.length > 0 ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-zinc-500">Extras</dt>
                        <dd className="text-right font-medium">
                          {selectedExtras.length} servicio
                          {selectedExtras.length === 1 ? "" : "s"}
                          {extrasCop > 0 ? (
                            <span className="ml-2 text-xs font-normal text-zinc-500">
                              {formatCOP(extrasCop)}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {quoteResult.ok && priceBreakdownLines.length > 0 ? (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setBreakdownOpen((v) => !v)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                        aria-expanded={breakdownOpen}
                      >
                        <span>
                          {breakdownOpen ? "Ocultar desglose" : "Ver desglose"}
                        </span>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-zinc-500 transition-transform",
                            breakdownOpen && "rotate-180",
                          )}
                          aria-hidden
                        />
                      </button>
                      {breakdownOpen ? (
                        <ul className="space-y-2 border-t border-zinc-200 px-3 py-3 text-sm dark:border-zinc-700">
                          {priceBreakdownLines.map((line) => {
                            const isTotal = line.id === "total";
                            const isCoupon = line.id === "coupon";
                            return (
                              <li
                                key={line.id}
                                className={cn(
                                  "flex justify-between gap-3",
                                  isTotal &&
                                    "border-t border-zinc-200 pt-2 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-white",
                                  isCoupon &&
                                    "text-emerald-800 dark:text-emerald-300",
                                  line.muted && "text-zinc-500",
                                )}
                              >
                                <span className="min-w-0 leading-snug">
                                  {line.label}
                                </span>
                                <span className="shrink-0 tabular-nums">
                                  {line.amount == null
                                    ? "Consultar"
                                    : formatCOP(line.amount)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Origen de la reserva
                    </label>
                    <select
                      value={bookingChannel}
                      onChange={(e) =>
                        setBookingChannel(
                          e.target.value as typeof bookingChannel,
                        )
                      }
                      className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                    >
                      <option value="direct">Directo (web)</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="corporate">Corporativo / empresa</option>
                      <option value="referral">Referido</option>
                    </select>
                    {bookingChannel === "corporate" ? (
                      <input
                        type="text"
                        value={corporateName}
                        onChange={(e) => setCorporateName(e.target.value)}
                        placeholder="Nombre de la empresa"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                      />
                    ) : null}
                    {bookingChannel === "referral" ? (
                      <input
                        type="text"
                        value={referrerName}
                        onChange={(e) => setReferrerName(e.target.value)}
                        placeholder="Quién te refirió"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
                      />
                    ) : null}
                  </div>
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
                      {couponDiscount > 0 ? (
                        <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                          Cupón −{formatCOP(couponDiscount)}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponDiscount(0);
                            setCouponMsg(null);
                          }}
                          placeholder="Cupón (opcional)"
                          className="min-w-[140px] flex-1 rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                        <button
                          type="button"
                          onClick={() => void applyCoupon()}
                          className="rounded-full border border-zinc-400 px-3 py-2 text-xs font-semibold"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponMsg ? (
                        <p className="mt-1 text-xs text-zinc-500">{couponMsg}</p>
                      ) : null}
                      <ul className="mt-2 list-inside list-disc text-xs text-zinc-500">
                        {quoteResult.disclaimers.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Políticas de Lofthouse 14
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                      <li>
                        <Link
                          href="/politicas#deposito"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-amber-900 underline underline-offset-2 dark:text-amber-300"
                        >
                          Depósito de daños
                        </Link>
                        : {formatCOP(DAMAGE_DEPOSIT_SHORT_COP)} por loft (&lt;7
                        días) · {formatCOP(DAMAGE_DEPOSIT_LONG_COP)} por loft
                        (≥7 días). No está incluido en el total de la reserva.
                      </li>
                      <li>
                        <Link
                          href="/politicas#aseo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-amber-900 underline underline-offset-2 dark:text-amber-300"
                        >
                          Aseo
                        </Link>
                        : {formatCOP(ASEO_CORTA_COP)} (1–2 noches) ·{" "}
                        {formatCOP(ASEO_ESTANDAR_COP)} (a partir de 4 noches) · +
                        {formatCOP(ASEO_SEMANAL_EXTRA_COP)}/semana si &gt;7 días.
                      </li>
                      <li>
                        <Link
                          href="/politicas#estadia"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-amber-900 underline underline-offset-2 dark:text-amber-300"
                        >
                          Duración máxima
                        </Link>
                        : {MAX_STAY_NIGHTS} días. Más tiempo = políticas
                        diferentes / cotización especial.
                      </li>
                      <li>
                        Anticipo del {depositPct}% para confirmar; saldo el día
                        del check-in ({site.checkIn} / {site.checkOut}).
                      </li>
                      <li>
                        Cancelación ({SEED_CANCELLATION_POLICY.name}):{" "}
                        {SEED_CANCELLATION_POLICY.tiers
                          .map(
                            (t) =>
                              `${t.label} ${t.feePercentOfDeposit}% del anticipo`,
                          )
                          .join("; ")}
                        ; no-show{" "}
                        {SEED_CANCELLATION_POLICY.noShowFeePercentOfDeposit}%.
                      </li>
                      <li>
                        Normas: sin fiestas, silencio 11:00 PM–6:00 AM, no fumar
                        en interiores.
                      </li>
                    </ul>
                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      Detalle completo en{" "}
                      <Link
                        href="/politicas"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-amber-900 underline underline-offset-2 dark:text-amber-300"
                      >
                        /politicas
                      </Link>
                      . Debes aceptarlas abajo, junto a RESERVAR.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div
            data-wizard-footer
            className="sticky bottom-0 z-50 mt-8 -mx-6 flex flex-col gap-4 border-t border-zinc-100 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 sm:-mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"
          >
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
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
              <div className="flex flex-row flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={!canGoBack || transitionTo !== null}
                  onClick={() => {
                    const prev = prevLogicalStep(step);
                    if (prev === null) return;
                    // Al volver, reabrir la sección para poder reconfigurar
                    // aunque se haya llegado por un atajo (banner/card).
                    if (prev === STEP_TU_VIAJE) setSkipTripStep(false);
                    if (prev === STEP_FECHAS || prev === STEP_HUESPEDES) {
                      setSkipStaySteps(false);
                    }
                    if (prev === STEP_LOFT) setSkipLoftStep(false);
                    goToStep(prev);
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600"
                  aria-label="Regresar al paso anterior"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Atrás
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    data-wizard-next
                    aria-label="Siguiente paso del configurador"
                    disabled={!canAdvance() || transitionTo !== null}
                    onClick={() => advanceFromCurrentStep()}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                  >
                    Siguiente
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                ) : (
                  <>
                    <label
                      className={cn(
                        "inline-flex max-w-[14rem] cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition sm:max-w-none sm:text-sm",
                        policiesAccepted
                          ? "border-emerald-300 bg-emerald-50/80 text-zinc-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-zinc-100"
                          : "border-amber-300 bg-amber-50 text-zinc-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-zinc-100",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={policiesAccepted}
                        onChange={(e) => setPoliciesAccepted(e.target.checked)}
                        className="size-4 shrink-0 rounded border-zinc-400"
                      />
                      <span className="leading-snug">
                        Acepto las políticas de Lofthouse 14
                      </span>
                    </label>
                    <button
                      type="button"
                      disabled={
                        !quoteResult.ok ||
                        bookingBusy ||
                        !policiesAccepted ||
                        availCheck.status !== "ok"
                      }
                      onClick={() => void handleReservar()}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                    >
                      <Image
                        src="/logos/whatsapp.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="size-5"
                        aria-hidden
                      />
                      {bookingBusy
                        ? "Creando reserva…"
                        : availCheck.status === "checking"
                          ? "Verificando…"
                          : "RESERVAR"}
                    </button>
                  </>
                )}
              </div>
              {step === STEPS.length - 1 ? (
                <div className="space-y-1 text-right">
                  {bookingError ? (
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {bookingError}
                    </p>
                  ) : null}
                  {liveWarning && !liveOffer ? (
                    <p className="text-[11px] text-zinc-500">{liveWarning}</p>
                  ) : null}
                  {availCheck.status === "checking" ? (
                    <p className="text-[11px] text-zinc-500">
                      Consultando la disponibilidad de los alojamientos que
                      seleccionaste…
                    </p>
                  ) : null}
                  {availCheck.status === "fail" ? (
                    <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                      {availCheck.message ??
                        "Sin cupo confirmado: RESERVAR permanece deshabilitado."}
                    </p>
                  ) : null}
                  {!policiesAccepted ? (
                    <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                      Márcalo para habilitar el botón RESERVAR.
                    </p>
                  ) : null}
                  <p className="text-[11px] text-zinc-500">
                    Se crea la reserva y se abre WhatsApp para confirmar.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
