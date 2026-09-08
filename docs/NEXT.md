# Post-Fases 11 — backlog real (integraciones + plataforma)

> Branch tip: `cursor/continuar-plataforma-3-f0b5`  
> Base: `cursor/continuar-plataforma-2-f0b5`  
> Cómo activar providers: [`INTEGRATIONS.md`](./INTEGRATIONS.md) · Migraciones: [`MIGRATIONS.md`](./MIGRATIONS.md) · Seguridad: [`SECURITY.md`](./SECURITY.md).

## Cerrado en esta pasada (continuar plataforma 3)

| Ítem | Qué |
|------|-----|
| Persistencia local durable | JSON en `.data/` (`booking`, `payments`, `messages`, `housekeeping`, `notifications`, `review-requests`); sobrevive reinicio Next en dev. `LH_DURABLE_STORE=0` / Vitest off. Si Supabase env presente, rutas siguen path remoto |
| CSRF | Origin/Referer allowlist en mutaciones `/api/admin/*` + `/api/public/booking*` (`CSRF_ALLOWED_ORIGINS`, `CSRF_STRICT`, `CSRF_ORIGIN_CHECK=0`) |
| Extras catalog | Seed + quote server (`extras-catalog`) early/late/desayuno/traslado; wizard extras + resumen; precio total incluye extras |
| Canales corporate/referral | `channel` + meta en booking/walk-in; reportes con labels |
| Front desk | `/admin/front-desk` arrivals/departures/in-house + check-in/out rápido |
| Notifications UI | Bell polish + `/admin/notificaciones`; merge Supabase + ops local; marcar leídas |
| Review stub + políticas | Post-checkout review request stub; `/politicas` con seed cancelación + depósito % visible |
| Smoke + tests | CSRF, extras, channels, front-desk, persist, politicas |

**Freeze respetado:** hero cards, banner, Personaliza, RESERVAR / WhatsApp, check-in, bottom nav (Mensajes).

---

## Cerrado antes (continuar plataforma 2)

| Ítem | Qué |
|------|-----|
| Admin UX | Breadcrumbs; sidebar módulos |
| Availability calendar | Público + UI `/lofts` |
| Deposit flow | % configurable; guest mock; folio |
| Cancel / no-show | Policies seed + fee stub |
| Housekeeping auto | Checkout → dirty |
| Message center | `/mensajes` |
| Security | Rate limit + audit |
| Loft polish | CTA con fechas banner |

---

## Requiere secrets reales (no inventados)

1. Wompi live checkout + webhooks firmados
2. WhatsApp Cloud API / Resend envío real
3. Credenciales partner OTA (ARI push real)
4. OpenAI (u otro LLM) para respuestas live
5. Proveedor autorizado DIAN / e-factura
6. FX provider real (ECB / Open Exchange) — hoy stub
7. Billing SaaS (suscripción) — solo foundations
8. Persistencia multi-room / walk-in / deposits / messages / HK en Supabase (hoy `.data/` local durable)
9. Double-submit CSRF cookie (hoy Origin/Referer allowlist)

---

## Cómo probar

```bash
npm ci
npm run migrations:verify
npm run test
npm run typecheck   # puede fallar por deuda previa en inventarios/printables
npm run lint
npm run dev         # http://127.0.0.1:43127
npm run smoke:booking
```

Persistencia local:

```bash
# tras crear reservas en dev, reiniciar next → siguen en .data/*.json
ls .data/
# LH_DURABLE_STORE=0 para forzar solo memoria
```

Smoke manual:

1. Booking con extras + canal corporate → confirmación → depósito mock.
2. `/politicas#cancelaciones` visible.
3. Admin `/admin/front-desk` check-in/out (con sesión staff).
4. Campana avisos → marcar leídas / `/admin/notificaciones`.
5. Guest UX freeze intacta.

---

## Criterios

- [x] Durable `.data/` store (booking/payments/messages/HK/deposits/notifications)
- [x] CSRF Origin/Referer en admin + public booking
- [x] Extras catalog seed + quote + UI
- [x] Corporate / referral channels + reportes
- [x] Front desk day view
- [x] Notification center polish
- [x] Review request stub + `/politicas` cancelación
- [x] Tests + smoke extendido
- [x] UX website preservada
