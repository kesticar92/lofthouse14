# Post-Fases 11 — backlog real y hardening

> Branch tip: `cursor/post-fases-hardening-f0b5`  
> Base: Fases 0–11 (`cursor/fase3-a-11-plataforma-f0b5`).  
> Detalle histórico: [`FASES-3-11.md`](./FASES-3-11.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Cerrado en esta pasada (hardening)

| Ítem | Qué |
|------|-----|
| PMS calendario | Estados visuales (pending / checked_in / checked_out), panel check-in/out del día, `block_type` en bloqueos, filas `out_of_service`/`maintenance` marcadas |
| Booking | Holds en create (Supabase), filtro cancelled, preflight availability en wizard RESERVAR, fallback WA intacto |
| Rate limit | Admin + público (`/api/public/booking`, `/availability`); tests unitarios |
| Admin UX | Loading / empty / error en canales, CRM, pagos, analytics, mantenimiento |
| Docs / env | Este archivo, FASES actualizado, `.env.example` + README |

**Freeze respetado:** hero cards, banner, Personaliza, RESERVAR / WhatsApp no se borraron.

---

## Backlog real (integraciones / producto)

Orden sugerido por valor operativo (no es calendario):

1. **Supabase prod:** aplicar migraciones `017`–`028` en el proyecto real y smoke staff + booking.
2. **Wompi (o MP/Stripe):** implementar `PaymentProvider` real + webhooks firmados; depositos en booking `pending` → `paid`.
3. **WhatsApp Cloud API / Email:** CRM templates → envío real (hoy stub + WA deep-link).
4. **Channel Manager OTA:** Airbnb/Booking/Expedia API (ARI push); iCal queda como fallback.
5. **LLM assistant:** cablear `OPENAI_API_KEY` / `LLM_API_KEY` en analytics (sin auto-apply de precios).
6. **Billing SaaS multi-hotel:** onboarding orgs, domain mapping, module_flags de pago.
7. **Typecheck legado:** errores preexistentes en inventarios/printable/map (fuera del alcance post-11).
8. **Folio / facturación electrónica** (Colombia) — no iniciado.

---

## Cómo probar (hardening)

```bash
npm ci
npm run test
npm run typecheck   # puede fallar por deuda previa en inventarios/printables
npm run lint
npm run dev         # http://127.0.0.1:43127
```

Smoke:

1. `/reservar` → RESERVAR → `/confirmacion/LH-…` (modo local sin Supabase).
2. `GET /api/public/availability?check_in=2026-11-01&check_out=2026-11-03&category=vista`
3. `/admin/reservas` → bloqueo con tipo «Fuera de servicio»; panel check-in si hay estancia hoy.
4. `/admin/canales|crm|pagos|analytics|mantenimiento` → estados loading/empty.
5. Rate limit: `PUBLIC_API_RATE_LIMIT_PER_MINUTE=2` y martillar availability → 429.

---

## Criterios

- [x] PMS refleja estados / bloqueos / OOS en UI
- [x] Booking estable con/sin Supabase
- [x] Admin nuevas páginas navegables con async states
- [x] Rate limit admin + público cableado + tests
- [x] Docs post-11
