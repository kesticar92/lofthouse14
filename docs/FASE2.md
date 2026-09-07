# Fase 2 — Catálogo RoomType / Room

> Branch: `cursor/fase2-catalogo-pms-f0b5`  
> Base: tip Fase 1 (`cursor/fase1-foundations-multitenant-f0b5`) que ya incluye UX website + docs Fase 0.  
> **Fase 3 (disponibilidad unificada) queda pendiente de OK explícito.**

Complementa [`ARCHITECTURE.md`](./ARCHITECTURE.md) §9–10.

## Qué se construyó

### Schema / migraciones

| Archivo | Contenido |
|---------|-----------|
| `supabase/migrations/020_catalog_bridge_properties_rooms.sql` | Bridge bidireccional: `properties.room_id` → `rooms`; backfill `legacy_property_id`; vista `v_catalog_rooms` |

No se renombra ni elimina `public.properties` (sigue siendo la unidad PMS). Dual-read hasta endurecer PMS.

### Código app

- `src/lib/catalog/seed.ts` — seed canónico LOFTHOUSE 14 / Vista·Atrio·Cielo / LOFT 01–14 (fuente única para marketing + admin local).
- `src/lib/catalog/schema.ts` — Zod PATCH + helpers.
- `src/data/loft-categories.ts` — `loftNumbers` / max guests derivados del seed (sin romper website).
- `GET/PATCH /api/admin/catalog` — listado + edición room_types/rooms; fallback seed si faltan tablas/org.
- `GET/POST /api/admin/organizations` — listado memberships + cookie switcher `lh_active_org`.
- `requireStaff` honra cookie de org activa (si hay membership).
- UI `/admin/catalogo` + nav + `OrgSwitcher` en shell.
- Módulo admin `catalogo` en `admin-modules` (ruta `/admin/catalogo`).
- Tipos: `properties.room_id` en `database.types.ts`.

### Qué NO se tocó (freeze)

Hero cards, banner fechas, wizard «Personaliza tu experiencia», landings SEO, Prisma, booking engine, pagos, Channel Manager OTA.

## Cómo aplicar migraciones

En **Supabase → SQL Editor**, tras 017–019:

1. `020_catalog_bridge_properties_rooms.sql`

```bash
npx supabase db push
# o pegar el SQL en el dashboard
```

## Cómo probar

```bash
npm ci
npm run typecheck
npm run test
npm run lint
```

Smoke (con Supabase migrado 017–020):

1. Login staff → header muestra org LOFTHOUSE.
2. `/admin/catalogo` → 1 property, 3 room types, 14 rooms.
3. `PATCH /api/admin/catalog` (admin) actualiza tagline / status.
4. `GET /api/admin/catalog` sin migrar → seed read-only.
5. Website `/` y `/reservar` sin cambios visuales (mismas categorías).

## Qué falta (Fase 3+)

- Disponibilidad unificada / holds (Fase 3).
- Booking engine directo (Fase 4).
- Usar `room_id` en writes PMS (reservas/bloques) en lugar de solo `properties.id`.
- Tests de integración RLS end-to-end.

## Criterios Fase 2

- [x] Catálogo admin UI (property + room types + rooms)
- [x] APIs GET/PATCH catalog
- [x] Bridge properties ↔ rooms (migración 020)
- [x] Marketing categories alineadas al seed
- [x] Switcher de organización (cookie)
- [x] Docs + tests unitarios críticos
- [ ] Smoke en proyecto Supabase real
