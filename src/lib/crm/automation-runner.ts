/**
 * Automations runner — templates + WhatsApp/Email (token → Meta; else mock).
 */

import {
  DEFAULT_TEMPLATES,
  renderTemplate,
  type AutomationEventType,
  type TemplateVars,
} from "@/lib/crm/templates";
import {
  getEmailProvider,
  getWhatsAppProvider,
  type SendMessageResult,
} from "@/lib/messaging/provider";

export type AutomationRunStatus =
  | "logged"
  | "stub_sent"
  | "sent"
  | "failed"
  | "skipped";

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
  delivery?: SendMessageResult | null;
  created_at: string;
};

const EVENT_TEMPLATE: Partial<Record<AutomationEventType, string>> = {
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

function buildVars(
  payload: Record<string, unknown>,
  extra?: TemplateVars,
): TemplateVars {
  return {
    guest_name: String(payload.guest_name ?? extra?.guest_name ?? ""),
    reservation_code: String(
      payload.reservation_code ?? extra?.reservation_code ?? "",
    ),
    check_in: String(payload.check_in ?? extra?.check_in ?? ""),
    check_out: String(payload.check_out ?? extra?.check_out ?? ""),
    total: String(payload.total ?? extra?.total ?? ""),
    ...extra,
  };
}

function titleFor(eventType: AutomationEventType): string {
  if (eventType === "booking_created") return "Nueva reserva (automation)";
  if (eventType === "post_stay") return "Checkout / post-stay (automation)";
  if (eventType === "payment_received") return "Pago registrado (automation)";
  return `Automation · ${eventType}`;
}

function pushRun(run: AutomationRun) {
  store().unshift(run);
  if (store().length > 200) store().length = 200;
}

/**
 * Async: si hay WHATSAPP_TOKEN intenta send template; else mock.
 */
export async function runAutomationAsync(input: {
  eventType: AutomationEventType;
  payload: Record<string, unknown>;
  vars?: TemplateVars;
  to?: string;
}): Promise<AutomationRun> {
  const tpl = pickTemplate(input.eventType);
  const vars = buildVars(input.payload, input.vars);
  const rendered = tpl ? renderTemplate(tpl.body, vars) : null;
  const channel = tpl?.channel ?? "internal";

  let delivery: SendMessageResult | null = null;
  let status: AutomationRunStatus = "stub_sent";
  let message =
    "Logged + internal notification stub — TODO: REAL INTEGRATION REQUIRED (WhatsApp/Email)";

  const phone = String(
    input.to ??
      input.payload.guest_phone ??
      input.payload.phone ??
      process.env.WHATSAPP_FALLBACK_TO ??
      "",
  );
  const email = String(
    input.payload.guest_email ??
      input.payload.email ??
      process.env.EMAIL_FALLBACK_TO ??
      "",
  );

  if (rendered && channel === "whatsapp") {
    delivery = await getWhatsAppProvider().send({
      to: phone || "unknown",
      body: rendered,
      templateCode: tpl?.code,
      templateName: process.env.WHATSAPP_TEMPLATE_BOOKING?.trim() || undefined,
      variables: Object.fromEntries(
        Object.entries(vars).map(([k, v]) => [k, String(v ?? "")]),
      ),
    });
    message = delivery.message;
    status =
      delivery.mode === "live"
        ? delivery.ok
          ? "sent"
          : "failed"
        : "stub_sent";
  } else if (rendered && channel === "email") {
    delivery = await getEmailProvider().send({
      to: email.includes("@") ? email : "unknown@example.com",
      body: rendered,
      subject: `LOFTHOUSE 14 · ${tpl?.name ?? input.eventType}`,
      templateCode: tpl?.code,
    });
    message = delivery.message;
    status =
      delivery.mode === "live"
        ? delivery.ok
          ? "sent"
          : "failed"
        : "stub_sent";
  }

  const run: AutomationRun = {
    id: newId(),
    event_type: input.eventType,
    template_code: tpl?.code ?? null,
    channel,
    rendered_body: rendered,
    status,
    message,
    payload: input.payload,
    notification: {
      title: titleFor(input.eventType),
      body: rendered ?? JSON.stringify(input.payload).slice(0, 200),
    },
    delivery,
    created_at: new Date().toISOString(),
  };
  pushRun(run);
  return run;
}

/**
 * Sync API (call sites existentes). Usa mock inmediato; dispara async en background si hay token.
 */
export function runAutomation(input: {
  eventType: AutomationEventType;
  payload: Record<string, unknown>;
  vars?: TemplateVars;
  to?: string;
}): AutomationRun {
  const tpl = pickTemplate(input.eventType);
  const vars = buildVars(input.payload, input.vars);
  const rendered = tpl ? renderTemplate(tpl.body, vars) : null;
  const channel = tpl?.channel ?? "internal";
  const hasToken = Boolean(process.env.WHATSAPP_TOKEN?.trim());

  const run: AutomationRun = {
    id: newId(),
    event_type: input.eventType,
    template_code: tpl?.code ?? null,
    channel,
    rendered_body: rendered,
    status: "stub_sent",
    message: hasToken
      ? "Logged; live WhatsApp queued (WHATSAPP_TOKEN present) — TODO: REAL INTEGRATION REQUIRED if send fails"
      : "Logged + internal notification stub — TODO: REAL INTEGRATION REQUIRED (WhatsApp/Email)",
    payload: input.payload,
    notification: {
      title: titleFor(input.eventType),
      body: rendered ?? JSON.stringify(input.payload).slice(0, 200),
    },
    delivery: {
      ok: true,
      channel: channel === "email" ? "email" : "whatsapp",
      mode: "mock",
      message: hasToken
        ? "Background live send via runAutomationAsync"
        : "Mock sender (no WHATSAPP_TOKEN)",
      loggedPayload: {
        preview: rendered?.slice(0, 120) ?? null,
        to: input.to ?? null,
      },
    },
    created_at: new Date().toISOString(),
  };
  pushRun(run);

  if (hasToken && rendered && (channel === "whatsapp" || channel === "email")) {
    void runAutomationAsync(input);
  }

  return run;
}

export function listAutomationRuns(limit = 50): AutomationRun[] {
  return store().slice(0, Math.max(1, limit));
}

export function resetAutomationRuns() {
  g.__lhAutomationRuns = [];
}
