# Post-Fases 11 — backlog real (integraciones + plataforma)

> Branch tip: `cursor/continuar-plataforma-2-f0b5`  
> Base: `cursor/continuar-plataforma-f0b5`  
> Cómo activar providers: [`INTEGRATIONS.md`](./INTEGRATIONS.md) · Migraciones: [`MIGRATIONS.md`](./MIGRATIONS.md) · Seguridad: [`SECURITY.md`](./SECURITY.md).

## Cerrado en esta pasada (continuar plataforma 2)

| Ítem | Qué |
|------|-----|
| Admin UX | Breadcrumbs en shell (`AdminBreadcrumbs`); sidebar ya cubre folio/promos/reportes/reviews/canales/CRM/pagos/SaaS/catálogo/analytics/mantenimiento/inventario/cotizaciones; `saas` mapeado a módulo analytics |
| Availability calendar | `GET /api/public/availability/calendar` + `nightAvailabilityCalendar` + UI en `/lofts` |
| Deposit flow | % configurable (`BOOKING_DEPOSIT_PERCENT`, default 30); guest pagar depósito/saldo mock; folio admin muestra deposit vs balance |
| Cancel / no-show | Policies seed + fee stub guest `/cancel` y admin `/api/admin/booking/cancel` |
| Housekeeping auto | Checkout → tarea `dirty` (local store + PMS PATCH + `/api/admin/housekeeping`) |
| Message center | `/mensajes` + `GET/POST /api/public/messages/[code]` (local) |
| Security | CSRF note; rate limit público default 45 + más rutas; audit helper en walk-in/cancel/pay/HK |
| Smoke + tests | Smoke extendido; tests deposit/cancel/HK/messages/audit/calendar |
| Loft polish | `/lofts/[slug]` CTA Reservar enlaza draft fechas del banner |

**Freeze respetado:** hero cards, banner, Personaliza, RESERVAR / WhatsApp, check-in, bottom nav (añadido Mensajes sin romper layout).

---

## Cerrado antes (continuar plataforma)

| Ítem | Qué |
|------|-----|
| Guest portal endurecido | `/mi-reserva` valida código + loading/error; `/confirmacion/[code]` skeleton/reintento; pago mock guest; factura borrador; FX display stub |
| Walk-in + grupos | `POST /api/admin/booking/walk-in`; multi-unidad (`lofts`→`property_ids`) en motor local; UI en `/admin/reservas` |
| Larga estadía 7/14/30 | `quote()` + config `descuentoQuincenal`; umbral mensual 30; tests |
| Inventario + compras | Stock seed, movimientos, low-stock → `local-notifications`; PO draft; UI en `/admin/inventario` |
| Revenue recommendations | Heurísticas ocupación enriquecidas (bandas, impactHint); UI analytics |
| i18n foundation | Diccionario ES/EN (`src/lib/i18n/dictionary.ts`) en bottom nav + CTAs guest |
| Multimoneda | COP base + USD/EUR stub ECB-like + disclaimer; `GET /api/public/fx` |
| E2E smoke | `npm run smoke:booking` |

---

## Requiere secrets reales (no inventados)

1. Wompi live checkout + webhooks firmados
2. WhatsApp Cloud API / Resend envío real
3. Credenciales partner OTA (ARI push real)
4. OpenAI (u otro LLM) para respuestas live
5. Proveedor autorizado DIAN / e-factura
6. FX provider real (ECB / Open Exchange) — hoy stub
7. Billing SaaS (suscripción) — solo foundations
8. Persistencia multi-room / walk-in / deposits / messages / HK en Supabase (hoy local)
9. CSRF Origin check + tokens en mutaciones admin (hoy nota + SameSite)

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

Smoke manual:

1. Booking → `/confirmacion/LH-…` → Pagar depósito (mock) → opcional saldo → check-in.
2. `/lofts` → calendario noches libres/bloqueadas → click → draft fechas.
3. `/mensajes` → abrir thread por código → enviar.
4. Cancel guest o admin → fee stub en folio.
5. Checkout admin/HK → tarea dirty.
6. Guest UX (cards / Personaliza / bottom nav) intacta.

---

## Criterios

- [x] Admin breadcrumbs + módulos sidebar
- [x] Availability calendar public + UI `/lofts`
- [x] Deposit % + guest mock + admin folio
- [x] Cancel/no-show policies + fee stub
- [x] Housekeeping dirty on checkout
- [x] Message center guest stub
- [x] Security CSRF note + rate limits + audit
- [x] Tests + smoke extendido
- [x] UX website preservada
- [x] `/lofts/[slug]` CTA con fechas banner
