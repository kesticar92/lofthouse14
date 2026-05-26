# Arquitectura lofthouse14

## Capas

| Capa | Ruta | Responsabilidad |
|------|------|-----------------|
| App pública | `src/app/page.tsx`, `politicas`, `preview-movil` | Sitio marketing, SEO |
| Admin | `src/app/admin/*` | Panel operativo (client components + React Query) |
| API servidor | `src/app/api/admin/*`, `api/cron/*`, `api/ical/*` | Auth staff, validación Zod, Supabase |
| Lib cliente | `src/lib/supabase/client.ts`, `storage.ts`, `auth-client.ts` | Browser + preferencias locales |
| Lib servidor | `src/lib/supabase/server.ts`, `service-role.ts`, `env.ts` | RSC, cookies, secretos |
| Features | `src/features/{cotizaciones,inventarios,expenses,pms,aseos}` | Dominio por módulo |
| Services | `src/services/*` | Facades cliente → API remota |
| Components | `src/components/` | UI compartida |
| Hooks | `src/hooks/` | Permisos admin, PMS |
| Types | `src/types/database.types.ts` | Esquema Supabase |

## Auth y roles

- Sesión: Supabase Auth + `@supabase/ssr` (cookies).
- Middleware (`src/middleware.ts`): refresca sesión, protege `/admin`, rate limit en `/api/admin`.
- Roles: `staff`, `admin`, `super_admin` en `public.profiles`.
- Staff: `allowed_modules` restringe rutas; usuarios solo `admin`/`super_admin`.

## Persistencia

- **Supabase (Postgres + RLS):** perfiles, PMS, gastos, aseos, cotizaciones, inventario, `app_settings`.
- **localStorage:** solo legacy/migración y export JSON desde dashboard; tarifas de cotización en `app_settings.cotizaciones_pricing`.

## Despliegue

- Producción: Droplet + Nginx + PM2 (`docs/DEPLOY.md`).
- CI: `.github/workflows/ci.yml` (lint, typecheck, test, build).
- CD opcional: `.github/workflows/deploy.yml` con secrets `DROPLET_HOST`, `DROPLET_SSH_KEY` en environment `production`.
