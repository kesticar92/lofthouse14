/**
 * Marketing de categorías Vista/Atrio/Cielo (fotos + amenities).
 * Persistencia durable: `.data/lofts-marketing.json` (sin Supabase).
 *
 * Ver `docs/LOFTS-MARKETING.md`.
 */

import {
  LOFT_CATEGORIES,
  applyLoftMarketingOverrides,
  type LoftCategory,
  type LoftCategoryId,
} from "@/data/loft-categories";
import { loadJsonFile, saveJsonFile } from "@/lib/persist/json-file-store";

export type LoftMarketingOverride = {
  images?: string[];
  amenities?: string[];
};

export type LoftsMarketingSnapshot = {
  updated_at: string;
  categories: Partial<Record<LoftCategoryId, LoftMarketingOverride>>;
};

const STORE_NAME = "lofts-marketing";

const EMPTY: LoftsMarketingSnapshot = {
  updated_at: new Date(0).toISOString(),
  categories: {},
};

export function loadLoftsMarketing(): LoftsMarketingSnapshot {
  const snap = loadJsonFile<LoftsMarketingSnapshot>(STORE_NAME);
  if (!snap || typeof snap !== "object") return { ...EMPTY, categories: {} };
  return {
    updated_at: snap.updated_at || EMPTY.updated_at,
    categories: snap.categories ?? {},
  };
}

export function saveLoftsMarketing(
  categories: Partial<Record<LoftCategoryId, LoftMarketingOverride>>,
): LoftsMarketingSnapshot {
  const snap: LoftsMarketingSnapshot = {
    updated_at: new Date().toISOString(),
    categories,
  };
  saveJsonFile(STORE_NAME, snap);
  return snap;
}

export function updateLoftMarketingCategory(
  id: LoftCategoryId,
  patch: LoftMarketingOverride,
): LoftsMarketingSnapshot {
  const current = loadLoftsMarketing();
  const prev = current.categories[id] ?? {};
  const next: LoftMarketingOverride = {
    images: patch.images ?? prev.images,
    amenities: patch.amenities ?? prev.amenities,
  };
  return saveLoftsMarketing({
    ...current.categories,
    [id]: next,
  });
}

/** Seed + overrides para UI pública y admin. */
export function resolveLoftCategories(): LoftCategory[] {
  const snap = loadLoftsMarketing();
  return applyLoftMarketingOverrides(LOFT_CATEGORIES, snap.categories);
}

export function marketingDefaultsForAdmin(): Record<
  LoftCategoryId,
  { images: string[]; amenities: string[] }
> {
  const out = {} as Record<
    LoftCategoryId,
    { images: string[]; amenities: string[] }
  >;
  for (const cat of LOFT_CATEGORIES) {
    out[cat.id] = {
      images: [...cat.images],
      amenities: [...cat.amenities],
    };
  }
  return out;
}
