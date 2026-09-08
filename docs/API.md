# API surface (Fases 3–11)

## Público

| Método | Ruta | Auth | Notas |
|--------|------|------|-------|
| GET | `/api/public/availability` | no | Availability unificada |
| POST | `/api/public/booking` | no | Crea reserva + anti overbooking |
| GET | `/api/public/booking/[code]` | no | Lookup por código |
| GET | `/api/public/reviews` | no | Existente |

## Admin (staff + módulo)

| Método | Ruta | Módulo |
|--------|------|--------|
| GET | `/api/admin/availability` | reservas |
| GET | `/api/admin/pms/metrics` | reservas |
| * | `/api/admin/pms/*` | reservas (existente) |
| * | `/api/admin/channels*` | canales |
| * | `/api/admin/maintenance` | aseos |
| * | `/api/admin/crm/*` | crm |
| * | `/api/admin/payments` | pagos |
| GET | `/api/admin/analytics` | analytics |

## Webhooks

| Ruta | Stub |
|------|------|
| `/api/webhooks/channels/[channel]` | OTA |
| `/api/webhooks/payments/[provider]` | Pagos |

Ver implementación en `src/lib/channels` y `src/lib/payments`.
