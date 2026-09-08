# Post-Fases 11 — backlog real y hardening

> Branch tip: `cursor/next-backlog-slice-2-f0b5`  
> Base: `cursor/next-backlog-slice-f0b5` (guest UX + check-in + ops stubs).  
> Detalle histórico: [`FASES-3-11.md`](./FASES-3-11.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Cerrado en esta pasada (next backlog slice 2)

| Ítem | Qué |
|------|-----|
| Folio / cuenta huésped | `/admin/folio` + `/admin/folio/[code]`: noches, extras, cargos, pagos, saldo; acciones pago manual (efectivo/transferencia), agregar cargo, marcar saldo 0 |
| Promociones / cupones | Seed + CRUD `/admin/promociones`; `POST /api/public/coupons/validate`; cupón en resumen `/reservar` + booking |
| Reportes export | `/admin/reportes`: filtros fecha, occupancy/revenue/channel, CSV Excel-friendly (BOM + `;`); analytics con rango |
| Reviews centralizados | `/admin/reviews`: listado + sentiment stub + categorías; link desde CRM |
| Automations runner | Al crear reserva / import canal / pago folio / checkout PMS: template log + notification stub (sin WhatsApp real) |

**Freeze respetado:** hero cards, banner, Personaliza, RESERVAR / WhatsApp, check-in, bottom nav.

---

## Cerrado antes (slice 1)

| Ítem | Qué |
|------|-----|
| Guest UX | `/mi-reserva`, `/confirmacion`, bottom nav, `/ayuda` |
| Check-in digital | `/check-in/[code]` sin docs sensibles |
| Housekeeping móvil | Estados touch en `/admin/aseos` |
| Maintenance → availability | OOS → block motor local |
| Dashboard alertas | Stub operativo |
| Channel import | Simulador → reserva + payment |
| Payments pending | Booking + `/admin/pagos` |
| CRM ficha | `/admin/crm/[guestId]` |

---

## Backlog real (integraciones / producto)

1. **Supabase prod:** migraciones `017`–`028` + smoke staff/booking.
2. **Wompi (o MP/Stripe):** `PaymentProvider` real + webhooks; depositos pending → paid.
3. **WhatsApp Cloud API / Email:** runner → envío real (hoy log + notification stub).
4. **Channel Manager OTA:** ARI push; iCal fallback. Import UI = simulador.
5. **LLM assistant:** cablear key en analytics (sin auto-apply).
6. **Billing SaaS multi-hotel:** onboarding orgs, domain mapping, module_flags.
7. **Typecheck legado:** inventarios/printable/map.
8. **Facturación electrónica (Colombia)** — folio local listo; DIAN/e-factura no.
9. **Check-in digital prod:** persistir en Supabase + notificar staff.
10. **PDF reportes** — omitido (CSV Excel-friendly cubre export).

---

## Cómo probar (este slice)

```bash
npm ci
npm run test
npm run typecheck   # puede fallar por deuda previa en inventarios/printables
npm run lint
npm run dev         # http://127.0.0.1:43127
```

Smoke:

1. `/reservar` → cupón `BIENVENIDA10` en resumen → RESERVAR → confirmación.
2. `/admin/folio` → abrir código → cargo + pago efectivo → saldo 0.
3. `/admin/promociones` → CRUD cupón.
4. `/admin/reportes` → rango fechas → Export CSV (Excel).
5. `/admin/reviews` → filtros sentiment/categoría; link desde `/admin/crm`.
6. Crear reserva o import canal → `GET /api/admin/crm/automations` muestra run.
7. Guest: bottom nav / check-in / Personaliza intactos.

---

## Criterios

- [x] Folio por reserva (cargos/pagos/saldo)
- [x] Cupones seed + validate + wizard
- [x] Reportes filtros + CSV Excel-friendly
- [x] Reviews admin + CRM link
- [x] Automations runner (booking/checkout/pago)
- [x] Docs + tests
- [x] UX website preservada
