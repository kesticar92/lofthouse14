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
  type AirportTransferChoice,
  type MealExtraId,
  type MealExtraQuantity,
  type TripProfile,
} from "@/lib/configurator-extras";
import { cn } from "@/lib/cn";
import {
  ConfiguratorOrbitalSteps,
  ConfiguratorOrbitalTransition,
} from "@/components/sections/configurator-orbital-steps";
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
  getLoftCategory,
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
    });
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
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
    const applyDraft = (draft: StayDraft | null) => {
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

    applyDraft(queryDraft ?? readStayDraft());

    const onDraft = (event: Event) => {
      const custom = event as CustomEvent<StayDraft>;
      applyDraft(custom.detail ?? null);
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

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  function goToStep(target: number, { animate = true } = {}) {
    const clamped = Math.min(STEPS.length - 1, Math.max(0, target));
    if (clamped === step && transitionTo === null) return;

    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }

    if (!animate) {
      setTransitionTo(null);
      setStep(clamped);
      return;
    }

    setTransitionTo(clamped);
    transitionTimer.current = setTimeout(() => {
      setStep(clamped);
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
  const subtotalBeforeCoupon =
    quoteResult.ok && quoteResult.totalReserva > 0
      ? quoteResult.totalReserva + extrasCop
      : null;
  const grandTotal =
    subtotalBeforeCoupon != null
      ? Math.max(0, subtotalBeforeCoupon - couponDiscount)
      : null;

  const selectedExtras = useMemo(
    () => CONFIGURATOR_EXTRAS.filter((e) => extras.includes(e.id)),
    [extras],
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
      const lineTotal = extraLineTotalCop(e, {
        mealQty:
          e.id === "breakfast" || e.id === "lunch"
            ? mealQuantities[e.id]
            : undefined,
        airport: e.id === "airport-transfer" ? airportTransfer : undefined,
      });
      let detail = e.label;
      if (e.pricing === "perGuestPerDay") {
        const q = mealQuantities[e.id as MealExtraId];
        const g = q?.guests ?? guests;
        const d = q?.days ?? mealDaysDefault;
        detail = `${e.label} (${formatCOP(e.priceCop)} × ${g} pers. × ${d} día${d === 1 ? "" : "s"})`;
      } else if (e.pricing === "perAirportLeg") {
        const legs = airportTransferLegCount(airportTransfer);
        const parts: string[] = [];
        if (airportTransfer.pickup) parts.push("recogida");
        if (airportTransfer.dropoff) parts.push("ida");
        detail = `${e.label} (${formatCOP(e.priceCop)} × ${legs} trayecto${legs === 1 ? "" : "s"}${parts.length ? `: ${parts.join(" + ")}` : ""})`;
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

  function buildWhatsAppLines(reservationCode?: string) {
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
    const nights = quoteResult.ok ? quoteResult.noches : null;
    const channelLabel =
      bookingChannel === "corporate"
        ? "Corporativo / empresa"
        : bookingChannel === "referral"
          ? "Referido"
          : bookingChannel === "whatsapp"
            ? "WhatsApp"
            : "Directo (web)";
    const depositAmount =
      grandTotal !== null && depositPct > 0
        ? Math.round((grandTotal * depositPct) / 100)
        : null;
    return [
      `Hola ${site.name}, quiero reservar:`,
      name.trim() ? `Nombre: ${name.trim()}` : "",
      reservationCode ? `Código reserva: ${reservationCode}` : "",
      profileMeta ? `Tipo de viaje: ${profileMeta.title}` : "",
      categoryMeta
        ? `Preferencia de loft: ${categoryMeta.name} (${categoryMeta.tagline})`
        : "",
      checkIn && checkOut
        ? `Fechas: ${checkIn} → ${checkOut}${nights != null ? ` (${nights} noche${nights === 1 ? "" : "s"})` : ""}`
        : "",
      `Check-in: ${site.checkIn} · Check-out: ${site.checkOut}`,
      `Huéspedes: ${guests} · Lofts: ${lofts}`,
      `Dirección: ${site.addressLine}, ${site.neighborhood}, ${site.city}`,
      `Canal: ${channelLabel}`,
      bookingChannel === "corporate" && corporateName.trim()
        ? `Empresa: ${corporateName.trim()}`
        : "",
      bookingChannel === "referral" && referrerName.trim()
        ? `Referido por: ${referrerName.trim()}`
        : "",
      extraLines.length ? `\nExtras:\n${extraLines.join("\n")}` : "\nExtras: ninguno",
      grandTotal !== null
        ? `\nTotal estimado (web): ${formatCOP(grandTotal)}`
        : "",
      depositAmount != null
        ? `Anticipo sugerido (${depositPct}%): ${formatCOP(depositAmount)}`
        : "",
      couponDiscount > 0 && couponCode
        ? `Cupón ${couponCode.trim().toUpperCase()}: −${formatCOP(couponDiscount)}`
        : "",
      quoteResult.ok
        ? `(Alojamiento+aseo: ${formatCOP(quoteResult.totalReserva)}${extrasCop ? ` + extras ${formatCOP(extrasCop)}` : ""})`
        : "",
      "",
      "Confirmo que la tarifa final y descuentos de grupo o larga estadía se cierran por WhatsApp.",
    ].filter(Boolean);
  }

  /**
   * Fase 4: crea reserva en motor (DB o mock local) y abre WhatsApp
   * como canal de confirmación coexistente.
   */
  async function handleReservar() {
    if (!quoteResult.ok || bookingBusy || !policiesAccepted) return;
    setBookingBusy(true);
    setBookingError(null);

    const extrasPayload = CONFIGURATOR_EXTRAS.filter((e) =>
      extras.includes(e.id),
    ).map((e) => ({
      id: e.id,
      label: e.label,
      amountCop:
        e.interestOnly || e.priceCop <= 0
          ? 0
          : extraLineTotalCop(e, {
              mealQty:
                e.id === "breakfast" || e.id === "lunch"
                  ? mealQuantities[e.id]
                  : undefined,
              airport: e.id === "airport-transfer" ? airportTransfer : undefined,
            }),
    }));

    let reservationCode: string | undefined;
    try {
      // Preflight availability (mismo motor que booking)
      if (checkIn && checkOut) {
        const availQs = new URLSearchParams({
          check_in: checkIn,
          check_out: checkOut,
          guests: String(guests),
        });
        if (categoryId) availQs.set("category", categoryId);
        const availRes = await fetch(
          `/api/public/availability?${availQs.toString()}`,
        );
        if (availRes.ok) {
          const avail = (await availRes.json()) as {
            available_count?: number;
          };
          if ((avail.available_count ?? 0) < Math.max(1, lofts)) {
            setBookingError(
              "No hay disponibilidad para esas fechas / categoría. Ajusta fechas o continúa por WhatsApp.",
            );
            setBookingBusy(false);
            trackWhatsAppClick("guided_reservation_unavailable");
            window.open(
              waLink(buildWhatsAppLines().join("\n")),
              "_blank",
              "noopener",
            );
            return;
          }
        }
      }

      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_in: checkIn,
          check_out: checkOut,
          guests,
          lofts,
          guest_name: name.trim() || "Huésped web",
          category_id: categoryId ?? undefined,
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
            buildWhatsAppLines(reservationCode).join("\n"),
          );
          window.location.href = `/confirmacion/${encodeURIComponent(reservationCode)}?wa=1`;
          return;
          }
      }
    } catch {
      setBookingError(
        "Motor de reservas no disponible — abriendo WhatsApp (fallback).",
      );
    } finally {
      setBookingBusy(false);
    }

    trackWhatsAppClick("guided_reservation_submit");
    trackBeginCheckout({ lofts: Number(lofts), guests: Number(guests) });
    window.open(
      waLink(buildWhatsAppLines(reservationCode).join("\n")),
      "_blank",
      "noopener",
    );
  }

  return (
    <section
      id="reservas"
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
              className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f2f0eb]/70 backdrop-blur-md dark:bg-zinc-950/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              aria-live="polite"
              aria-label={`Pasando a ${STEPS[transitionTo]}`}
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
                  <div className="grid gap-3 sm:grid-cols-3">
                    {LOFT_CATEGORIES.map((cat) => {
                      const fits =
                        availableLoftsForGuests(cat, guests).length > 0;
                      const active = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          disabled={!fits}
                          onClick={() => {
                            setCategoryId(cat.id);
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
                              : "cursor-not-allowed opacity-40",
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
                      Políticas de la casa
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
                      .
                    </p>
                    <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-zinc-800 dark:text-zinc-100">
                      <input
                        type="checkbox"
                        checked={policiesAccepted}
                        onChange={(e) => setPoliciesAccepted(e.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded border-zinc-400"
                      />
                      <span>
                        Acepto las{" "}
                        <Link
                          href="/politicas"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-amber-900 underline underline-offset-2 dark:text-amber-300"
                        >
                          políticas
                        </Link>{" "}
                        (
                        <Link
                          href="/politicas#deposito"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          depósito
                        </Link>
                        ,{" "}
                        <Link
                          href="/politicas#aseo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          aseo
                        </Link>
                        ,{" "}
                        <Link
                          href="/politicas#estadia"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          estadía
                        </Link>
                        , cancelación, anticipos y normas). Al pulsar RESERVAR
                        confirmo haberlas leído.
                      </span>
                    </label>
                  </div>
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
            <div className="flex flex-wrap items-center gap-2">
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
                className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600"
                aria-label="Regresar al paso anterior"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Atrás
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canAdvance() || transitionTo !== null}
                  onClick={() => advanceFromCurrentStep()}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                >
                  Siguiente
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {bookingError ? (
                    <p className="max-w-xs text-right text-xs text-amber-800 dark:text-amber-300">
                      {bookingError}
                    </p>
                  ) : null}
                  {!policiesAccepted ? (
                    <p className="max-w-xs text-right text-[11px] text-amber-800 dark:text-amber-300">
                      Marca «Acepto las políticas» para continuar.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={
                      !quoteResult.ok || bookingBusy || !policiesAccepted
                    }
                    onClick={() => void handleReservar()}
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
                    {bookingBusy ? "Creando reserva…" : "RESERVAR"}
                  </button>
                  <p className="max-w-xs text-right text-[11px] text-zinc-500">
                    Al reservar aceptas las políticas. Se crea la reserva y se
                    abre WhatsApp para confirmar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
