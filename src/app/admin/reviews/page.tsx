"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell, AdminCard } from "@/components/admin/admin-shell";
import { AdminAsyncState } from "@/components/admin/admin-async-state";

type Review = {
  id: string;
  name: string;
  text: string;
  starRating: number;
  source: string;
  reviewDate: string | null;
  sentiment: "positive" | "neutral" | "negative";
  categories: string[];
  loftCode?: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    bySentiment: Record<string, number>;
    bySource: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        source,
        sentiment,
        category,
        q,
      });
      const res = await fetch(`/api/admin/reviews?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `Error ${res.status}`);
        return;
      }
      setReviews(data.reviews ?? []);
      setStats(data.stats ?? null);
    } catch {
      setError("No se pudieron cargar reviews.");
    } finally {
      setLoading(false);
    }
  }, [source, sentiment, category, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">REVIEWS</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Listado centralizado · sentiment stub · categorías heurísticas.
          </p>
        </div>
        <Link
          href="/admin/crm"
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold"
        >
          Ir a CRM
        </Link>
      </div>

      {stats ? (
        <AdminCard title="Resumen" subtitle={`${stats.total} reseñas totales`}>
          <p className="text-sm text-zinc-600">
            +{stats.bySentiment.positive ?? 0} · ~{stats.bySentiment.neutral ?? 0}{" "}
            · −{stats.bySentiment.negative ?? 0}
            {Object.entries(stats.bySource)
              .map(([k, v]) => ` · ${k}: ${v}`)
              .join("")}
          </p>
        </AdminCard>
      ) : null}

      <AdminCard title="Filtros">
        <div className="flex flex-wrap gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="all">Fuente</option>
            <option value="google">Google</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking">Booking</option>
          </select>
          <select
            value={sentiment}
            onChange={(e) => setSentiment(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="all">Sentiment</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="all">Categoría</option>
            <option value="cleanliness">Limpieza</option>
            <option value="location">Ubicación</option>
            <option value="value">Valor</option>
            <option value="service">Servicio</option>
            <option value="amenities">Amenities</option>
            <option value="general">General</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="min-w-[160px] flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
      </AdminCard>

      <AdminCard title="Listado" subtitle="Sin envío a OTAs">
        <AdminAsyncState
          loading={loading}
          error={error}
          empty={!loading && !error && reviews.length === 0}
          emptyMessage="Sin reseñas con esos filtros."
          onRetry={() => void load()}
        >
          <ul className="space-y-3">
            {reviews.slice(0, 80).map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {r.name}{" "}
                    <span className="text-xs font-normal text-zinc-500">
                      ★{r.starRating} · {r.source}
                      {r.loftCode ? ` · loft ${r.loftCode}` : ""}
                      {r.reviewDate ? ` · ${r.reviewDate}` : ""}
                    </span>
                  </p>
                  <span
                    className={
                      r.sentiment === "positive"
                        ? "text-xs font-semibold text-emerald-700"
                        : r.sentiment === "negative"
                          ? "text-xs font-semibold text-rose-700"
                          : "text-xs font-semibold text-zinc-500"
                    }
                  >
                    {r.sentiment}
                  </span>
                </div>
                <p className="mt-1 text-zinc-700 dark:text-zinc-200 line-clamp-3">
                  {r.text}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-400">
                  {r.categories.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </AdminAsyncState>
      </AdminCard>
    </AdminShell>
  );
}
