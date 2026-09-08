# Fases 3–11 — Plataforma PMS / booking / canales / pagos

> Branch: `cursor/fase3-a-11-plataforma-f0b5`  
> Base: tip Fase 2 (`cursor/fase2-catalogo-pms-f0b5`) + website UX (cards, banner, Personaliza, RESERVAR).  
> Fuente de verdad del orden: [`ARCHITECTURE.md`](./ARCHITECTURE.md) §9.

**Freeze respetado:** no se borró hero cards, banner de fechas, wizard «Personaliza tu experiencia», ni flujo RESERVAR (se enchufó al booking engine + WhatsApp coexistente).

---

## Resumen por fase

| Fase | Estado | Usable | Stub / TODO real |
|------|--------|--------|------------------|
| **3** Disponibilidad | Hecha | Motor puro + `/api/public/availability` + admin | Holds en DB requieren migración 021 |
| **4** Booking engine | Hecha | POST `/api/public/booking`, wizard RESERVAR, `/confirmacion`, `/mi-reserva` | Persistencia Supabase si 022; si no → store local memoria |
| **5** Pricing unificado | Hecha | `unifiedQuote` + rate plans seed + admin pricing existente | Temporadas DB (023) opcionales |
| **6** PMS core | Hecha | Métricas ocupación/ADR/RevPAR en `/admin` + API metrics; statuses check-in/out | Calendario visual sigue el de `/admin/reservas` |
| **7** Channel Manager | Hecha | Adapters + webhooks stub + `/admin/canales` simulador | Airbnb/Booking/Expedia API reales |
| **8** Ops | Hecha | Maintenance tickets + OUT_OF_SERVICE → availability; HK statuses | Drive/inventario legacy intactos |
| **9** CRM | Hecha | Guests, templates `{{vars}}`, automations stub, `/admin/crm` | WhatsApp/Email API reales |
| **10** Payments | Hecha | PaymentProvider stubs + webhooks + `/admin/pagos` | Wompi/MP/Stripe/PayU keys |
| **11** Analytics/SaaS | Hecha | CSV export, revenue tips (no auto-apply), AI stub, rate limit, docs | LLM key; billing SaaS |

---

## Migraciones (021–028)

Aplicar **en orden** tras 017–020 en Supabase SQL Editor o `npx supabase db push`:

| Archivo | Contenido |
|---------|-----------|
| `021_availability_holds.sql` | Holds + `out_of_service` rooms + block_type |
| `022_booking_engine.sql` | reservation_code, guest_email, extras, payment_status, statuses |
| `023_rate_plans.sql` | rate_plans + season_rules + seed BASE |
| `024_channel_manager.sql` | channel_connections + sync_logs |
| `025_ops_housekeeping_maintenance.sql` | maintenance_tickets + hk_status |
| `026_crm_messaging.sql` | guests, message_templates, automation_events |
| `027_payments.sql` | payments |
| `028_module_flags_saas.sql` | organizations.module_flags / branding |

Sin migrar: admin y booking público siguen en **modo local/seed** (evaluable).

---

## APIs nuevas

**Público**

- `GET /api/public/availability?check_in=&check_out=&category=&guests=`
- `POST /api/public/booking` — crea reserva (anti double-booking)
- `GET /api/public/booking/[code]`

**Admin**

- `GET /api/admin/availability`
- `GET /api/admin/pms/metrics`
- `GET/POST /api/admin/channels` + `POST .../simulate`
- `GET/POST /api/admin/maintenance`
- `GET/POST /api/admin/crm/guests|templates|automations`
- `GET/POST /api/admin/payments`
- `GET /api/admin/analytics` (`?format=csv`, `?ai_prompt=`)

**Webhooks stub**

- `POST /api/webhooks/channels/[channel]` (idempotency-key)
- `POST /api/webhooks/payments/[provider]`

Todos los stubs marcan `TODO: REAL INTEGRATION REQUIRED`.

---

## Cómo probar

```bash
npm ci
npm run test
npm run typecheck
npm run lint
npm run dev   # puerto 43127 (ver package.json) o 3001
```

Smoke sin Supabase:

1. `/reservar` → completar wizard → **RESERVAR** → crea reserva local + `/confirmacion/LH-…` (+ WA).
2. `GET /api/public/availability?check_in=2026-11-01&check_out=2026-11-03&category=vista`
3. `/admin` → métricas (pueden ser 0 si no hay reservas).
4. `/admin/canales` → Simular sync (stub).
5. `/admin/pagos` → intent stub.
6. `/admin/analytics` → CSV + AI “requires LLM key”.

Con Supabase: aplicar 021–028 y repetir (persistencia real).

---

## Criterios mínimos

- [x] Motor availability + tests double booking
- [x] Booking desde wizard sin romper WA
- [x] Pricing unificado enlazado
- [x] PMS métricas + check-in/out statuses
- [x] Channel / payments / CRM stubs documentados
- [x] Ops OUT_OF_SERVICE
- [x] Analytics + docs SECURITY/API/DEPLOYMENT + rate limit
- [x] Admin local sin Supabase usable
