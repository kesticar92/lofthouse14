"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { pricingAdditionalNotes } from "@/lib/pricing-additional";

type PricingDetailsAccordionProps = {
  price: string;
  priceNote?: string;
  capacity: string;
  className?: string;
};

export function PricingDetailsAccordion({
  price,
  priceNote,
  capacity,
  className,
}: PricingDetailsAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-lg font-bold text-zinc-900 dark:text-[#f2f0eb]">
            {price}
          </p>
          {priceNote ? (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {priceNote}
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-300">
          {capacity}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3 text-left text-sm font-semibold text-amber-800 underline-offset-2 hover:underline dark:border-zinc-700 dark:text-amber-400"
        aria-expanded={open}
      >
        Ver detalles de aseo y huéspedes adicionales
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul className="space-y-2 border-t border-zinc-200 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          {pricingAdditionalNotes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="text-amber-600 dark:text-amber-500">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
