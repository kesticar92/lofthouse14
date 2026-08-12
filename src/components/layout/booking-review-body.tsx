import { Frown, Smile } from "lucide-react";
import { cn } from "@/lib/cn";

function isEmptyBookingPart(value: string | null | undefined): boolean {
  if (!value) return true;
  const t = value.trim();
  if (!t) return true;
  return /^(n\/a|na|n\.a\.|—|-)$/i.test(t);
}

export function BookingReviewBody({
  positive,
  negative,
  fallbackText,
  className,
}: {
  positive?: string | null;
  negative?: string | null;
  fallbackText?: string;
  className?: string;
}) {
  const pos = isEmptyBookingPart(positive) ? null : positive!.trim();
  const neg = isEmptyBookingPart(negative) ? null : negative!.trim();
  const hasStructured = pos || neg;

  if (!hasStructured) {
    const text = fallbackText?.trim() || "(Sin comentario escrito)";
    return (
      <p
        className={cn(
          "mb-5 break-words text-sm leading-relaxed text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-200",
          className,
        )}
      >
        &ldquo;{text}&rdquo;
      </p>
    );
  }

  return (
    <div className={cn("mb-5 space-y-3", className)}>
      {pos ? (
        <div className="flex gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <Smile
            className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
              Lo que más gustó
            </p>
            <p className="mt-1 break-words text-sm leading-relaxed text-zinc-800 [overflow-wrap:anywhere] dark:text-zinc-100">
              {pos}
            </p>
          </div>
        </div>
      ) : null}
      {neg ? (
        <div className="flex gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-900/35 dark:bg-amber-950/20">
          <Frown
            className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:text-amber-300">
              Lo que se puede mejorar
            </p>
            <p className="mt-1 break-words text-sm leading-relaxed text-zinc-800 [overflow-wrap:anywhere] dark:text-zinc-100">
              {neg}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
