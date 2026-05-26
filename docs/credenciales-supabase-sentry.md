# Credenciales: Supabase, Sentry y formato `.env`

No pegues secretos en chats públicos. Copia los valores en **`.env.local`** (local) o en las **variables de entorno** del hosting (Vercel, etc.).

---

## Supabase (backend multiusuario)

### 1. Proyecto (público, seguro en el cliente con RLS)

| Variable                               | Dónde copiarla en Supabase                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | **Project Settings → API → Project URL**                                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **API Keys → Publishable** (formato `sb_publishable_…`; recomendado en proyectos nuevos). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Alternativa legacy: **Project API keys → `anon` `public`** (JWT `eyJ…`).                  |

En el código se usa la publishable si existe; si no, la anon.

### 2. Solo servidor (nunca `NEXT_PUBLIC_`)

| Variable                    | Dónde copiarla                                       |
| --------------------------- | ---------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → `service_role` `secret`** |

Úsala solo en **Route Handlers / Server Actions / cron** que deban saltarse RLS con criterio muy claro (p. ej. migración o tarea de sistema). El navegador no debe verla.

### 3. Conexión SQL directa (opcional, migraciones Prisma/Drizzle)

Si más adelante usas ORM contra Postgres:

| Variable       | Dónde                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | **Project Settings → Database → Connection string → URI** (modo **Transaction** o **Session** según el proveedor; añade `?sslmode=require` si aplica). |

Formato típico:

```env
DATABASE_URL=postgresql://postgres.[REF]:[TU_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

La contraseña la definiste al crear el proyecto (o la reseteaste en **Database → Database password**).

### 4. Lo que puedes enviar “a quien implemente” (sin valores reales)

Pega solo **nombres de variables** y confirma:

- Región del proyecto (ej. `South America`).
- Si el auth de usuarios del panel será **solo email** o también **magic link / OAuth**.
- URL de producción del sitio (para **Redirect URLs** en **Authentication → URL configuration**).

Con eso se pueden definir RLS, tablas de perfiles/roles, auditoría y políticas sin que me des las claves por el chat.

---

## Sentry (errores y rendimiento)

### Cliente y servidor (DSN)

| Variable                 | Dónde                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | **Sentry → Settings → Projects → [tu proyecto] → Client Keys (DSN)** |

El DSN no es un “password” de tu cuenta, pero identifica el proyecto; suele ir en variables públicas del front.

### Opcional: trazas y sesiones

| Variable                             | Uso                                         |
| ------------------------------------ | ------------------------------------------- |
| `SENTRY_TRACES_SAMPLE_RATE`          | Ej. `0.1` (10 % de transacciones trazadas). |
| `SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | Ej. `0` o `0.1` si activas Session Replay.  |

### Solo CI / subida de source maps (no en runtime del sitio)

| Variable            | Dónde                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `SENTRY_AUTH_TOKEN` | **Settings → Developer Settings → Auth Tokens** (alcance: `project:releases`, `org:read`). |
| `SENTRY_ORG`        | Slug de la org en la URL: `sentry.io/organizations/**aquí**/`.                             |
| `SENTRY_PROJECT`    | Slug del proyecto.                                                                         |

Estas tres suelen configurarse en **GitHub Actions** como secrets, no en `.env.local` del día a día.

### Qué “darme” tú en la práctica

- **Para integrar en código**: `NEXT_PUBLIC_SENTRY_DSN` (la añades tú en Vercel / `.env.local`).
- **Para CI de source maps**: crea secrets `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` en el repositorio; no hace falta pegarlos en un mensaje.

---

## Resumen `.env.example` (placeholders)

Ver el archivo **`.env.example`** en la raíz del repo: ahí van listadas las mismas claves con valores ficticios.
