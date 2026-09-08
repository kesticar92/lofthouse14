import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  DEFAULT_TEMPLATES,
  renderTemplate,
} from "@/lib/crm/templates";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  const { supabase, organizationId } = gate.ctx;
  if (organizationId) {
    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .eq("organization_id", organizationId);
    if (!error && data && data.length > 0) {
      return Response.json({ mode: "supabase", templates: data });
    }
  }

  return Response.json({
    mode: "seed",
    templates: DEFAULT_TEMPLATES,
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "crm");
  if (mod) return mod;

  let body: { code?: string; variables?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const tpl =
    DEFAULT_TEMPLATES.find((t) => t.code === body.code) ?? DEFAULT_TEMPLATES[0]!;
  const rendered = renderTemplate(tpl.body, body.variables ?? {});

  return Response.json({
    ok: true,
    template: tpl.code,
    rendered,
    note: "Preview only — envío real requiere WhatsApp/Email API",
  });
}
