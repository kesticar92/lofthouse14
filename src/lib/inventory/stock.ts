/**
 * Inventario operativo + compras mínimas (stock / movimientos / PO seed).
 * Separado del checklist de revisión por loft (`inventarios-store`).
 */

import { pushLocalOpsNotification } from "@/lib/ops/local-notifications";

export type StockItem = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number;
  location: string;
};

export type StockMovement = {
  id: string;
  item_id: string;
  delta: number;
  reason: string;
  created_at: string;
  created_by: string;
};

export type PurchaseOrderLine = {
  item_id: string;
  sku: string;
  name: string;
  qty: number;
  unit_cost_cop: number;
};

export type PurchaseOrder = {
  id: string;
  code: string;
  status: "draft" | "ordered" | "received" | "cancelled";
  supplier: string;
  lines: PurchaseOrderLine[];
  notes: string;
  created_at: string;
  updated_at: string;
};

const g = globalThis as unknown as {
  __lhStockItems?: Map<string, StockItem>;
  __lhStockMovements?: StockMovement[];
  __lhPurchaseOrders?: Map<string, PurchaseOrder>;
  __lhStockSeeded?: boolean;
};

function itemsMap() {
  if (!g.__lhStockItems) g.__lhStockItems = new Map();
  return g.__lhStockItems;
}
function movements() {
  if (!g.__lhStockMovements) g.__lhStockMovements = [];
  return g.__lhStockMovements;
}
function poMap() {
  if (!g.__lhPurchaseOrders) g.__lhPurchaseOrders = new Map();
  return g.__lhPurchaseOrders;
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEED_ITEMS: Omit<StockItem, "id">[] = [
  {
    sku: "TOWEL-BATH",
    name: "Toallas de baño",
    unit: "u",
    qty_on_hand: 48,
    reorder_point: 20,
    location: "Bodega loft 4",
  },
  {
    sku: "SHEET-QUEEN",
    name: "Sábanas queen",
    unit: "juego",
    qty_on_hand: 18,
    reorder_point: 10,
    location: "Bodega loft 4",
  },
  {
    sku: "CLEAN-KIT",
    name: "Kit químicos limpieza",
    unit: "kit",
    qty_on_hand: 12,
    reorder_point: 8,
    location: "Bodega loft 4",
  },
  {
    sku: "TP-ROLL",
    name: "Papel higiénico",
    unit: "rollo",
    qty_on_hand: 120,
    reorder_point: 40,
    location: "Bodega loft 4",
  },
  {
    sku: "COFFEE-POD",
    name: "Cápsulas café",
    unit: "caja",
    qty_on_hand: 9,
    reorder_point: 5,
    location: "Bodega loft 4",
  },
];

export function ensureStockSeeded(): void {
  if (g.__lhStockSeeded && itemsMap().size > 0) return;
  for (const row of SEED_ITEMS) {
    const id = newId("sku");
    itemsMap().set(id, { id, ...row });
  }
  // PO mínima seed (demo) aunque no haya low stock
  const sample = [...itemsMap().values()].slice(0, 2);
  if (sample.length > 0) {
    const now = new Date().toISOString();
    const po: PurchaseOrder = {
      id: newId("po"),
      code: `PO-${now.slice(0, 10).replace(/-/g, "")}-001`,
      status: "draft",
      supplier: "Proveedor local (seed)",
      lines: sample.map((i) => ({
        item_id: i.id,
        sku: i.sku,
        name: i.name,
        qty: Math.max(4, i.reorder_point),
        unit_cost_cop: 15_000,
      })),
      notes: "PO mínima seed — revisar antes de ordenar.",
      created_at: now,
      updated_at: now,
    };
    poMap().set(po.id, po);
  }
  g.__lhStockSeeded = true;
}

export function listStockItems(): StockItem[] {
  ensureStockSeeded();
  return [...itemsMap().values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function listLowStockItems(): StockItem[] {
  return listStockItems().filter((i) => i.qty_on_hand <= i.reorder_point);
}

export function listStockMovements(itemId?: string): StockMovement[] {
  ensureStockSeeded();
  const all = [...movements()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  return itemId ? all.filter((m) => m.item_id === itemId) : all;
}

export function listPurchaseOrders(): PurchaseOrder[] {
  ensureStockSeeded();
  return [...poMap().values()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
}

export function applyStockMovement(input: {
  itemId: string;
  delta: number;
  reason: string;
  createdBy?: string;
  notifyLowStock?: boolean;
}):
  | { ok: true; item: StockItem; movement: StockMovement; lowStockAlert?: boolean }
  | { ok: false; error: string } {
  ensureStockSeeded();
  const item = itemsMap().get(input.itemId);
  if (!item) return { ok: false, error: "Ítem no encontrado" };
  const delta = Math.trunc(Number(input.delta) || 0);
  if (delta === 0) return { ok: false, error: "delta debe ser ≠ 0" };
  const next = item.qty_on_hand + delta;
  if (next < 0) return { ok: false, error: "Stock insuficiente" };

  item.qty_on_hand = next;
  itemsMap().set(item.id, item);
  const movement: StockMovement = {
    id: newId("mov"),
    item_id: item.id,
    delta,
    reason: input.reason?.trim() || "ajuste",
    created_at: new Date().toISOString(),
    created_by: input.createdBy?.trim() || "admin",
  };
  movements().unshift(movement);

  let lowStockAlert = false;
  if (
    (input.notifyLowStock !== false) &&
    item.qty_on_hand <= item.reorder_point
  ) {
    lowStockAlert = true;
    pushLocalOpsNotification({
      title: `Low stock: ${item.name}`,
      message: `${item.sku} quedó en ${item.qty_on_hand} ${item.unit} (punto de reorden ${item.reorder_point}).`,
      level: item.qty_on_hand === 0 ? "critical" : "warn",
      href: "/admin/inventario?tab=stock",
      source: "inventory.low_stock",
    });
  }

  return { ok: true, item, movement, lowStockAlert };
}

export function createDraftPurchaseOrder(input?: {
  supplier?: string;
  notes?: string;
  itemIds?: string[];
}): PurchaseOrder {
  ensureStockSeeded();
  const targets = input?.itemIds?.length
    ? listStockItems().filter((i) => input.itemIds!.includes(i.id))
    : listLowStockItems();
  const linesSource =
    targets.length > 0 ? targets : listStockItems().slice(0, 2);
  const now = new Date().toISOString();
  const po: PurchaseOrder = {
    id: newId("po"),
    code: `PO-${now.slice(0, 10).replace(/-/g, "")}-${String(poMap().size + 1).padStart(3, "0")}`,
    status: "draft",
    supplier: input?.supplier?.trim() || "Proveedor local",
    lines: linesSource.map((i) => ({
      item_id: i.id,
      sku: i.sku,
      name: i.name,
      qty: Math.max(i.reorder_point * 2 - i.qty_on_hand, 1),
      unit_cost_cop: 15_000,
    })),
    notes: input?.notes?.trim() || "Borrador PO",
    created_at: now,
    updated_at: now,
  };
  poMap().set(po.id, po);
  return po;
}

export function resetStockStore() {
  g.__lhStockItems = new Map();
  g.__lhStockMovements = [];
  g.__lhPurchaseOrders = new Map();
  g.__lhStockSeeded = false;
}
