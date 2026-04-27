# LOFTHOUSE 14 — sitio web

Sitio de marketing y panel interno para **LOFTHOUSE 14** (lofts en Miraflores, Cali). Stack: **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind CSS**.

## Requisitos

- Node.js 20 o 22 (recomendado 22, como en CI)
- npm

## Puesta en marcha

```bash
npm ci
cp .env.example .env.local
# Edita .env.local con tus valores (obligatorio en producción para el panel).
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El panel admin está en `/admin`.

## Scripts

| Comando                | Descripción               |
| ---------------------- | ------------------------- |
| `npm run dev`          | Servidor de desarrollo    |
| `npm run build`        | Compilación de producción |
| `npm run start`        | Sirve el build            |
| `npm run lint`         | ESLint (Next)             |
| `npm run test`         | Vitest (tests unitarios)  |
| `npm run format`       | Formatea con Prettier     |
| `npm run format:check` | Comprueba formato (CI)    |

## Variables de entorno

Copia `.env.example` a `.env.local`. Las claves públicas del sitio usan el prefijo `NEXT_PUBLIC_`.

Guías:

- Credenciales **Supabase** y **Sentry**: [`docs/credenciales-supabase-sentry.md`](docs/credenciales-supabase-sentry.md).
- **Sentry MCP** en Cursor: [`docs/mcp-sentry-cursor.md`](docs/mcp-sentry-cursor.md).

### Panel `/admin` (Supabase Auth)

- `NEXT_PUBLIC_SUPABASE_URL` y clave pública: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- La sesión es la de **Supabase Auth** (cookies gestionadas con `@supabase/ssr`); el **middleware** refresca la sesión y exige rol `staff`, `admin` o `super_admin` en la tabla `public.profiles`.

**Primera vez en Supabase**

1. En **Authentication → Providers**, activa **Email** y crea usuarios del staff (o habilita registro solo si lo controlas).
2. En **SQL Editor**, ejecuta el script [`supabase/migrations/001_profiles_audit.sql`](supabase/migrations/001_profiles_audit.sql) (perfiles, auditoría, RLS, trigger al crear usuario).
3. Promueve al menos un **super admin** (sustituye el correo):

   ```sql
   update public.profiles
   set role = 'super_admin'
   where email = 'tu-correo@dominio.com';
   ```

Los datos operativos (cotizaciones, inventario, aseos) siguen en **localStorage** con respaldo JSON hasta que se migren a tablas Supabase.

### Modelo de amenaza (resumen)

El panel es para **staff de confianza**. RLS en Supabase limita quién lee/escribe datos; el **super admin** es quien puede ver auditoría y editar roles. Para cuentas muy sensibles, valorar **2FA** (Supabase u otro) y políticas de contraseña en el dashboard.

## CI (GitHub Actions)

El flujo de CI está en [`docs/github-ci-workflow.yml`](docs/github-ci-workflow.yml). Cópialo a `.github/workflows/ci.yml` en el repo (o créalo desde la UI de GitHub) cuando tu token o integración tenga permiso **`workflow`**; algunos clientes OAuth rechazan subir workflows sin ese alcance.

En `package.json`, el campo **`overrides`** fija `postcss` ≥ 8.5.10 para alinear la dependencia transitiva de Next con el aviso de seguridad de PostCSS (sin usar `npm audit fix --force`).

## Estructura relevante

- `src/app/` — rutas y layout
- `src/components/sections/` — bloques de la landing
- `src/app/admin/` — panel (login + módulos)
- `src/lib/` — configuración del sitio, precios, almacenamiento local, auth de servidor

## Licencia

Privado — uso interno del proyecto LOFTHOUSE 14.
