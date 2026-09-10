/**
 * Instagram Graph API — cuenta Business/Creator vinculada a Meta.
 *
 * Vars:
 *   INSTAGRAM_ACCESS_TOKEN
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID  (IG User ID, no el @handle)
 *
 * Docs: GET /{ig-user-id}/media?fields=...
 */

import type { InstagramFeedPost } from "./types";

type GraphMedia = {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

type GraphPage = {
  data?: GraphMedia[];
  paging?: { next?: string };
  error?: { message?: string; code?: number };
};

function credentials(): { token: string; userId: string } | null {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const userId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  if (!token || !userId) return null;
  return { token, userId };
}

export function isInstagramGraphConfigured(): boolean {
  return credentials() !== null;
}

function mapMedia(m: GraphMedia): InstagramFeedPost | null {
  const permalink = m.permalink?.trim();
  if (!permalink) return null;
  const isVideo =
    m.media_type === "VIDEO" || m.media_type === "REELS" || m.media_type === "REEL";
  const thumb =
    (isVideo ? m.thumbnail_url || m.media_url : m.media_url || m.thumbnail_url)?.trim() ??
    "";
  if (!thumb) return null;
  return {
    id: `ig-${m.id}`,
    url: permalink,
    thumbnailUrl: thumb,
    isVideo,
    caption: (m.caption ?? "").trim(),
    publishedAt: m.timestamp,
  };
}

/**
 * Trae TODAS las páginas del media del usuario (hasta `maxPages` por seguridad).
 */
export async function fetchAllInstagramGraphMedia(
  maxPages = 40,
): Promise<{ posts: InstagramFeedPost[]; error?: string }> {
  const creds = credentials();
  if (!creds) {
    return {
      posts: [],
      error:
        "Faltan INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID",
    };
  }

  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
  ].join(",");

  let url: string | null =
    `https://graph.facebook.com/v21.0/${creds.userId}/media` +
    `?fields=${fields}&limit=50&access_token=${encodeURIComponent(creds.token)}`;

  const posts: InstagramFeedPost[] = [];
  let pages = 0;

  while (url && pages < maxPages) {
    pages += 1;
    let res: Response;
    try {
      res = await fetch(url, { next: { revalidate: 0 } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { posts, error: `Red Graph API: ${msg}` };
    }

    let json: GraphPage;
    try {
      json = (await res.json()) as GraphPage;
    } catch {
      return { posts, error: `Respuesta no JSON (HTTP ${res.status})` };
    }

    if (json.error?.message) {
      return {
        posts,
        error: `Graph API: ${json.error.message}${json.error.code ? ` (${json.error.code})` : ""}`,
      };
    }

    if (!res.ok) {
      return { posts, error: `HTTP ${res.status} al consultar Instagram` };
    }

    for (const item of json.data ?? []) {
      const mapped = mapMedia(item);
      if (mapped) posts.push(mapped);
    }

    url = json.paging?.next ?? null;
  }

  return { posts };
}
