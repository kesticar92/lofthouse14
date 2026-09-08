# Integraciones — cómo activar cada provider

> Nada de secretos en el repo. Copiar variables a `.env.local` / servidor desde [`.env.example`](../.env.example).

## Resumen

| Provider | Env mínimas | Sin secrets |
|----------|-------------|-------------|
| **Wompi** | `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET` | Checkout/webhook **mock** + botón «Simular pago Wompi» |
| **WhatsApp** | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Mock sender (log) |
| **Email** | `RESEND_API_KEY`, `EMAIL_FROM` | Mock sender (log) |
| **LLM analytics** | `OPENAI_API_KEY` | Stub + disclaimer (sin auto-apply) |
| **E-factura CO** | `EINVOICE_API_KEY` / `DIAN_API_KEY` | Borrador local desde folio |
| **FX / multimoneda** | (futuro provider) | Stub ECB-like COP→USD/EUR + disclaimer |
| **OTA Channel Manager** | Credenciales partner (no cableadas) | `syncAvailability` / `syncRates` **stubs** + log UI |
| **iCal** | Fuentes en PMS | Path real existente (`/api/ical`, cron sync) |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY` | Stores locales **durables** en `.data/` (booking, pagos, messages, HK, notifications) |

Todas las rutas mock llevan `TODO: REAL INTEGRATION REQUIRED` en mensajes.

### Persistencia local durable

```env
# default on en dev (off en Vitest)
# LH_DURABLE_STORE=0
# LH_DATA_DIR=.data
```

Archivos típicos: `booking.json`, `payments.json`, `messages.json`, `housekeeping.json`, `notifications.json`, `review-requests.json`. Reiniciar el server Next no borra reservas/depósitos locales.

### CSRF

```env
CSRF_ALLOWED_ORIGINS=https://lofthouse14.com,https://www.lofthouse14.com
# CSRF_STRICT=1          # rechaza mutaciones sin Origin/Referer
# CSRF_ORIGIN_CHECK=0    # desactivar
```

---

## 1. Supabase / migraciones

```bash
npm run migrations:verify
```

Ver [`MIGRATIONS.md`](./MIGRATIONS.md). Check-in digital: API → Supabase si hay service role; else store local + notificación staff stub.

## 2. Payments (Wompi-first)

```env
PAYMENT_PROVIDER=wompi
WOMPI_PUBLIC_KEY=pub_prod_...
WOMPI_PRIVATE_KEY=prv_prod_...
WOMPI_EVENTS_SECRET=...          # HMAC webhooks (x-event-checksum)
WOMPI_INTEGRITY_SECRET=...       # firma checkout
```

- `createCheckout` / `verifyWebhook` en `src/lib/payments/wompi.ts`
- Webhook: `POST /api/webhooks/payments/wompi` (idempotency-key / x-event-id)
- Admin `/admin/pagos`: **Simular pago Wompi** → pending → paid + folio

## 3. WhatsApp / Email

```env
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_BOOKING=         # opcional nombre template Meta
RESEND_API_KEY=
EMAIL_FROM=lofthouse14cali@gmail.com
```

Automation runner (`runAutomation` / `runAutomationAsync`): con token intenta Meta Cloud API; else mock. Templates en `src/lib/crm/templates.ts`.

## 4. Channel Manager

- Adapters stub Airbnb/Booking/Expedia: jobs `sync_availability` / `sync_rates` → log local (no fingir API oficial).
- iCal: real.
- UI: `/admin/canales` → Sync availability / Sync rates + logs.

## 5. LLM analytics

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

`POST /api/admin/analytics` con `{ prompt }` — **nunca** auto-aplica precios.

## 6. Facturación electrónica CO

```env
EINVOICE_PROVIDER=dian_authorized_stub
EINVOICE_API_KEY=
```

Folio → **Generar factura (borrador)** (`action: issue_draft_invoice`). Visible también en portal huésped si existe borrador.

## 7. Multimoneda (foundation)

`GET /api/public/fx?amount_cop=410000` — tasas **stub** (no oficiales). Display COP base + USD/EUR en confirmación.

## 8. SaaS foundations

- Seed `module_flags` / planes en `src/lib/saas/module-flags.ts`
- Admin read-only: `/admin/saas` + `GET /api/admin/saas/flags`
- Onboarding: [`ONBOARDING-SAAS.md`](./ONBOARDING-SAAS.md)

## Checklist de activación (prod)

1. [ ] `npm run migrations:verify` + aplicar 017–028 en Supabase
2. [ ] Service role + URL en servidor
3. [ ] Wompi keys + webhook URL pública
4. [ ] WhatsApp Meta token + phone number id + templates aprobados
5. [ ] (Opcional) Resend / OpenAI / e-factura
6. [ ] `module_flags.payments` / `ai_assistant` solo con keys reales
7. [ ] Smoke: booking → pending → webhook/simular → folio paid
