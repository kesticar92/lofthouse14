import { requireStaff } from "@/lib/api/require-staff";
import { buildStubOpsAlerts } from "@/lib/ops/alerts";

export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  try {
    const alerts = buildStubOpsAlerts();
    return Response.json({ alerts });
  } catch {
    return Response.json({
      alerts: [
        {
          id: "all-clear",
          level: "info",
          title: "Sin alertas operativas",
          message: "No se pudieron cargar alertas locales.",
          href: "/admin/mantenimiento",
        },
      ],
    });
  }
}
