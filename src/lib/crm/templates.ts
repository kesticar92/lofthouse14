/** CRM helpers + message templates (Fase 9). */

export type TemplateVars = Record<string, string | number | null | undefined>;

/** Reemplaza `{{var}}` en templates. */
export function renderTemplate(body: string, vars: TemplateVars): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

export type GuestProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  notes?: string;
  tags?: string[];
};

export type AutomationEventType =
  | "booking_created"
  | "booking_confirmed"
  | "pre_arrival"
  | "post_stay"
  | "payment_received"
  | "custom";

export function stubAutomationEvent(
  eventType: AutomationEventType,
  payload: Record<string, unknown>,
): {
  event_type: AutomationEventType;
  status: "stub";
  message: string;
  payload: Record<string, unknown>;
} {
  return {
    event_type: eventType,
    status: "stub",
    message: "TODO: REAL INTEGRATION REQUIRED — messaging/automation runner",
    payload,
  };
}

export const DEFAULT_TEMPLATES = [
  {
    code: "booking_confirmation",
    channel: "whatsapp" as const,
    name: "Confirmación de reserva",
    body: "Hola {{guest_name}}, tu reserva {{reservation_code}} en LOFTHOUSE 14 está confirmada: {{check_in}} → {{check_out}}. Total estimado: {{total}}.",
    variables: [
      "guest_name",
      "reservation_code",
      "check_in",
      "check_out",
      "total",
    ],
  },
  {
    code: "pre_arrival",
    channel: "whatsapp" as const,
    name: "Pre-llegada",
    body: "Hola {{guest_name}}, te esperamos mañana ({{check_in}}). Código: {{reservation_code}}.",
    variables: ["guest_name", "check_in", "reservation_code"],
  },
];
