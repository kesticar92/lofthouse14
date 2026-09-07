# Fase 0 — Inventario de auditoría

Branch: `cursor/fase0-auditoria-arquitectura-f0b5` · Complemento de [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack y config

| Archivo | Notas |
|---------|-------|
| `package.json` | Next 15.5, React 19, Supabase, RQ, Zod, Vitest; scripts dev `:3001` |
| `next.config.ts` | CSP, image remotePatterns, serverExternalPackages `node-ical` |
| `src/middleware.ts` | Auth gate `/admin`; **no** usa `admin-rate-limit.ts` |
| `src/lib/admin-rate-limit.ts` | Implementado pero **no cableado** |
| `.env.example` | Site, Supabase, cron, Google Drive/Sheets, Sentry |
| `vercel.json` | Crons iCal / cleaning / expense-drive |
| `vitest.config.ts` | Unit tests |
| `.github/workflows/` | `ci.yml`, `deploy.yml`, `scrape-reviews-daily.yml` |
| `supabase/migrations/` | 001–016 (sin 002 en repo) |
| Prisma/Drizzle | **Ausentes** (solo stub Sentry `@prisma/instrumentation`) |

## Rutas públicas

```
/                          landing + GuidedReservation
/reservar                  wizard Personaliza tu experiencia
/lofts                     listado
/lofts/[slug]              ficha SEO
/galeria /resenas /politicas /ubicacion-miraflores-cali
/blog /blog/[slug] /en
/grupos /nomadas-digitales /alojamiento-medico /salsa-cali
/preview-movil
```

## Rutas admin

```
/admin /admin/login /admin/registro
/admin/cotizaciones /admin/inventario /admin/reservas
/admin/gastos /admin/aseos /admin/usuarios
```

## APIs

### Admin
- `api/admin/cotizaciones`, `cotizaciones/[id]`
- `api/admin/inventarios` (+ items/fotos)
- `api/admin/expenses` (+ files, sync sheet, retry drive)
- `api/admin/pms/{properties,reservations,blocks,ical-sources,sync}`
- `api/admin/cleaning-tasks`, `cleaning-summary`
- `api/admin/notifications`, `users`, `staff-directory`
- `api/admin/app-settings/{cleaning,cotizaciones-pricing}`

### Cron / público
- `api/cron/{sync-ical,cleaning-sync,expense-drive-retry}`
- `api/public/reviews`
- `api/ical/[propertyId]`

## Features / lib relevantes

| Path | Dominio |
|------|---------|
| `src/features/cotizaciones/*` | Admin quotes + migrate localStorage |
| `src/features/inventarios/*` | Inventario + fotos |
| `src/features/expenses/*` | Gastos UI |
| `src/features/pms/*` | Reservas admin hooks/UI |
| `src/features/aseos/*` | Housekeeping UI |
| `src/lib/pricing.ts` | Motor tarifas |
| `src/lib/public-stay-quote.ts` | Quote web |
| `src/lib/stay-draft.ts` | sessionStorage embudo |
| `src/lib/configurator-extras.ts` | Extras wizard |
| `src/lib/pms/*` | iCal, overlap, conflicts, cleaning |
| `src/lib/supabase/*` | client/server/service-role/env |
| `src/data/loft-categories.ts` | Vista / Atrio / Cielo |
| `src/data/lofts.ts` | Catálogo SEO estático |
| `src/components/sections/hero*.tsx` | Hero + tickets |
| `src/components/sections/guided-reservation.tsx` | Booking wizard |

## Tablas Supabase (migraciones)

`profiles`, `audit_logs`, `properties`, `reservations`, `availability_blocks`, `ical_sources`, `app_settings`, `cleaning_tasks`, `notifications`, `expenses`, `expense_files`, `cotizaciones`, `inventario_items`, `inventario_revisiones`, `inventario_revision_items`, `inventario_revision_fotos`, `guest_reviews`.

**Faltan en tipos TS generados (al menos):** `guest_reviews` (016).

## Tests existentes

```
src/lib/api/*.test.ts
src/lib/pricing.test.ts
src/lib/cotizaciones-pricing.test.ts
src/lib/site.test.ts
src/lib/logger.test.ts
src/lib/numero-a-letras.test.ts
src/lib/supabase/auth-errors.test.ts
src/lib/expenses/upload-expense-file.test.ts
```

Sin e2e ni tests de overlap/availability públicos.

## Matriz existe / falta (resumen)

| Área | Existe | Falta |
|------|--------|-------|
| Marketing + SEO | ✓ | — |
| Hero / categorías / fechas | ✓ | Sync con DB |
| Wizard → WhatsApp | ✓ | Persistencia reserva + avail |
| Admin módulos | ✓ | Scope multi-tenant |
| PMS + iCal | ✓ parcial | CM OTA, mapping |
| Pricing | ✓ | Rate plans / seasons |
| Multi-tenant | — | Org→Property→RoomType→Room |
| Pagos | — | Todo |
| CRM | — | Todo |
| Pagos / folio | — | Todo |

## Freeze (no destruir en fases siguientes)

Hero cards Vista/Atrio/Cielo, banner fechas, Personaliza tu experiencia, booking wizard, pricing UX, admin local operativo, landings SEO.
