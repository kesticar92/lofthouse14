# Fase 1 — Foundations multi-tenant

> Branch: `cursor/fase1-foundations-multitenant-f0b5`  
> Base: tip con website UX (cards Vista/Atrio/Cielo, banner fechas, Personaliza tu experiencia) + docs Fase 0.  
> **Fase 2 queda pendiente de OK explícito.**

Complementa [`ARCHITECTURE.md`](./ARCHITECTURE.md) §10.

## Qué se construyó

### Schema / migraciones

| Archivo | Contenido |
|---------|-----------|
| `supabase/migrations/017_organizations_multitenant.sql` | `organizations`, `org_members`, enum `org_member_role`, helpers RLS (`is_org_member`, `user_org_ids`, `is_org_admin`), seed org **LOFTHOUSE**, backfill memberships desde `profiles` |
| `supabase/migrations/018_organization_id_core.sql` | `organization_id` NOT NULL en tablas core + RLS por tenant; `app_settings` PK `(organization_id, key)`; patch `regenerate_cleaning_tasks_for_reservation` |
| `supabase/migrations/019_org_properties_rooms_catalog.sql` | Catálogo SaaS: `org_properties` (edificio), `room_types` (Vista/Atrio/Cielo), `rooms` (LOFT 01–14) con `legacy_property_id` → `properties` PMS |

### Seed fijo (UUIDs)

| Entidad | UUID / slug |
|---------|-------------|
| Organization LOFTHOUSE | `11111111-1111-4111-8111-111111111111` / `lofthouse` |
| Property LOFTHOUSE 14 | `22222222-2222-4222-8222-222222222222` / `lofthouse-14` |
| Room types | `…3301` vista, `…3302` atrio, `…3303` cielo |
| Rooms | `LOFT 01`–`LOFT 14` (04 = storage/bodega) |

### Roles

- **Plataforma** (`profiles.role`, sin cambio de contrato): `super_admin` \| `admin` \| `staff` — sigue siendo el gate del panel y de `isStaffRole`.
- **Org** (`org_members.role`): `org_admin` \| `property_admin` \| `staff`.
- Mapeo seed: `super_admin`→`org_admin`, `admin`→`property_admin`, `staff`→`staff`.
- Sin Supabase configurado, el middleware sigue redirigiendo a `/admin/login` (evaluación local no rota).

### Código app

- `src/lib/tenant/constants.ts` — UUIDs / slugs seed.
- `src/lib/tenant/organization.ts` — resolución de org activa + `enforceOrganizationId`.
- `requireStaff()` ahora expone `organizationId` + `orgRole`.
- APIs PMS / gastos / cotizaciones / inventario / aseos / app_settings: filtro e inserts con `organization_id`.
- **Nuevo:** `GET /api/admin/catalog` — `org_properties` + `room_types` + `rooms` del tenant.
- `GET/PATCH /api/admin/pms/properties` filtrado por org (unidades PMS legacy).
- Tipos: `src/types/database.types.ts` actualizado (incl. `guest_reviews`).

### Qué NO se tocó (freeze)

Hero cards, banner fechas, wizard «Personaliza tu experiencia», landings SEO, Prisma, booking engine, pagos, CM OTA.

## Cómo aplicar migraciones / seed

En **Supabase → SQL Editor**, ejecutar en orden (todo el archivo cada vez):

1. `017_organizations_multitenant.sql`
2. `018_organization_id_core.sql`
3. `019_org_properties_rooms_catalog.sql`

Idempotentes en lo razonable (seed `ON CONFLICT`, `ADD COLUMN IF NOT EXISTS`).

Si usas CLI local:

```bash
# con proyecto linkeado
npx supabase db push
# o pegar los SQL en el dashboard
```

Tras migrar, regenerar tipos si tienes acceso CLI/MCP:

```bash
supabase gen types typescript --project-id <ref> --schema public > src/types/database.types.ts
```

## Variables de entorno nuevas

Ver [`.env.example`](../.env.example):

```bash
# Opcionales — default seed LOFTHOUSE
DEFAULT_ORGANIZATION_SLUG=lofthouse
# DEFAULT_ORGANIZATION_ID=11111111-1111-4111-8111-111111111111
```

Sin secretos nuevos. El resto de Supabase/cron igual.

## Cómo probar

```bash
npm ci
npm run typecheck
npm run test
npm run lint
```

Smoke manual (con Supabase migrado):

1. Login staff → `requireStaff` debe resolver org LOFTHOUSE.
2. `GET /api/admin/pms/properties` → solo unidades de esa org.
3. `GET /api/admin/catalog` → 1 property, 3 room types, 14 rooms.
4. Staff sin fila en `org_members` → 403 `FORBIDDEN_NO_ORG` en writes/listados scoped (RLS vacía datos).
5. Website `/` y `/reservar` sin cambios visuales.

## Qué falta (Fase 2+)

- Renombrar/migrar `properties` PMS → `rooms` canónico (hoy coexisten vía `legacy_property_id`).
- UI admin de catálogo / switcher multi-org.
- Scope org en **todos** los listados restantes (notificaciones UI, sync reviews script, etc.) de forma exhaustiva.
- Tests de integración RLS.
- Booking engine / availability pública (Fase 3–4).

## Criterios Fase 1

- [x] Org seed + filas core con `organization_id`
- [x] RLS `is_org_member`
- [x] Room types / rooms foundation + seed
- [x] APIs properties/catalog filtradas por org
- [x] Docs + `.env.example`
- [ ] Smoke en proyecto Supabase real (aplicar SQL en dashboard)
