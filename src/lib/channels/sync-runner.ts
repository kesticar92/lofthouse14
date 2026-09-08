/**
 * Channel Manager — job runner local para syncAvailability / syncRates.
 * OTAs stub: NO finge éxito real de Booking/Airbnb APIs.
 * iCal path permanece real vía adapters existentes.
 */

import {
  getChannelAdapter,
  type ChannelId,
  type ChannelSyncResult,
} from "./adapter";

export type ChannelSyncJobType = "availability" | "rates" | "pull";

export type ChannelSyncLogEntry = {
  id: string;
  channel: ChannelId;
  job_type: ChannelSyncJobType;
  status: ChannelSyncResult["status"] | "queued" | "running";
  message: string;
  is_stub: boolean;
  payload?: Record<string, unknown>;
  created_at: string;
};

const g = globalThis as unknown as {
  __lhChannelSyncLogs?: ChannelSyncLogEntry[];
};

function logs(): ChannelSyncLogEntry[] {
  if (!g.__lhChannelSyncLogs) g.__lhChannelSyncLogs = [];
  return g.__lhChannelSyncLogs;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listChannelSyncLogs(limit = 50): ChannelSyncLogEntry[] {
  return logs().slice(0, Math.max(1, limit));
}

export function resetChannelSyncLogs() {
  g.__lhChannelSyncLogs = [];
}

function pushLog(entry: ChannelSyncLogEntry) {
  logs().unshift(entry);
  if (logs().length > 200) logs().length = 200;
}

/** Extiende adapters con syncAvailability / syncRates (stubs OTA). */
export async function syncAvailability(input: {
  channel: string;
  checkIn: string;
  checkOut: string;
  available?: number;
}): Promise<ChannelSyncLogEntry> {
  const adapter = getChannelAdapter(input.channel);
  if (!adapter) {
    const entry: ChannelSyncLogEntry = {
      id: newId(),
      channel: (input.channel as ChannelId) || "direct",
      job_type: "availability",
      status: "error",
      message: "Canal desconocido",
      is_stub: true,
      created_at: new Date().toISOString(),
    };
    pushLog(entry);
    return entry;
  }

  const result = await adapter.pushAvailability({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    available: input.available ?? 1,
  });

  const entry: ChannelSyncLogEntry = {
    id: newId(),
    channel: adapter.id,
    job_type: "availability",
    status: result.status,
    message: result.message,
    is_stub: adapter.isStub,
    payload: {
      ...(result.payload ?? {}),
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      available: input.available ?? 1,
      note: adapter.isStub
        ? "Simulated ARI push — not a real OTA API success"
        : undefined,
    },
    created_at: new Date().toISOString(),
  };
  pushLog(entry);
  return entry;
}

export async function syncRates(input: {
  channel: string;
  checkIn: string;
  checkOut: string;
  amountCop?: number;
  currency?: string;
}): Promise<ChannelSyncLogEntry> {
  const adapter = getChannelAdapter(input.channel);
  if (!adapter) {
    const entry: ChannelSyncLogEntry = {
      id: newId(),
      channel: (input.channel as ChannelId) || "direct",
      job_type: "rates",
      status: "error",
      message: "Canal desconocido",
      is_stub: true,
      created_at: new Date().toISOString(),
    };
    pushLog(entry);
    return entry;
  }

  // No inventamos payloads oficiales de Booking/Airbnb como “éxito real”.
  const entry: ChannelSyncLogEntry = {
    id: newId(),
    channel: adapter.id,
    job_type: "rates",
    status: adapter.isStub ? "simulated" : "accepted",
    message: adapter.isStub
      ? `TODO: REAL INTEGRATION REQUIRED — syncRates stub (${adapter.displayName}). No se empujó tarifa real.`
      : adapter.id === "ical"
        ? "iCal no transporta rates; usar rate plans internos"
        : "Rates gestionados en motor local",
    is_stub: adapter.isStub,
    payload: {
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      amountCop: input.amountCop ?? null,
      currency: input.currency ?? "COP",
      officialApi: false,
    },
    created_at: new Date().toISOString(),
  };
  pushLog(entry);
  return entry;
}

export async function runChannelSyncJob(input: {
  channel: string;
  jobType: ChannelSyncJobType;
  checkIn?: string;
  checkOut?: string;
  available?: number;
  amountCop?: number;
}): Promise<ChannelSyncLogEntry> {
  const checkIn =
    input.checkIn ?? new Date().toISOString().slice(0, 10);
  const checkOut =
    input.checkOut ??
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  if (input.jobType === "rates") {
    return syncRates({
      channel: input.channel,
      checkIn,
      checkOut,
      amountCop: input.amountCop,
    });
  }
  if (input.jobType === "pull") {
    const adapter = getChannelAdapter(input.channel);
    if (!adapter) {
      const entry: ChannelSyncLogEntry = {
        id: newId(),
        channel: (input.channel as ChannelId) || "direct",
        job_type: "pull",
        status: "error",
        message: "Canal desconocido",
        is_stub: true,
        created_at: new Date().toISOString(),
      };
      pushLog(entry);
      return entry;
    }
    const result = await adapter.pullReservations();
    const entry: ChannelSyncLogEntry = {
      id: newId(),
      channel: adapter.id,
      job_type: "pull",
      status: result.status,
      message: result.message,
      is_stub: adapter.isStub,
      payload: result.payload,
      created_at: new Date().toISOString(),
    };
    pushLog(entry);
    return entry;
  }
  return syncAvailability({
    channel: input.channel,
    checkIn,
    checkOut,
    available: input.available,
  });
}
