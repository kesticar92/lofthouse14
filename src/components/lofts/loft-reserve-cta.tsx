"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { waLink } from "@/lib/site";
import {
  mergeStayDraft,
  readStayDraft,
  STAY_DRAFT_EVENT,
  type StayDraft,
} from "@/lib/stay-draft";
import type { LoftCategoryId } from "@/data/loft-categories";

/** CTA Reservar que arrastra fechas del banner (stay draft) al configurador. */
export function LoftReserveCta({
  loftName,
  categoryId,
  slug,
}: {
  loftName: string;
  categoryId?: LoftCategoryId;
  slug: string;
}) {
  const [draft, setDraft] = useState<StayDraft | null>(null);

  useEffect(() => {
    setDraft(readStayDraft());
    const onDraft = (e: Event) => {
      const detail = (e as CustomEvent<StayDraft>).detail;
      setDraft(detail ?? readStayDraft());
    };
    window.addEventListener(STAY_DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(STAY_DRAFT_EVENT, onDraft);
  }, []);

  function goReservar() {
    const prev = readStayDraft() ?? {};
    const hasDates = Boolean(
      prev.checkIn && prev.checkOut && prev.checkOut > prev.checkIn,
    );
    const hasGuests = Boolean(prev.guests && prev.guests > 0);
    const stayReady = hasDates && hasGuests;
    mergeStayDraft({
      ...prev,
      categoryId: categoryId ?? prev.categoryId,
      from: "card",
      // Card: fechas si faltan; con estadía lista → Extras (paso 4).
      step: stayReady ? 4 : hasDates ? 2 : 1,
    });
    const d = readStayDraft();
    const qs = new URLSearchParams();
    if (d?.checkIn) qs.set("check_in", d.checkIn);
    if (d?.checkOut) qs.set("check_out", d.checkOut);
    if (d?.guests) qs.set("guests", String(d.guests));
    if (categoryId) qs.set("category", categoryId);
    qs.set("from", "card");
    qs.set("loft", slug);
    const q = qs.toString();
    window.location.assign(q ? `/reservar?${q}` : "/reservar");
  }

  const hasDates = Boolean(draft?.checkIn && draft?.checkOut);

  return (
    <div className="mt-10 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={goReservar}
        className="inline-flex rounded-full bg-zinc-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white dark:bg-amber-600"
      >
        Reservar este loft
      </button>
      <a
        href={waLink(
          hasDates
            ? `Hola, quiero reservar el ${loftName} en Lofthouse 14. Fechas ${draft?.checkIn} → ${draft?.checkOut}.`
            : `Hola, quiero reservar el ${loftName} en Lofthouse 14. Fechas ____.`,
        )}
        className="inline-flex rounded-full border border-emerald-700/40 bg-emerald-600 px-6 py-4 text-sm font-bold uppercase tracking-wide text-white"
      >
        WhatsApp
      </a>
      <Link
        href="/#reservas"
        className="inline-flex rounded-full border border-zinc-400 px-6 py-4 text-sm font-bold uppercase tracking-wide text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
      >
        Personaliza tu experiencia
      </Link>
      {hasDates ? (
        <p className="w-full text-xs text-zinc-500">
          Fechas del banner: {draft?.checkIn} → {draft?.checkOut}
          {draft?.guests ? ` · ${draft.guests} huéspedes` : ""}
        </p>
      ) : null}
    </div>
  );
}
