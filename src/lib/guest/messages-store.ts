/**
 * Message center guest — threads por código de reserva (local stub).
 */

export type GuestMessage = {
  id: string;
  role: "guest" | "staff" | "system";
  body: string;
  created_at: string;
};

export type GuestMessageThread = {
  reservation_code: string;
  guest_name: string;
  messages: GuestMessage[];
  updated_at: string;
  created_at: string;
};

const g = globalThis as unknown as {
  __lhGuestMessages?: Map<string, GuestMessageThread>;
};

function map() {
  if (!g.__lhGuestMessages) g.__lhGuestMessages = new Map();
  return g.__lhGuestMessages;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `msg-${crypto.randomUUID()}`;
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getOrCreateThread(
  code: string,
  guestName = "Huésped",
): GuestMessageThread {
  const key = code.trim().toUpperCase();
  const existing = map().get(key);
  if (existing) return existing;
  const now = new Date().toISOString();
  const thread: GuestMessageThread = {
    reservation_code: key,
    guest_name: guestName,
    messages: [
      {
        id: newId(),
        role: "system",
        body: "Hola — este es el centro de mensajes stub. El staff responderá aquí (sin WhatsApp Cloud aún).",
        created_at: now,
      },
    ],
    created_at: now,
    updated_at: now,
  };
  map().set(key, thread);
  return thread;
}

export function getThread(code: string): GuestMessageThread | null {
  return map().get(code.trim().toUpperCase()) ?? null;
}

export function appendGuestMessage(
  code: string,
  body: string,
  guestName?: string,
): GuestMessageThread {
  const thread = getOrCreateThread(code, guestName);
  const text = body.trim().slice(0, 2000);
  if (!text) return thread;
  thread.messages.push({
    id: newId(),
    role: "guest",
    body: text,
    created_at: new Date().toISOString(),
  });
  if (guestName) thread.guest_name = guestName;
  thread.updated_at = new Date().toISOString();
  map().set(thread.reservation_code, thread);
  return thread;
}

export function appendStaffReply(
  code: string,
  body: string,
): GuestMessageThread | null {
  const thread = getThread(code);
  if (!thread) return null;
  const text = body.trim().slice(0, 2000);
  if (!text) return thread;
  thread.messages.push({
    id: newId(),
    role: "staff",
    body: text,
    created_at: new Date().toISOString(),
  });
  thread.updated_at = new Date().toISOString();
  return thread;
}

export function listThreads(): GuestMessageThread[] {
  return [...map().values()].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
}

export function resetGuestMessages() {
  g.__lhGuestMessages = new Map();
}
