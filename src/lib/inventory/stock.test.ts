import { describe, expect, it, beforeEach } from "vitest";
import {
  applyStockMovement,
  createDraftPurchaseOrder,
  listLowStockItems,
  listPurchaseOrders,
  listStockItems,
  resetStockStore,
} from "./stock";
import {
  listLocalOpsNotifications,
  resetLocalOpsNotifications,
} from "@/lib/ops/local-notifications";

beforeEach(() => {
  resetStockStore();
  resetLocalOpsNotifications();
});

describe("inventory stock", () => {
  it("siembra ítems y PO mínima", () => {
    const items = listStockItems();
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(listPurchaseOrders().length).toBeGreaterThanOrEqual(1);
  });

  it("mueve stock y notifica low stock", () => {
    const coffee = listStockItems().find((i) => i.sku === "COFFEE-POD")!;
    // Bajar bajo reorder_point (5)
    const r = applyStockMovement({
      itemId: coffee.id,
      delta: -5,
      reason: "consumo housekeeping",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.item.qty_on_hand).toBe(4);
    expect(r.lowStockAlert).toBe(true);
    expect(listLowStockItems().some((i) => i.sku === "COFFEE-POD")).toBe(true);
    const notes = listLocalOpsNotifications({ unreadOnly: true });
    expect(notes.some((n) => n.source === "inventory.low_stock")).toBe(true);
  });

  it("crea PO draft", () => {
    const po = createDraftPurchaseOrder({ supplier: "Test SA" });
    expect(po.status).toBe("draft");
    expect(po.supplier).toBe("Test SA");
    expect(po.lines.length).toBeGreaterThan(0);
  });
});
