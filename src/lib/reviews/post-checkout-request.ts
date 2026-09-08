/**
 * Guest review request stub — post checkout (sin envío real).
 */

import { pushLocalOpsNotification } from "@/lib/ops/local-notifications";
import {
  clearJsonFile,
  durableStoreEnabled,
  loadJsonFile,
  saveJsonFile,
} from "@/lib/persist/json-file-store";
import { runAutomation } from "@/lib/crm/automation-runner";

export type ReviewRequestStub = {
  id: string;
  reservation_code: string;
  guest_name: string;
  guest_email?: string;
  status: "queued" | "stub_sent" | "skipped";
  review_url: string;
  message: string;
  created_at: string;
};

type Snapshot = { requests: ReviewRequestStub[] };

const STORE_NAME = "review-requests";

const g = globalThis as unknown as {
  __lhReviewRequests?: ReviewRequestStub[];
  __lhReviewHydrated?: boolean;
};

function hydrateIfNeeded() {
  if (g.__lhReviewHydrated) return;
  g.__lhReviewHydrated = true;
  if (!durableStoreEnabled()) return;
  const snap = loadJsonFile<Snapshot>(STORE_NAME);
  if (snap?.requests) g.__lhReviewRequests = snap.requests;
}

function persist() {
  if (!durableStoreEnabled()) return;
  saveJsonFile(STORE_NAME, { requests: store() } satisfies Snapshot);
}

function store(): ReviewRequestStub[] {
  hydrateIfNeeded();
  if (!g.__lhReviewRequests) g.__lhReviewRequests = [];
  return g.__lhReviewRequests;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `rr-${crypto.randomUUID()}`;
  }
  return `rr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function queuePostCheckoutReviewRequest(input: {
  reservationCode: string;
  guestName: string;
  guestEmail?: string;
  checkIn?: string;
  checkOut?: string;
}): ReviewRequestStub {
  const code = input.reservationCode.trim().toUpperCase();
  const existing = store().find(
    (r) => r.reservation_code === code && r.status !== "skipped",
  );
  if (existing) return existing;

  const reviewUrl = `/reviews?code=${encodeURIComponent(code)}`;
  const now = new Date().toISOString();
  const row: ReviewRequestStub = {
    id: newId(),
    reservation_code: code,
    guest_name: input.guestName,
    guest_email: input.guestEmail,
    status: "stub_sent",
    review_url: reviewUrl,
    message:
      "Stub: solicitud de reseña post-checkout encolada (sin WhatsApp/Email real). TODO: REAL INTEGRATION REQUIRED.",
    created_at: now,
  };
  store().unshift(row);
  if (store().length > 200) store().length = 200;
  persist();

  pushLocalOpsNotification({
    title: `Reseña pendiente · ${code}`,
    message: `Solicitar reseña a ${input.guestName} (${reviewUrl})`,
    level: "info",
    href: "/admin/reviews",
    source: "review_request_stub",
  });

  runAutomation({
    eventType: "post_stay",
    payload: {
      reservation_code: code,
      guest_name: input.guestName,
      check_in: input.checkIn ?? "",
      check_out: input.checkOut ?? "",
      review_url: reviewUrl,
    },
  });

  return row;
}

export function listReviewRequests(): ReviewRequestStub[] {
  return [...store()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function resetReviewRequests() {
  g.__lhReviewRequests = [];
  clearJsonFile(STORE_NAME);
}
