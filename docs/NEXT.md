# Post-Fases 11 — backlog real (integraciones)

> Branch tip: `cursor/integraciones-backlog-f0b5`  
> Base: `cursor/next-backlog-slice-2-f0b5` (folio, cupones, reportes, reviews, automations).  
> Cómo activar providers: [`INTEGRATIONS.md`](./INTEGRATIONS.md) · Migraciones: [`MIGRATIONS.md`](./MIGRATIONS.md).

## Cerrado en esta pasada (integraciones backlog)

| Ítem | Qué |
|------|-----|
| Supabase / migraciones | `docs/MIGRATIONS.md` + `npm run migrations:verify` (017–028); smoke tenant/booking local |
| Check-in digital | Persistencia API (Supabase si hay env; else local) + notificación staff stub |
| Payments Wompi-first | `WompiPaymentProvider` createCheckout / verifyWebhook HMAC; webhook idempotente; flujo pending→paid + folio; UI «Simular pago Wompi» |
| WhatsApp / Email | Provider interfaces + Meta client (falla claro sin token) + mock log; automation runner cableado a templates |
| Channel Manager | `syncAvailability` / `syncRates` stubs + job runner + sync log UI; iCal real; sin fingir OTA oficial |
| LLM analytics | `runLlmAssistant` + POST `/api/admin/analytics`; stub con disclaimer; **sin auto-apply** |
| E-factura CO | `EInvoicingProvider` stub DIAN; borrador desde folio; botón «Generar factura (borrador)» |
| SaaS foundations | `module_flags` / plan seed; `/admin/saas` read-only; `ONBOARDING-SAAS.md` |

**Freeze respetado:** hero cards, banner, Personaliza, RESERVAR / WhatsApp, check-in, bottom nav.

---

## Cerrado antes

| Slice | Qué |
|-------|-----|
| Slice 2 | Folio, cupones, reportes CSV, reviews, automations runner |
| Slice 1 | Guest UX, check-in UI, housekeeping, channel import, payments pending, CRM |

---

## Requiere secrets reales (no inventados)

1. Wompi live checkout + webhooks firmados
2. WhatsApp Cloud API / Resend envío real
3. Credenciales partner OTA (ARI push real)
4. OpenAI (u otro LLM) para respuestas live
5. Proveedor autorizado DIAN / e-factura
6. Billing SaaS (suscripción) — solo foundations

---

## Cómo probar

```bash
npm ci
npm run migrations:verify
npm run test
npm run typecheck   # puede fallar por deuda previa en inventarios/printables
npm run lint
npm run dev         # http://127.0.0.1:43127
```

Smoke:

1. Booking → `/admin/pagos` → **Simular pago Wompi** → folio paid.
2. Check-in `/check-in/[code]` → notificación staff stub.
3. `/admin/canales` → Sync availability / rates → logs (stub).
4. `/admin/folio/[code]` → Generar factura (borrador).
5. `/admin/analytics` → Preguntar (stub sin key).
6. `/admin/saas` → module_flags read-only.
7. Guest UX (cards / Personaliza / bottom nav) intacta.

---

## Criterios

- [x] Migraciones doc + verify 017–028
- [x] Check-in persist + staff notify stub
- [x] Wompi adapter + webhook idempotency + UI simular
- [x] WhatsApp/Email providers + runner
- [x] Channel sync jobs + logs (stubs honestos)
- [x] LLM assistant sin auto-apply
- [x] E-invoice draft desde folio
- [x] SaaS module_flags read-only + onboarding doc
- [x] INTEGRATIONS.md + tests
- [x] UX website preservada
