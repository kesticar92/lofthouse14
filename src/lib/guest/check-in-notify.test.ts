import { describe, expect, it, beforeEach } from "vitest";
import {
  saveDigitalCheckIn,
  resetDigitalCheckIns,
  getDigitalCheckIn,
} from "./check-in-store";
import {
  listStaffNotificationStubs,
  resetStaffNotificationStubs,
  notifyStaffCheckIn,
} from "./staff-notify";

beforeEach(() => {
  resetDigitalCheckIns();
  resetStaffNotificationStubs();
});

describe("check-in + staff notify", () => {
  it("persiste local y notifica staff stub", async () => {
    const saved = saveDigitalCheckIn({
      reservation_code: "LH-CI001",
      guest_name: "Ana",
      guests: 2,
      arrival_eta: "15:00",
      terms_accepted: true,
      data_confirmed: true,
      completed_at: new Date().toISOString(),
    });
    expect(saved.ok).toBe(true);
    expect(getDigitalCheckIn("LH-CI001")?.arrival_eta).toBe("15:00");

    const note = await notifyStaffCheckIn({
      reservationCode: "LH-CI001",
      guestName: "Ana",
      arrivalEta: "15:00",
    });
    expect(note.delivered).toBe("stub");
    expect(listStaffNotificationStubs()).toHaveLength(1);
  });
});
