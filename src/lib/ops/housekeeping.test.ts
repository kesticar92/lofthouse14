import { describe, expect, it, beforeEach } from "vitest";
import {
  createDirtyTaskOnCheckout,
  listHousekeepingTasks,
  resetHousekeepingTasks,
} from "./housekeeping";

beforeEach(() => {
  resetHousekeepingTasks();
});

describe("housekeeping auto dirty", () => {
  it("crea tarea dirty al checkout y es idempotente", () => {
    const a = createDirtyTaskOnCheckout({
      reservationCode: "LH-HK001",
      propertyId: "p1",
    });
    expect(a.status).toBe("dirty");
    expect(a.source).toBe("checkout_auto");
    const b = createDirtyTaskOnCheckout({
      reservationCode: "lh-hk001",
      propertyId: "p1",
    });
    expect(b.id).toBe(a.id);
    expect(listHousekeepingTasks({ status: "dirty" })).toHaveLength(1);
  });
});
