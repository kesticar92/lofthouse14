/**
 * Resuelve el muro público: Graph (si hay token) → store local → seed.
 */

import {
  INSTAGRAM_POSTS_SEED,
  INSTAGRAM_PROFILE_URL,
} from "@/data/instagram-posts";
import {
  fetchAllInstagramGraphMedia,
  isInstagramGraphConfigured,
} from "./graph";
import { loadExtraReelPosts, mergeFeedPosts } from "./extra-reels";
import {
  loadInstagramFeedStore,
  saveInstagramFeedStore,
  sortPostsNewestFirst,
} from "./store";
import type { InstagramFeedPost, InstagramFeedResult } from "./types";

function seedVideoPosts(): InstagramFeedPost[] {
  return INSTAGRAM_POSTS_SEED.filter((p) => p.isVideo).map((p) => ({ ...p }));
}

let memoryCache: { at: number; result: InstagramFeedResult } | null = null;
const MEMORY_TTL_MS = 5 * 60 * 1000;

export async function resolveInstagramFeed(opts?: {
  forceRefresh?: boolean;
}): Promise<InstagramFeedResult> {
  const force = opts?.forceRefresh === true;
  const now = Date.now();
  if (!force && memoryCache && now - memoryCache.at < MEMORY_TTL_MS) {
    return memoryCache.result;
  }

  const graphConfigured = isInstagramGraphConfigured();
  const extraReels = await loadExtraReelPosts();

  if (graphConfigured) {
    const { posts, error } = await fetchAllInstagramGraphMedia();
    if (!error && posts.length > 0) {
      const merged = sortPostsNewestFirst(
        mergeFeedPosts(mergeFeedPosts(posts, extraReels), seedVideoPosts()),
      );
      const syncedAt = new Date().toISOString();
      saveInstagramFeedStore(merged, "graph", syncedAt);
      const result: InstagramFeedResult = {
        posts: merged,
        source: "graph",
        syncedAt,
        profileUrl: INSTAGRAM_PROFILE_URL,
        graphConfigured: true,
      };
      memoryCache = { at: now, result };
      return result;
    }
    // Si Graph falla, caemos al store/seed (y dejamos rastro en logs).
    if (error) {
      console.warn("[instagram] Graph sync falló:", error);
    }
  }

  const snap = loadInstagramFeedStore();
  const merged = sortPostsNewestFirst(
    mergeFeedPosts(
      mergeFeedPosts(snap.posts, extraReels),
      seedVideoPosts(),
    ),
  );
  const result: InstagramFeedResult = {
    posts: merged,
    source: snap.source,
    syncedAt: snap.synced_at,
    profileUrl: INSTAGRAM_PROFILE_URL,
    graphConfigured,
  };
  memoryCache = { at: now, result };
  return result;
}

/** Fuerza sync Graph y persiste; para admin / cron. */
export async function syncInstagramFeedFromGraph(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
  syncedAt?: string;
}> {
  if (!isInstagramGraphConfigured()) {
    return {
      ok: false,
      count: 0,
      error:
        "Configura INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID",
    };
  }
  const { posts, error } = await fetchAllInstagramGraphMedia();
  if (error) return { ok: false, count: posts.length, error };
  if (posts.length === 0) {
    return { ok: false, count: 0, error: "Instagram no devolvió publicaciones" };
  }
  const sorted = sortPostsNewestFirst(posts);
  const syncedAt = new Date().toISOString();
  saveInstagramFeedStore(sorted, "graph", syncedAt);
  memoryCache = null;
  return { ok: true, count: sorted.length, syncedAt };
}

export function invalidateInstagramFeedMemoryCache() {
  memoryCache = null;
}
