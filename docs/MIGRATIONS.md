# Migraciones Supabase (017–028)

Orden obligatorio para multi-tenant + PMS + canales + CRM + pagos + SaaS flags.

## Verificar orden localmente

```bash
npm run migrations:verify
```

El script lista `supabase/migrations/017_*.sql` … `028_*.sql` y falla si falta alguno o el prefijo no es secuencial.

## Aplicar en un proyecto Supabase

1. Backup de la base.
2. Confirmar que `001`–`016` ya están aplicadas (legacy PMS).
3. Aplicar en orden:

| Archivo | Contenido |
|---------|-----------|
| `017_organizations_multitenant.sql` | organizations, org_members |
| `018_organization_id_core.sql` | organization_id en tablas core |
| `019_org_properties_rooms_catalog.sql` | catálogo rooms / room_types |
| `020_catalog_bridge_properties_rooms.sql` | bridge properties↔rooms |
| `021_availability_holds.sql` | holds de disponibilidad |
| `022_booking_engine.sql` | booking engine |
| `023_rate_plans.sql` | rate plans |
| `024_channel_manager.sql` | channel_connections / sync logs |
| `025_ops_housekeeping_maintenance.sql` | ops |
| `026_crm_messaging.sql` | CRM messaging |
| `027_payments.sql` | payments |
| `028_module_flags_saas.sql` | module_flags / branding |

CLI (si usas Supabase CLI vinculado al proyecto):

```bash
supabase db push
# o: psql "$DATABASE_URL" -f supabase/migrations/017_....sql  # uno a uno
```

## Smoke post-migración (sin depender de prod)

Con env local / staging (service role opcional):

```bash
npm run test
# tests: tenant/organization, booking/create-reservation, payments, channels
```

Manual:

1. `GET /api/public/availability?check_in=…&check_out=…`
2. `POST /api/public/booking` → código `LH-…`
3. `/admin/catalogo` con staff autenticado
4. Confirmar `organizations.module_flags` (migración 028)

## Sin credenciales

La app opera en **modo local/mock** (stores en memoria) para booking, pagos, check-in, folio y canales. Las migraciones solo son necesarias para persistencia Supabase en staging/prod.
