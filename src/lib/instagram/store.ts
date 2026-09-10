/**
 * Persistencia del muro Instagram: `.data/instagram-feed.json`
 * - posts: catálogo editable (admin) o cache del sync Graph API
 * - source / syncedAt: metadatos del último origen
 */

import { INSTAGRAM_POSTS_SEED } from "@/data/instagram-posts";
import { loadJsonFile, saveJsonFile } from "@/lib/persist/json-file-store";
import type { InstagramFeedPost, InstagramFeedSource } from "./types";

export type InstagramFeedSnapshot = {
  updated_at: string;
  synced_at: string | null;
  source: InstagramFeedSource;
  posts: InstagramFeedPost[];
};

const STORE_NAME = "instagram-feed";

function normalizePost(raw: unknown): InstagramFeedPost | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const id = String(p.id ?? "").trim();
  const url = String(p.url ?? "").trim();
  const thumbnailUrl = String(p.thumbnailUrl ?? "").trim();
  if (!id || !url || !thumbnailUrl) return null;
  return {
    id,
    url,
    thumbnailUrl,
    isVideo: Boolean(p.isVideo),
    caption: String(p.caption ?? "").trim(),
    publishedAt:
      typeof p.publishedAt === "string" && p.publishedAt
        ? p.publishedAt
        : undefined,
  };
}

export function seedSnapshot(): InstagramFeedSnapshot {
  return {
    updated_at: new Date().toISOString(),
    synced_at: null,
    source: "seed",
    posts: INSTAGRAM_POSTS_SEED.map((p) => ({ ...p })),
  };
}

export function loadInstagramFeedStore(): InstagramFeedSnapshot {
  const snap = loadJsonFile<InstagramFeedSnapshot>(STORE_NAME);
  if (!snap || typeof snap !== "object") return seedSnapshot();
  const posts = Array.isArray(snap.posts)
    ? snap.posts.map(normalizePost).filter((p): p is InstagramFeedPost => !!p)
    : [];
  if (posts.length === 0) return seedSnapshot();
  return {
    updated_at: snap.updated_at || new Date().toISOString(),
    synced_at: snap.synced_at ?? null,
    source: snap.source === "graph" || snap.source === "store" ? snap.source : "seed",
    posts,
  };
}

export function saveInstagramFeedStore(
  posts: InstagramFeedPost[],
  source: InstagramFeedSource,
  syncedAt: string | null = null,
): InstagramFeedSnapshot {
  const snap: InstagramFeedSnapshot = {
    updated_at: new Date().toISOString(),
    synced_at: syncedAt,
    source,
    posts,
  };
  saveJsonFile(STORE_NAME, snap);
  return snap;
}

export function sortPostsNewestFirst(
  posts: InstagramFeedPost[],
): InstagramFeedPost[] {
  return [...posts].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}
