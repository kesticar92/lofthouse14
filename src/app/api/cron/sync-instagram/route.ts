import { syncInstagramFeedFromGraph } from "@/lib/instagram/resolve-feed";

/**
 * Cron: refrescar muro Instagram desde Graph API.
 * GET /api/cron/sync-instagram  Authorization: Bearer $CRON_SECRET
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization")?.trim();
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await syncInstagramFeedFromGraph();
  if (!result.ok) {
    return Response.json({ ok: false, ...result }, { status: 400 });
  }
  return Response.json({ ok: true, ...result });
}
