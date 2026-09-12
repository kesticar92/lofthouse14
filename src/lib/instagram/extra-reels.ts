/**
 * Reels adicionales sin Graph API:
 * - INSTAGRAM_EXTRA_REEL_URLS=url1,url2 (permalinks de /reel/…)
 * - Se hidratan con oEmbed público (thumbnail + caption) cuando es posible.
 */

import type { InstagramFeedPost } from "./types";

function shortcodeFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes("instagram.com")) return null;
    const m = u.pathname.match(/\/(reel|reels|tv|p)\/([A-Za-z0-9_-]+)/i);
    return m?.[2] ?? null;
  } catch {
    return null;
  }
}

function parseExtraUrls(): string[] {
  const raw = process.env.INSTAGRAM_EXTRA_REEL_URLS?.trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function oEmbedPost(permalink: string): Promise<InstagramFeedPost | null> {
  const code = shortcodeFromUrl(permalink);
  if (!code) return null;
  const canonical = `https://www.instagram.com/reel/${code}/`;
  try {
    const endpoint = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(canonical)}`;
    const res = await fetch(endpoint, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LOFTHOUSE14/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return {
        id: `extra-reel-${code}`,
        url: canonical,
        thumbnailUrl: "/gallery/lofthouse-14-redes-cali-01.webp",
        isVideo: true,
        caption: `Reel @lofthouse.14 · ${code}`,
        publishedAt: new Date().toISOString(),
      };
    }
    const json = (await res.json()) as {
      thumbnail_url?: string;
      title?: string;
      author_name?: string;
    };
    return {
      id: `extra-reel-${code}`,
      url: canonical,
      thumbnailUrl:
        json.thumbnail_url?.trim() ||
        "/gallery/lofthouse-14-redes-cali-01.webp",
      isVideo: true,
      caption: (
        json.title || `Reel · @${json.author_name || "lofthouse.14"}`
      ).trim(),
      publishedAt: new Date().toISOString(),
    };
  } catch {
    return {
      id: `extra-reel-${code}`,
      url: canonical,
      thumbnailUrl: "/gallery/lofthouse-14-redes-cali-01.webp",
      isVideo: true,
      caption: `Reel @lofthouse.14 · ${code}`,
      publishedAt: new Date().toISOString(),
    };
  }
}

/** Posts de INSTAGRAM_EXTRA_REEL_URLS, hidratados. */
export async function loadExtraReelPosts(): Promise<InstagramFeedPost[]> {
  const urls = parseExtraUrls();
  if (urls.length === 0) return [];
  const posts = await Promise.all(urls.map((u) => oEmbedPost(u)));
  return posts.filter((p): p is InstagramFeedPost => Boolean(p));
}

/** Une feeds por URL de reel/post (prioriza `primary`). */
export function mergeFeedPosts(
  primary: InstagramFeedPost[],
  secondary: InstagramFeedPost[],
): InstagramFeedPost[] {
  const seen = new Set(
    primary.map((p) => {
      try {
        return new URL(p.url).pathname.replace(/\/+$/, "");
      } catch {
        return p.id;
      }
    }),
  );
  const merged = [...primary];
  for (const p of secondary) {
    let key = p.id;
    try {
      key = new URL(p.url).pathname.replace(/\/+$/, "");
    } catch {
      /* keep id */
    }
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(p);
  }
  return merged;
}
