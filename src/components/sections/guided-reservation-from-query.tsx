"use client";

import { useSearchParams } from "next/navigation";
import { GuidedReservation } from "@/components/sections/guided-reservation";

export function GuidedReservationFromQuery() {
  const params = useSearchParams();
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const guestsRaw = Number(params.get("guests") ?? "");
  const guests = Number.isFinite(guestsRaw) && guestsRaw > 0 ? guestsRaw : undefined;
  return (
    <GuidedReservation
      initialCheckIn={checkIn}
      initialCheckOut={checkOut}
      initialGuests={guests}
    />
  );
}
