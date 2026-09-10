import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  invalidateInstagramFeedMemoryCache,
  resolveInstagramFeed,
  syncInstagramFeedFromGraph,
} from "@/lib/instagram/resolve-feed";
import {
  loadInstagramFeedStore,
  saveInstagramFeedStore,
  sortPostsNewestFirst,
} from "@/lib/instagram/store";
import type { InstagramFeedPost } from "@/lib/instagram/types";

function parsePosts(raw: unknown): InstagramFeedPost[] | null {
  if (!Array.isArray(raw)) return null;
  const out: InstagramFeedPost[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const p = item as Record<string, unknown>;
    const id = String(p.id ?? "").trim();
    const url = String(p.url ?? "").trim();
    const thumbnailUrl = String(p.thumbnailUrl ?? "").trim();
    if (!id || !url || !thumbnailUrl) continue;
    out.push({
      id,
      url,
      thumbnailUrl,
      isVideo: Boolean(p.isVideo),
      caption: String(p.caption ?? "").trim(),
      publishedAt:
        typeof p.publishedAt === "string" && p.publishedAt
          ? p.publishedAt
          : undefined,
    });
  }
  return out;
}

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "catalogo");
  if (mod) return mod;

  const feed = await resolveInstagramFeed();
  const snap = loadInstagramFeedStore();
  return Response.json({
    mode: "local",
    store: ".data/instagram-feed.json",
    posts: feed.posts,
    source: feed.source,
    syncedAt: feed.syncedAt,
    updated_at: snap.updated_at,
    graphConfigured: feed.graphConfigured,
    profileUrl: feed.profileUrl,
    count: feed.posts.length,
    note:
      "Con INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID el muro sincroniza todas las publicaciones vía Graph API. Sin token, edita el listado aquí.",
  });
}

export async function PUT(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "catalogo");
  if (mod) return mod;

  let body: { posts?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const posts = parsePosts(body.posts);
  if (!posts || posts.length === 0) {
    return Response.json(
      { error: "Envía al menos una publicación válida (id, url, thumbnailUrl)" },
      { status: 400 },
    );
  }

  const sorted = sortPostsNewestFirst(posts);
  const snap = saveInstagramFeedStore(sorted, "store", null);
  invalidateInstagramFeedMemoryCache();

  return Response.json({
    ok: true,
    updated_at: snap.updated_at,
    count: snap.posts.length,
    posts: snap.posts,
    source: snap.source,
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "catalogo");
  if (mod) return mod;

  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* sync sin body también ok */
  }

  if (body.action && body.action !== "sync") {
    return Response.json({ error: "Acción no soportada" }, { status: 400 });
  }

  const result = await syncInstagramFeedFromGraph();
  if (!result.ok) {
    return Response.json(result, { status: 400 });
  }
  return Response.json(result);
}
