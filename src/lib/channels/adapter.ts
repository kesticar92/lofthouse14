/**
 * Channel Manager — interfaces + stubs (Fase 7).
 * TODO: REAL INTEGRATION REQUIRED para cada OTA.
 */

export type ChannelId = "airbnb" | "booking" | "expedia" | "direct" | "ical";

export type ChannelSyncResult = {
  ok: boolean;
  channel: ChannelId;
  status: "simulated" | "accepted" | "rejected" | "error";
  message: string;
  /** Placeholder idempotency */
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
};

export type ChannelAdapter = {
  id: ChannelId;
  displayName: string;
  /** true = integración real pendiente */
  isStub: boolean;
  pushAvailability(input: {
    propertyExternalId?: string;
    checkIn: string;
    checkOut: string;
    available: number;
  }): Promise<ChannelSyncResult>;
  /** Alias ARI — mismos stubs; no inventa payloads oficiales OTA. */
  syncAvailability?(input: {
    propertyExternalId?: string;
    checkIn: string;
    checkOut: string;
    available: number;
  }): Promise<ChannelSyncResult>;
  syncRates?(input: {
    checkIn: string;
    checkOut: string;
    amountCop?: number;
    currency?: string;
  }): Promise<ChannelSyncResult>;
  pullReservations(input?: {
    since?: string;
  }): Promise<ChannelSyncResult>;
  handleWebhook(input: {
    headers: Record<string, string>;
    body: unknown;
    idempotencyKey?: string;
  }): Promise<ChannelSyncResult>;
};

function stubResult(
  channel: ChannelId,
  message: string,
  idempotencyKey?: string,
): ChannelSyncResult {
  return {
    ok: true,
    channel,
    status: "simulated",
    message: `TODO: REAL INTEGRATION REQUIRED — ${message}`,
    idempotencyKey,
    payload: { stub: true },
  };
}

export const airbnbAdapter: ChannelAdapter = {
  id: "airbnb",
  displayName: "Airbnb",
  isStub: true,
  async pushAvailability(input) {
    return stubResult(
      "airbnb",
      `syncAvailability stub ${input.checkIn}→${input.checkOut} (no API oficial)`,
    );
  },
  async syncAvailability(input) {
    return this.pushAvailability(input);
  },
  async syncRates(input) {
    return stubResult(
      "airbnb",
      `syncRates stub ${input.checkIn}→${input.checkOut} amount=${input.amountCop ?? "?"} (no API oficial)`,
    );
  },
  async pullReservations() {
    return stubResult("airbnb", "pullReservations stub — no API oficial");
  },
  async handleWebhook({ idempotencyKey }) {
    return stubResult("airbnb", "webhook stub", idempotencyKey);
  },
};

export const bookingAdapter: ChannelAdapter = {
  id: "booking",
  displayName: "Booking.com",
  isStub: true,
  async pushAvailability(input) {
    return stubResult(
      "booking",
      `syncAvailability stub ${input.checkIn}→${input.checkOut} (no API oficial)`,
    );
  },
  async syncAvailability(input) {
    return this.pushAvailability(input);
  },
  async syncRates(input) {
    return stubResult(
      "booking",
      `syncRates stub ${input.checkIn}→${input.checkOut} amount=${input.amountCop ?? "?"} (no API oficial)`,
    );
  },
  async pullReservations() {
    return stubResult("booking", "pullReservations stub — no API oficial");
  },
  async handleWebhook({ idempotencyKey }) {
    return stubResult("booking", "webhook stub", idempotencyKey);
  },
};

export const expediaAdapter: ChannelAdapter = {
  id: "expedia",
  displayName: "Expedia",
  isStub: true,
  async pushAvailability(input) {
    return stubResult("expedia", `pushAvailability ${input.checkIn}→${input.checkOut}`);
  },
  async pullReservations() {
    return stubResult("expedia", "pullReservations");
  },
  async handleWebhook({ idempotencyKey }) {
    return stubResult("expedia", "webhook", idempotencyKey);
  },
};

export const directAdapter: ChannelAdapter = {
  id: "direct",
  displayName: "Direct / Website",
  isStub: false,
  async pushAvailability() {
    return {
      ok: true,
      channel: "direct",
      status: "accepted",
      message: "Canal directo: disponibilidad gestionada por motor interno",
    };
  },
  async pullReservations() {
    return {
      ok: true,
      channel: "direct",
      status: "accepted",
      message: "Reservas directas viven en PMS",
    };
  },
  async handleWebhook() {
    return {
      ok: true,
      channel: "direct",
      status: "accepted",
      message: "No aplica webhook OTA",
    };
  },
};

const REGISTRY: Record<ChannelId, ChannelAdapter> = {
  airbnb: airbnbAdapter,
  booking: bookingAdapter,
  expedia: expediaAdapter,
  direct: directAdapter,
  ical: {
    id: "ical",
    displayName: "iCal",
    isStub: false,
    async pushAvailability() {
      return {
        ok: true,
        channel: "ical",
        status: "accepted",
        message: "Export iCal existente en /api/ical/[propertyId]",
      };
    },
    async pullReservations() {
      return {
        ok: true,
        channel: "ical",
        status: "accepted",
        message: "Import iCal vía cron sync-ical",
      };
    },
    async handleWebhook() {
      return stubResult("ical", "iCal no usa webhooks HTTP tipicos");
    },
  },
};

export function getChannelAdapter(id: string): ChannelAdapter | null {
  return REGISTRY[id as ChannelId] ?? null;
}

export function listChannelAdapters(): ChannelAdapter[] {
  return Object.values(REGISTRY);
}
