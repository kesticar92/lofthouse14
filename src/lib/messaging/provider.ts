/**
 * Messaging providers — WhatsApp (Meta Cloud API) + Email.
 * Sin token → mock que loguea. TODO: REAL INTEGRATION REQUIRED.
 */

export type MessagingChannel = "whatsapp" | "email";

export type SendMessageInput = {
  to: string;
  body: string;
  templateCode?: string;
  templateName?: string;
  languageCode?: string;
  variables?: Record<string, string>;
  subject?: string;
};

export type SendMessageResult = {
  ok: boolean;
  channel: MessagingChannel;
  mode: "live" | "mock";
  externalId?: string;
  message: string;
  loggedPayload?: Record<string, unknown>;
};

export type MessagingProvider = {
  id: string;
  channel: MessagingChannel;
  isStub: boolean;
  send(input: SendMessageInput): Promise<SendMessageResult>;
};

const g = globalThis as unknown as {
  __lhMessagingLog?: SendMessageResult[];
};

function logStore(): SendMessageResult[] {
  if (!g.__lhMessagingLog) g.__lhMessagingLog = [];
  return g.__lhMessagingLog;
}

export function listMessagingLogs(limit = 50): SendMessageResult[] {
  return logStore().slice(0, Math.max(1, limit));
}

export function resetMessagingLogs() {
  g.__lhMessagingLog = [];
}

function pushLog(row: SendMessageResult) {
  logStore().unshift(row);
  if (logStore().length > 200) logStore().length = 200;
}

export function createMockWhatsAppSender(): MessagingProvider {
  return {
    id: "whatsapp_mock",
    channel: "whatsapp",
    isStub: true,
    async send(input) {
      const result: SendMessageResult = {
        ok: true,
        channel: "whatsapp",
        mode: "mock",
        externalId: `mock_wa_${Date.now()}`,
        message:
          "TODO: REAL INTEGRATION REQUIRED — WhatsApp mock (logueado, no enviado)",
        loggedPayload: {
          to: input.to,
          body: input.body.slice(0, 500),
          templateCode: input.templateCode,
        },
      };
      console.info("[messaging:whatsapp:mock]", result.loggedPayload);
      pushLog(result);
      return result;
    },
  };
}

export function createMockEmailSender(): MessagingProvider {
  return {
    id: "email_mock",
    channel: "email",
    isStub: true,
    async send(input) {
      const result: SendMessageResult = {
        ok: true,
        channel: "email",
        mode: "mock",
        externalId: `mock_email_${Date.now()}`,
        message:
          "TODO: REAL INTEGRATION REQUIRED — Email mock (logueado, no enviado)",
        loggedPayload: {
          to: input.to,
          subject: input.subject ?? "LOFTHOUSE 14",
          body: input.body.slice(0, 500),
        },
      };
      console.info("[messaging:email:mock]", result.loggedPayload);
      pushLog(result);
      return result;
    },
  };
}

/**
 * Meta WhatsApp Cloud API client.
 * Falla claro sin WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID.
 */
export function createMetaWhatsAppClient(): MessagingProvider {
  const token = process.env.WHATSAPP_TOKEN?.trim() || null;
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null;
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0";

  if (!token || !phoneNumberId) {
    return {
      id: "whatsapp_meta",
      channel: "whatsapp",
      isStub: true,
      async send(input) {
        const result: SendMessageResult = {
          ok: false,
          channel: "whatsapp",
          mode: "mock",
          message:
            "TODO: REAL INTEGRATION REQUIRED — falta WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID. No se envió el mensaje.",
          loggedPayload: {
            to: input.to,
            bodyPreview: input.body.slice(0, 120),
            reason: "missing_credentials",
          },
        };
        console.warn("[messaging:whatsapp:meta]", result.message);
        pushLog(result);
        return result;
      },
    };
  }

  return {
    id: "whatsapp_meta",
    channel: "whatsapp",
    isStub: false,
    async send(input) {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const payload: Record<string, unknown> = input.templateName
        ? {
            messaging_product: "whatsapp",
            to: input.to.replace(/\D/g, ""),
            type: "template",
            template: {
              name: input.templateName,
              language: { code: input.languageCode ?? "es" },
              components: input.variables
                ? [
                    {
                      type: "body",
                      parameters: Object.values(input.variables).map(
                        (text) => ({ type: "text", text }),
                      ),
                    },
                  ]
                : undefined,
            },
          }
        : {
            messaging_product: "whatsapp",
            to: input.to.replace(/\D/g, ""),
            type: "text",
            text: { body: input.body },
          };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as {
          messages?: Array<{ id?: string }>;
          error?: { message?: string };
        };
        if (!res.ok) {
          const result: SendMessageResult = {
            ok: false,
            channel: "whatsapp",
            mode: "live",
            message: data.error?.message ?? `Meta API HTTP ${res.status}`,
            loggedPayload: { status: res.status, data },
          };
          pushLog(result);
          return result;
        }
        const result: SendMessageResult = {
          ok: true,
          channel: "whatsapp",
          mode: "live",
          externalId: data.messages?.[0]?.id,
          message: "WhatsApp enviado vía Meta Cloud API",
          loggedPayload: { to: input.to, template: input.templateName },
        };
        pushLog(result);
        return result;
      } catch (err) {
        const result: SendMessageResult = {
          ok: false,
          channel: "whatsapp",
          mode: "live",
          message: err instanceof Error ? err.message : "Error de red Meta API",
        };
        pushLog(result);
        return result;
      }
    },
  };
}

/** Resend / SMTP stub — sin key → mock. */
export function createEmailProvider(): MessagingProvider {
  const apiKey = process.env.RESEND_API_KEY?.trim() || null;
  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.NEXT_PUBLIC_EMAIL?.trim() ||
    "noreply@lofthouse14.com";

  if (!apiKey) {
    return createMockEmailSender();
  }

  return {
    id: "email_resend",
    channel: "email",
    isStub: false,
    async send(input) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [input.to],
            subject: input.subject ?? "LOFTHOUSE 14",
            text: input.body,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
        };
        const result: SendMessageResult = {
          ok: res.ok,
          channel: "email",
          mode: "live",
          externalId: data.id,
          message: res.ok
            ? "Email enviado (Resend)"
            : data.message ?? `Resend HTTP ${res.status}`,
        };
        pushLog(result);
        return result;
      } catch (err) {
        const result: SendMessageResult = {
          ok: false,
          channel: "email",
          mode: "live",
          message: err instanceof Error ? err.message : "Error Resend",
        };
        pushLog(result);
        return result;
      }
    },
  };
}

export function getWhatsAppProvider(): MessagingProvider {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  if (token) return createMetaWhatsAppClient();
  return createMockWhatsAppSender();
}

export function getEmailProvider(): MessagingProvider {
  return createEmailProvider();
}
