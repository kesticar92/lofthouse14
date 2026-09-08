/**
 * Automations runner local — log + notificación stub (sin WhatsApp real).
 */

import {
  DEFAULT_TEMPLATES,
  renderTemplate,
  type AutomationEventType,
  type TemplateVars,
} from "@/lib/crm/templates";

export type AutomationRunStatus = "logged" | "stub_sent" | "skipped";

export type AutomationRun = {
  id: string;
  event_type: AutomationEventType;
  template_code: string | null;
  channel: "whatsapp" | "email" | "internal" | "none";
  rendered_body: string | null;
  status: AutomationRunStatus;
  message: string;
  payload: Record<string, unknown>;
  notification: {
    title: string;
    body: string;
  } | null;
  created_at: string;
};

const EVENT_TEMPLATE: Partial<
  Record<AutomationEventType, string>
> = {
  booking_created: "booking_confirmation",
  booking_confirmed: "booking_confirmation",
  pre_arrival: "pre_arrival",
  post_stay: "post_stay",
  payment_received: "payment_received",
};

const g = globalThis as unknown as {
  __lhAutomationRuns?: AutomationRun[];
};

function store(): AutomationRun[] {
  if (!g.__lhAutomationRuns) g.__lhAutomationRuns = [];
  return g.__lhAutomationRuns;
}

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickTemplate(eventType: AutomationEventType) {
  const code = EVENT_TEMPLATE[eventType];
  if (!code) return null;
  return DEFAULT_TEMPLATES.find((t) => t.code === code) ?? null;
}

/**
 * Dispara templates al crear reserva / checkout / pago.
 * No envía WhatsApp real — solo log + notificación interna stub.
 */
export function runAutomation(input: {
  eventType: AutomationEventType;
  payload: Record<string, unknown>;
  vars?: TemplateVars;
}): AutomationRun {
  const tpl = pickTemplate(input.eventType);
  const vars: TemplateVars = {
    guest_name: String(input.payload.guest_name ?? input.vars?.guest_name ?? ""),
    reservation_code: String(
      input.payload.reservation_code ?? input.vars?.reservation_code ?? "",
    ),
    check_in: String(input.payload.check_in ?? input.vars?.check_in ?? ""),
    check_out: String(input.payload.check_out ?? input.vars?.check_out ?? ""),
    total: String(input.payload.total ?? input.vars?.total ?? ""),
    ...input.vars,
  };

  const rendered = tpl ? renderTemplate(tpl.body, vars) : null;
  const title =
    input.eventType === "booking_created"
      ? "Nueva reserva (automation)"
      : input.eventType === "post_stay"
        ? "Checkout / post-stay (automation)"
        : input.eventType === "payment_received"
          ? "Pago registrado (automation)"
          : `Automation · ${input.eventType}`;

  const run: AutomationRun = {
    id: newId(),
    event_type: input.eventType,
    template_code: tpl?.code ?? null,
    channel: tpl?.channel ?? "internal",
    rendered_body: rendered,
    status: "stub_sent",
    message:
      "Logged + internal notification stub — TODO: REAL INTEGRATION REQUIRED (WhatsApp/Email)",
    payload: input.payload,
    notification: {
      title,
      body: rendered ?? JSON.stringify(input.payload).slice(0, 200),
    },
    created_at: new Date().toISOString(),
  };

  store().unshift(run);
  if (store().length > 200) store().length = 200;
  return run;
}

export function listAutomationRuns(limit = 50): AutomationRun[] {
  return store().slice(0, Math.max(1, limit));
}

export function resetAutomationRuns() {
  g.__lhAutomationRuns = [];
}
