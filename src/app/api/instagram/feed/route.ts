import { resolveInstagramFeed } from "@/lib/instagram/resolve-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await resolveInstagramFeed();
  return Response.json(
    {
      posts: feed.posts,
      source: feed.source,
      syncedAt: feed.syncedAt,
      profileUrl: feed.profileUrl,
      graphConfigured: feed.graphConfigured,
      count: feed.posts.length,
    },
    {
      headers: {
        // CDN / browser: refresco frecuente para que el muro se sienta vivo
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
