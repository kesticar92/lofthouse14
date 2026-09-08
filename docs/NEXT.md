# Post-Fases 11 — backlog real y hardening

> Branch tip: `cursor/next-backlog-slice-f0b5`  
> Base: hardening (`cursor/post-fases-hardening-f0b5`) + Fases 0–11.  
> Detalle histórico: [`FASES-3-11.md`](./FASES-3-11.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Cerrado en esta pasada (next backlog slice)

| Ítem | Qué |
|------|-----|
| Guest UX | `/mi-reserva` + `/confirmacion` con estados, resumen precio, CTAs WhatsApp/ayuda; bottom nav móvil (Reservar / Mi reserva / Ayuda); `/ayuda` |
| Check-in digital | `/check-in/[code]` (datos → términos → ETA) + persistencia localStorage/memoria; **sin docs sensibles** |
| Housekeeping móvil | Botones de estado touch en `/admin/aseos` (lista + cambiar estado) |
| Maintenance → availability | Ticket admin con unidad + fechas + OUT_OF_SERVICE → block en motor local |
| Dashboard alertas | Cards métricas existentes + alertas stub (mantenimiento / pagos / llegadas + notificaciones si hay) |
| Channel stub | «Import reservation» en `/admin/canales` → reserva + payment en store local |
| Payments stub | Payment pending al booking; saldo en `/admin/pagos` |
| CRM ficha | `/admin/crm/[guestId]` + link «Abrir ficha» / CRM desde panel reservas |

**Freeze respetado:** hero cards, banner, Personaliza, RESERVAR / WhatsApp no se borraron.

---

## Cerrado antes (hardening)

| Ítem | Qué |
|------|-----|
| PMS calendario | Estados visuales, panel check-in/out, `block_type`, filas OOS |
| Booking | Holds, cancelled filtrado, preflight availability, fallback WA |
| Rate limit | Admin + público + tests |
| Admin UX | Loading / empty / error en canales, CRM, pagos, analytics, mantenimiento |

---

## Backlog real (integraciones / producto)

Orden sugerido por valor operativo (no es calendario):

1. **Supabase prod:** aplicar migraciones `017`–`028` en el proyecto real y smoke staff + booking.
2. **Wompi (o MP/Stripe):** implementar `PaymentProvider` real + webhooks firmados; depositos en booking `pending` → `paid`.
3. **WhatsApp Cloud API / Email:** CRM templates → envío real (hoy stub + WA deep-link).
4. **Channel Manager OTA:** Airbnb/Booking/Expedia API (ARI push); iCal queda como fallback. El import UI es solo simulador.
5. **LLM assistant:** cablear `OPENAI_API_KEY` / `LLM_API_KEY` en analytics (sin auto-apply de precios).
6. **Billing SaaS multi-hotel:** onboarding orgs, domain mapping, module_flags de pago.
7. **Typecheck legado:** errores preexistentes en inventarios/printable/map (fuera del alcance).
8. **Folio / facturación electrónica** (Colombia) — no iniciado.
9. **Check-in digital prod:** persistir en Supabase (tabla dedicada) + notificar staff; sigue sin almacenar docs ID.

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

1. `/reservar` → RESERVAR → `/confirmacion/LH-…` → Check-in digital → `/check-in/LH-…`.
2. Bottom nav móvil: Reservar / Mi reserva / Ayuda.
3. `/admin/canales` → **Import reservation** → código LH en `/mi-reserva` + saldo en `/admin/pagos`.
4. `/admin/mantenimiento` → ticket con bloqueo → availability excluye unidad en fechas.
5. `/admin/aseos` (viewport móvil) → botones Pend./Curso/Hecho.
6. `/admin` → bloque Alertas operativas.
7. `/admin/crm` → Abrir ficha.

---

## Criterios

- [x] Guest: estados + precio + WA/ayuda + check-in digital mínimo
- [x] Bottom nav guest móvil
- [x] HK móvil usable (cambiar estado)
- [x] Maintenance OOS → availability
- [x] Dashboard alertas stub
- [x] Channel import reservation (local)
- [x] Payment pending al booking + UI saldo
- [x] CRM ficha desde reserva/listado
- [x] Docs actualizados
