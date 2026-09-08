import { requireStaff } from "@/lib/api/require-staff";
import { listLocalAudit } from "@/lib/audit/local-audit";
import { listSeedPolicies } from "@/lib/policies/cancellation";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 40);
  return Response.json({
    audit: listLocalAudit(Number.isFinite(limit) ? limit : 40),
    cancellation_policies: listSeedPolicies(),
    note: "Audit local en memoria + policies seed. CSRF: ver docs/SECURITY.md.",
  });
}
