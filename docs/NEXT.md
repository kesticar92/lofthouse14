# Post-Fases 11 — backlog real (integraciones + plataforma)

> Branch tip: `cursor/continuar-plataforma-f0b5`  
> Base avanzada: `cursor/integraciones-backlog-f0b5` (Wompi, messaging, canales, LLM, e-factura, SaaS).  
> Cómo activar providers: [`INTEGRATIONS.md`](./INTEGRATIONS.md) · Migraciones: [`MIGRATIONS.md`](./MIGRATIONS.md).

## Cerrado en esta pasada (continuar plataforma)

| Ítem | Qué |
|------|-----|
| Guest portal endurecido | `/mi-reserva` valida código + loading/error; `/confirmacion/[code]` skeleton/reintento; pago mock guest; factura borrador; FX display stub |
| Walk-in + grupos | `POST /api/admin/booking/walk-in`; multi-unidad (`lofts`→`property_ids`) en motor local; UI en `/admin/reservas` |
| Larga estadía 7/14/30 | `quote()` + config `descuentoQuincenal`; umbral mensual 30; tests |
| Inventario + compras | Stock seed, movimientos, low-stock → `local-notifications`; PO draft; UI en `/admin/inventario` |
| Revenue recommendations | Heurísticas ocupación enriquecidas (bandas, impactHint); UI analytics |
| i18n foundation | Diccionario ES/EN (`src/lib/i18n/dictionary.ts`) en bottom nav + CTAs guest |
| Multimoneda | COP base + USD/EUR stub ECB-like + disclaimer; `GET /api/public/fx` |
| E2E smoke | `npm run smoke:booking` → booking → confirmación → pay mock → fx |

**Freeze respetado:** hero cards, banner, Personaliza, RESERVAR / WhatsApp, check-in, bottom nav.

---

## Cerrado antes (integraciones backlog)

| Ítem | Qué |
|------|-----|
| Supabase / migraciones | `docs/MIGRATIONS.md` + `npm run migrations:verify` (017–028) |
| Check-in digital | Persistencia API + notificación staff stub |
| Payments Wompi-first | Adapter + webhook idempotente + simular admin |
| WhatsApp / Email | Providers + automation runner |
| Channel Manager | syncAvailability/Rates stubs + iCal |
| LLM analytics | stub sin auto-apply |
| E-factura CO | borrador desde folio |
| SaaS foundations | module_flags read-only |

---

## Requiere secrets reales (no inventados)

1. Wompi live checkout + webhooks firmados
2. WhatsApp Cloud API / Resend envío real
3. Credenciales partner OTA (ARI push real)
4. OpenAI (u otro LLM) para respuestas live
5. Proveedor autorizado DIAN / e-factura
6. FX provider real (ECB / Open Exchange) — hoy stub
7. Billing SaaS (suscripción) — solo foundations
8. Persistencia multi-room / walk-in en Supabase (hoy local)

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

1. Booking → `/confirmacion/LH-…` → Simular pago (mock) → check-in.
2. `/admin/reservas` → Walk-in / grupo (2 lofts).
3. Cotización 7/14/30 noches → descuentos.
4. `/admin/inventario` → Stock: movimiento → low stock notify; PO draft.
5. `/admin/analytics` → recomendaciones con banda ocupación.
6. `GET /api/public/fx?amount_cop=410000` → disclaimer stub.
7. Guest UX (cards / Personaliza / bottom nav) intacta.

---

## Criterios

- [x] Guest portal + pay mock + invoice draft + loading/error
- [x] Walk-in + multi-unidad local
- [x] Larga estadía 7/14/30 + tests
- [x] Stock movimientos + low stock notify + PO
- [x] Revenue recommendations enriquecidas
- [x] i18n ES/EN foundation
- [x] Multimoneda stub + disclaimer
- [x] Smoke booking script
- [x] UX website preservada
