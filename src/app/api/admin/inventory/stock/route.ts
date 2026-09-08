import { requireStaff, enforceStaffModule } from "@/lib/api/require-staff";
import {
  applyStockMovement,
  createDraftPurchaseOrder,
  listLowStockItems,
  listPurchaseOrders,
  listStockItems,
  listStockMovements,
} from "@/lib/inventory/stock";
import { listLocalOpsNotifications } from "@/lib/ops/local-notifications";

export async function GET(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "inventario");
  if (mod) return mod;

  const url = new URL(req.url);
  const itemId = url.searchParams.get("item_id") ?? undefined;

  return Response.json({
    items: listStockItems(),
    low_stock: listLowStockItems(),
    movements: listStockMovements(itemId ?? undefined).slice(0, 50),
    purchase_orders: listPurchaseOrders(),
    notifications: listLocalOpsNotifications({ unreadOnly: true }).filter(
      (n) => n.source.startsWith("inventory"),
    ),
    mode: "local",
  });
}

export async function POST(req: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  const mod = enforceStaffModule(gate.ctx, "inventario");
  if (mod) return mod;

  let body: {
    action?: string;
    item_id?: string;
    delta?: number;
    reason?: string;
    supplier?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.action === "move") {
    if (!body.item_id) {
      return Response.json({ error: "item_id requerido" }, { status: 400 });
    }
    const r = applyStockMovement({
      itemId: body.item_id,
      delta: Number(body.delta),
      reason: body.reason ?? "ajuste admin",
      createdBy: gate.ctx.user.email ?? "staff",
    });
    if (!r.ok) {
      return Response.json({ error: r.error }, { status: 400 });
    }
    return Response.json({
      ok: true,
      item: r.item,
      movement: r.movement,
      low_stock_alert: r.lowStockAlert,
    });
  }

  if (body.action === "create_po") {
    const po = createDraftPurchaseOrder({
      supplier: body.supplier,
      notes: body.notes,
    });
    return Response.json({ ok: true, purchase_order: po });
  }

  return Response.json(
    { error: "action inválida (move | create_po)" },
    { status: 400 },
  );
}
