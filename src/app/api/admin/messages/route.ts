import { requireStaff } from "@/lib/api/require-staff";
import {
  appendStaffReply,
  listThreads,
} from "@/lib/guest/messages-store";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  return Response.json({ threads: listThreads() });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  let body: { reservation_code?: string; body?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const code = body.reservation_code?.trim().toUpperCase();
  const text = body.body?.trim() ?? "";
  if (!code || !text) {
    return Response.json(
      { error: "reservation_code y body requeridos" },
      { status: 400 },
    );
  }
  const thread = appendStaffReply(code, text);
  if (!thread) {
    return Response.json({ error: "Thread no encontrado" }, { status: 404 });
  }
  return Response.json({ ok: true, thread });
}
