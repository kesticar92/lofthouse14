# Arquitectura — Lofthouse 14 → plataforma hotelera multi-tenant

> **Fase 0 — Auditoría (documentación).** Completada.  
> **Fase 1 — Foundations multi-tenant:** implementada en branch `cursor/fase1-foundations-multitenant-f0b5`. Detalle: [`docs/FASE1.md`](./FASE1.md).  
> **Fase 2 — Catálogo RoomType/Room:** implementada en branch `cursor/fase2-catalogo-pms-f0b5`. Detalle: [`docs/FASE2.md`](./FASE2.md).  
> Fecha auditoría: 2026-09-07 · Branch Fase 0: `cursor/fase0-auditoria-arquitectura-f0b5`  
> Este documento **reutiliza** el avance existente (website, hero cards Vista/Atrio/Cielo, banner de fechas, Personaliza tu experiencia, booking wizard, admin, pricing, PMS parcial). **No** justifica reescribir ni borrar ese trabajo.

Inventario detallado de rutas/archivos: [`docs/FASE0-AUDIT.md`](./FASE0-AUDIT.md).

---

## 1. Arquitectura actual

### 1.1 Stack

| Capa | Tecnología |
|------|------------|
| App | **Next.js 15** (App Router), **React 19**, **TypeScript** |
| UI | Tailwind CSS 3, Framer Motion, Radix Slot, Phosphor/Lucide |
| Datos cliente | TanStack React Query 5 |
| Auth + DB | **Supabase** (Auth + Postgres + RLS + Storage) vía `@supabase/ssr` / `@supabase/supabase-js` |
| Validación | Zod 4 |
| Integraciones | Google APIs (Drive/Sheets gastos), `node-ical` (sync OTA), Sentry opcional, GA/Meta/Clarity/Hotjar |
| Tests | Vitest (unitarios en `src/lib/**`) |
| Deploy | Droplet + Nginx + PM2 (`docs/DEPLOY.md`); crons también en `vercel.json` |
| ORM | **Ninguno** (sin Prisma/Drizzle). Acceso SQL vía cliente Supabase + migraciones SQL en `supabase/migrations/` |

Paquete: `lofthouse14-web` (`package.json`). Dev por defecto en puerto **3001**.

### 1.2 Capas de código

| Capa | Ubicación | Rol |
|------|-----------|-----|
| App pública | `src/app/*` (excepto `admin`, `api`) | Marketing SEO + embudo reserva |
| Admin UI | `src/app/admin/*` | Panel operativo (client components) |
| API | `src/app/api/admin/*`, `api/cron/*`, `api/ical/*`, `api/public/*` | Auth staff, Zod, service role donde aplica |
| Features | `src/features/{cotizaciones,inventarios,expenses,pms,aseos}` | Dominio admin |
| Lib | `src/lib/*` | Pricing, PMS, Supabase, auth API, site config |
| Data estática | `src/data/*` | Lofts, categorías, FAQ, blog, landings, reviews fallback |
| Components | `src/components/{sections,layout,admin,ui,…}` | UI compartida + hero/booking |
| Types | `src/types/database.types.ts` | Tipos Supabase (parcialmente desactualizados) |
| Middleware | `src/middleware.ts` | Sesión Supabase + gate `/admin` |

### 1.3 Rutas públicas (marketing + booking)

| Ruta | Propósito |
|------|-----------|
| `/` | Landing: hero (vídeos + cards Vista/Atrio/Cielo), galería, lofts, reseñas, **GuidedReservation**, ubicación, FAQ |
| `/reservar` | Wizard a pantalla completa «Personaliza tu experiencia» |
| `/lofts`, `/lofts/[slug]` | Catálogo SEO por unidad |
| `/galeria`, `/resenas`, `/ubicacion-miraflores-cali`, `/politicas` | Contenido |
| `/blog`, `/blog/[slug]`, `/en` | Contenido / idioma |
| `/grupos`, `/nomadas-digitales`, `/alojamiento-medico`, `/salsa-cali` | Landings de audiencia |
| `/preview-movil` | Preview UX |

Flujo de reserva actual: **fechas/categoría en hero** → `sessionStorage` (`stay-draft`) → configurador (extras) → cotización cliente (`public-stay-quote` / `pricing`) → **WhatsApp** (sin checkout online ni reserva en DB pública).

### 1.4 Rutas admin

| Ruta | Módulo |
|------|--------|
| `/admin`, `/admin/login`, `/admin/registro` | Shell / auth |
| `/admin/cotizaciones` | Cotizaciones + tarifas |
| `/admin/inventario` | Inventario / revisiones / fotos |
| `/admin/reservas` | PMS (calendario, iCal, bloqueos) |
| `/admin/gastos` | Gastos + Drive/Sheets |
| `/admin/aseos` | Housekeeping desde reservas |
| `/admin/catalogo` | Catálogo Property / RoomType / Room (Fase 2) |
| `/admin/usuarios` | Roles / módulos (admin+) |

Claves de módulo: `cotizaciones | inventario | reservas | gastos | aseos | catalogo | usuarios` (`src/lib/api/admin-modules.ts`).

### 1.5 APIs

**Admin (staff):**  
`/api/admin/cotizaciones`, `inventarios`, `expenses`, `cleaning-tasks`, `cleaning-summary`, `notifications`, `users`, `staff-directory`, `app-settings/{cleaning,cotizaciones-pricing}`, `catalog`, `organizations`, `pms/{properties,reservations,blocks,ical-sources,sync}`.

**Cron (Bearer `CRON_SECRET`):**  
`sync-ical`, `cleaning-sync`, `expense-drive-retry`.

**Público:**  
`/api/public/reviews`, `/api/ical/[propertyId]` (export iCal por token de propiedad).

### 1.6 Auth

- Supabase Auth + cookies (`@supabase/ssr`).
- Middleware refresca sesión; protege `/admin` (excepto login); exige rol staff en `profiles`.
- Roles: `super_admin | admin | staff` + `status` (`pending|active|suspended`) + `allowed_modules[]`.
- APIs: `requireStaff()` / `enforceStaffModule()` (`src/lib/api/require-staff.ts`).
- Service role para crons, sync y operaciones privilegiadas (`service-role.ts`).

### 1.7 Base de datos (Supabase)

Migraciones en `supabase/migrations/` (001–016). Tablas principales:

| Tabla | Dominio |
|-------|---------|
| `profiles`, `audit_logs` | Auth / auditoría |
| `organizations`, `org_members` | Multi-tenant (Fase 1) |
| `org_properties`, `room_types`, `rooms` | Catálogo edificio / tipos / unidades (Fase 1–2; bridge `legacy_property_id` ↔ `properties.room_id`) |
| `properties`, `reservations`, `availability_blocks`, `ical_sources` | PMS + iCal (units legacy + `organization_id`; dual-read con rooms) |
| `cleaning_tasks`, `notifications`, `app_settings` | Aseos / config (scoped por org) |
| `expenses`, `expense_files` | Gastos + Storage/Drive |
| `cotizaciones` | Cotizaciones admin |
| `inventario_*` | Inventario + revisiones + fotos |
| `guest_reviews` | Reseñas scrapadas (migración 016 + org opcional) |

Migraciones: `001`–`016` legacy + **`017`–`019` Fase 1** + **`020` Fase 2**. Ver [`docs/FASE1.md`](./FASE1.md) y [`docs/FASE2.md`](./FASE2.md).

**Nota:** `properties` sigue siendo el inventario PMS por loft; el edificio canónico es `org_properties`. Fase 2 añadió bridge bidireccional (`rooms.legacy_property_id` ↔ `properties.room_id`) sin rename destructivo.

### 1.8 Ya existe vs falta (prompt maestro SaaS)

| Capacidad | Estado |
|-----------|--------|
| Website / SEO / landings | **Existe** y es maduro |
| Hero cards + banner fechas + stay draft | **Existe** |
| Booking wizard + extras + quote → WhatsApp | **Existe** (lead, no booking engine) |
| Pricing motor (Excel-parity) | **Existe** (`pricing.ts`, admin settings) |
| Admin multi-módulo + permisos | **Existe** |
| PMS reservas / bloqueos / calendario | **Parcial** |
| Channel: iCal import/export Airbnb | **Parcial** (no CM bidireccional API) |
| Housekeeping (aseos) | **Parcial** (ligado a reservas) |
| Gastos + Drive/Sheets | **Parcial** (credenciales prod pendientes) |
| Inventario operativo | **Parcial** |
| Cotizaciones staff | **Existe** |
| Reseñas sync | **Parcial** |
| Multi-tenant Organization→Property→RoomType→Room | **Parcial** (Fase 1–2: schema + admin catálogo; PMS aún dual-read) |
| Booking engine con hold/confirmación en DB | **No existe** |
| Pagos (pasarela / depositos) | **No existe** |
| Channel manager (Booking/Expedia API, mapping, ARI) | **No existe** |
| CRM huéspedes / lifecycle | **No existe** |
| Rate plans / seasons / yield | **No** (tarifas planas L-J / V-D) |
| Folio / facturación electrónica | **No existe** |
| App huésped / portal | **No existe** |

---

## 2. Arquitectura propuesta (multi-tenant modular)

Objetivo: evolucionar el monorepo actual hacia SaaS hotelero **sin reescribir** el sitio Lofthouse 14. El tenant inicial es la organización Lofthouse; el website actual queda como **skin / canal directo** de esa organización.

```
Organization (tenant)
  └── Property (edificio / hotel)
        ├── RoomType (Vista | Atrio | Cielo → mapeo comercial)
        │     └── Room (unidad física = actuales `properties` loft)
        ├── RatePlan / SeasonRules
        ├── Reservations / Blocks
        ├── Channels (iCal + futuros OTA)
        ├── Guests / CRM
        └── Ops: Housekeeping, Inventory, Expenses
```

### Principios

1. **Reuse-first:** hero, wizard, pricing, admin UI y APIs PMS se adaptan; no se sustituyen de golpe.
2. **Tenant isolation:** toda fila operativa lleva `organization_id` (+ `property_id` donde aplique); RLS por membership.
3. **Módulos activables:** flags por organización (booking, channel, CRM, payments…), reutilizando `allowed_modules` a nivel usuario.
4. **Canal directo = website:** el embudo público sigue siendo el diferenciador; el motor de reservas se enchufa detrás cuando exista.
5. **Supabase-first:** Auth, Postgres, RLS, Storage, cron; evitar Prisma salvo necesidad clara de migraciones tipadas/multi-DB (ver §5).

### Capas futuras (misma app Next)

- `src/features/<module>` por dominio SaaS.
- APIs `/api/admin/*` con scope tenant; futuras `/api/v1/public/booking/*`.
- Marketing routes pueden vivir por `NEXT_PUBLIC` / domain mapping por tenant (fase avanzada).

---

## 3. Problemas detectados / inconsistencias

1. **Single-tenant implícito:** no hay `organization_id`; todo el staff ve todo el inventario PMS.
2. **Doble modelo de “loft”:** marketing (`src/data/lofts.ts`, categorías Vista/Atrio/Cielo) vs PMS (`properties.name` “Loft N”) sin FK ni sync.
3. **Cotizaciones vs reservas:** `cotizaciones.loft_id` es `text` libre; no crea `reservations` ni bloquea disponibilidad.
4. **Booking público sin backend:** no consulta `reservations`/`availability_blocks`; riesgo de overbooking si se “confirma” solo por WhatsApp.
5. **Pricing divergente:** categorías muestran precios desde 90/105/120k; motor `DEFAULT_PRICING` usa base 90/100k L-J/V-D; admin puede persistir otra config en `app_settings`.
6. **`guest_reviews` fuera de `database.types.ts`:** migración 016 existe; tipos generados no la incluyen.
7. **Rate limit muerto:** `src/lib/admin-rate-limit.ts` no está cableado en middleware/API (doc antigua lo daba por hecho).
8. **README desactualizado:** aún sugiere que cotizaciones/inventario/aseos viven solo en localStorage; ya hay tablas + APIs + banners de migración.
9. **Canal “Booking/Expedia”:** el tipo `ReservationSource` los nombra, pero solo hay sync iCal práctico (Airbnb).
10. **Deploy dual:** crons en Vercel + operación en Droplet — riesgo de doble ejecución o cron no activo según hosting.
11. **Middleware matcher amplio:** corre en casi todas las rutas (coste latencia / auth en páginas estáticas).
12. **Sin tests de integración** de APIs PMS/booking; cobertura unitaria limitada a libs.

---

## 4. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Reescritura “big bang” del website | Pérdida de SEO/UX reciente | Freeze UI marketing en Fase 1+; solo adapters |
| Multi-tenant mal aislado (RLS) | Fuga de datos entre hoteles | Migraciones con `organization_id` NOT NULL + tests RLS |
| Overbooking (WA + OTAs + manual) | Operación / reputación | Motor disponibilidad único antes de pagos online |
| iCal como “channel manager” | Latencia, gaps, conflictos | Tratar iCal como conector v1; CM API después |
| Introducir Prisma en paralelo | Dos fuentes de verdad schema | Quedarse en SQL Supabase o migrar 100% |
| Pagos sin hold de inventario | Chargebacks / doble venta | Hold atómico → pago → confirm |
| Scope SaaS vs producto local | Dilución del valor Lofthouse | Fases; tenant cero = Lofthouse |
| Secrets Drive/Sheets incompletos | Gastos “a medias” en prod | Checklist env antes de depender del módulo |
| Tipos DB desfasados | Bugs silenciosos TS | Regenerar `database.types.ts` en cada migración |

---

## 5. Stack recomendado

### Mantener (decisión)

- **Next.js 15 App Router + React 19 + TS + Tailwind** — ya productivo.
- **Supabase Auth + Postgres + RLS + Storage** — ya cubre auth staff, archivos, cron server-side.
- **Zod + React Query** — contratos API y cache admin.
- **Vitest** — ampliar a availability/pricing/tenant helpers.
- **node-ical** — conector canal v1.

### No introducir ahora

- **Prisma / Drizzle** como ORM principal: el proyecto ya opera con migraciones SQL + client Supabase tipado. Añadir Prisma implica duplicar schema y pelear con RLS/auth helpers.
- Microservicios / segundo frontend admin.
- Reemplazo del diseño del sitio público.

### Convivencia / transición futura (si se pediera ORM)

| Opción | Cuándo | Notas |
|--------|--------|-------|
| **A — Solo Supabase (recomendado Fases 1–6)** | Default | Migraciones en `supabase/migrations`, tipos `supabase gen types` |
| **B — Drizzle “sql-first”** | Si el equipo quiere migraciones TS | Puede apuntar al mismo Postgres; **una** fuente de migraciones |
| **C — Prisma** | Solo si se exige Prisma ecosystem | Migración completa; no mezclar writes Prisma + Supabase client ad hoc |

**Veredicto Fase 0:** permanecer en **Supabase SQL + RLS**. Reevaluar ORM en Fase 6+ solo con dolor real (migraciones complejas multi-env).

### Añadir cuando toque la fase

- Pasarela pagos (ej. Wompi/Stripe) — Fase pagos.
- Cola/jobs robustos si se sale de Vercel cron / Droplet crontab.
- Observabilidad: Sentry ya cableable; métricas de sync iCal.

---

## 6. Modelo de datos (adaptado a lo existente)

### Entidades objetivo (prompt maestro → mapeo)

| Entidad SaaS | Hoy | Evolución |
|--------------|-----|-----------|
| **Organization** | Implícita (1 hotel) | Nueva tabla; seed Lofthouse |
| **Property** | Una sede lógica | Tabla `properties` hotel-level **o** renombrar actuales a `rooms` |
| **RoomType** | `LOFT_CATEGORIES` (código) | Tabla; seed Vista/Atrio/Cielo |
| **Room** | `public.properties` (lofts) | `rooms` FK room_type + property; migrar filas actuales |
| **Guest** | `guest_name/phone` en reservation | Tabla CRM |
| **Reservation** | `reservations` | + org, room_id, guest_id, channel, money fields |
| **Block** | `availability_blocks` | + org |
| **RatePlan / PriceRule** | `pricing.ts` + `app_settings` | Tablas o settings versionados por property |
| **Quote** | `cotizaciones` | Link opcional → reservation |
| **Channel / IcalSource** | `ical_sources` | + channel_type, mapping room |
| **Payment** | — | Nueva |
| **HousekeepingTask** | `cleaning_tasks` | + org |
| **Expense** | `expenses` | + org |
| **InventoryItem** | `inventario_*` | + org; `loft_id` → `room_id` |
| **UserMembership** | `profiles` global | `org_members` (user, org, role, modules) |
| **Review** | `guest_reviews` | + org/property opcional |

### Relación con marketing actual

- Cards Vista/Atrio/Cielo → **RoomType** (no borrar UI; alimentar desde API/catalogo).
- `src/data/lofts.ts` → proyección SEO de **Room** (puede seguir estático en Fase 1; sync después).
- Stay draft / wizard → input del futuro **BookingRequest**.

### Esquema conceptual (Fase 1+)

```
organizations
org_members (user_id, organization_id, role, allowed_modules)
properties (organization_id, …)          -- edificio
room_types (property_id, code, name, …) -- vista|atrio|cielo
rooms (property_id, room_type_id, code, …) -- migrado desde properties actuales
```

Estrategia de migración de nombres: mantener compat API admin un tiempo (`properties` = rooms) con vistas SQL, o rename controlado en una sola migración con dual-read.

---

## 7. Módulos del sistema

| # | Módulo | Existe hoy | Notas |
|---|--------|------------|-------|
| M0 | **Website / SEO / Brand** | Sí | Freeze salvo bugs |
| M1 | **Identity & Access** | Parcial | Falta org membership |
| M2 | **Catalog (Property/RoomType/Room)** | Sí (Fase 2) | Admin UI + APIs; dual-read PMS |
| M3 | **Pricing & Quotes** | Sí | Unificar público/admin |
| M4 | **Direct Booking Engine** | No (WA lead) | Wizard reutilizable |
| M5 | **PMS / Reservations** | Parcial | Calendario + CRUD |
| M6 | **Channel Manager** | iCal only | |
| M7 | **Housekeeping** | Parcial | Aseos |
| M8 | **Inventory Ops** | Parcial | |
| M9 | **Expenses / Light Finance** | Parcial | |
| M10 | **CRM / Guests** | No | |
| M11 | **Payments** | No | |
| M12 | **Reviews / Reputation** | Parcial | |
| M13 | **Notifications** | Parcial | Campana admin |
| M14 | **Reporting / BI** | No | |
| M15 | **Tenant Admin / Billing SaaS** | No | |

---

## 8. Dependencias entre módulos

```
M1 Identity ─────────────────────────────────────────────┐
     │                                                   │
     ▼                                                   │
M2 Catalog (Org→Property→RoomType→Room)                  │
     │                                                   │
     ├──────────► M3 Pricing ◄── app_settings            │
     │               │                                   │
     │               ▼                                   │
     ├──────────► M4 Direct Booking ──► M5 PMS ◄─────────┤
     │               │                    │              │
     │               └──── payments M11 ──┤              │
     │                                    │              │
     ├──────────► M6 Channel ─────────────┤              │
     │                                    ▼              │
     │                              M7 Housekeeping      │
     │                                    │              │
     ├──────────► M8 Inventory            │              │
     ├──────────► M9 Expenses             │              │
     └──────────► M10 CRM ◄── reservations┘              │
                                                         │
M0 Website ──(stay draft)──► M4                          │
M12 Reviews (independiente / property)                   │
M13 Notifications ◄── M5 / M7 / signup                   │
M14 Reporting ◄── M5 M9 M11                              │
M15 SaaS billing ◄── M1                                  │
```

**Regla de oro:** ningún módulo de escritura de disponibilidad (M4, M6, manual M5) debe saltarse el motor de conflicto de M5 (`overlap` / `conflicts` ya esbozados en `src/lib/pms/`).

---

## 9. Plan de implementación (Fases 0–11)

| Fase | Nombre | Objetivo | Reutiliza |
|------|--------|----------|-----------|
| **0** | Auditoría | Este documento + inventario | — |
| **1** | Cimientos multi-tenant | `organizations`, membership, `organization_id` en tablas core; seed Lofthouse; **sin** cambiar website UX | profiles, RLS patterns |
| **2** | Catálogo RoomType/Room | Formalizar Vista/Atrio/Cielo + bridge `properties`↔`rooms`; APIs/UI admin catálogo | `loft-categories`, PMS properties — **hecha** ([`FASE2.md`](./FASE2.md)) |
| **3** | Disponibilidad unificada | API pública de availability; wizard consulta DB; holds cortos | guided-reservation, pms overlap |
| **4** | Booking engine directo | Crear reservation desde wizard (estado `pending`/`confirmed`); WA como notificación, no único canal | reservar/, cotizaciones |
| **5** | Pricing unificado | Rate plans por RoomType; alinear hero prices y `pricing.ts` | cotizaciones-pricing, public-stay-quote |
| **6** | PMS endurecido | UX reservas, conflictos, gaps, referral; deep-link quote→reservation | `/admin/reservas`, features/pms |
| **7** | Channel manager v1→v2 | iCal robusto + mapping rooms; luego OTAs API | ical-sync, ical export |
| **8** | Ops (HK + inventario + gastos) | Tenant-scope; cerrar Drive prod; menos localStorage | aseos, inventarios, expenses |
| **9** | CRM + comunicaciones | Guests, historial, templates WA/email | reservations guest fields, notifications |
| **10** | Pagos + folio ligero | Depósito/anticipo, webhooks, estados de pago | booking engine |
| **11** | SaaS multi-hotel | Onboarding orgs, domain/branding, billing plataforma, reportes | todo lo anterior |

Cada fase debe: migraciones SQL + tipos regenerados + tests de dominio + **no** romper rutas públicas existentes.

---

## 10. Fase 1 — Foundations multi-tenant (implementada)

> Detalle operativo, migraciones y cómo probar: [`docs/FASE1.md`](./FASE1.md).  
> **Fase 2 (catálogo) implementada** — ver [`docs/FASE2.md`](./FASE2.md).  
> **Fase 3 (disponibilidad unificada) pendiente de OK.**

### Qué se tocó

1. **Migración SQL:** `organizations`, `org_members`; columnas `organization_id` en tablas core; catálogo foundation `org_properties` / `room_types` / `rooms`.
2. **Seed:** organización `LOFTHOUSE`; property `LOFTHOUSE 14`; room types Vista/Atrio/Cielo; rooms LOFT 01–14; memberships desde staff existente.
3. **RLS:** `is_org_member()` / `is_org_admin()`; políticas por tenant.
4. **API helpers:** `requireStaff()` → `organizationId`; filtros e inserts scoped; `GET /api/admin/catalog`.
5. **Tipos:** `database.types.ts` (+ `guest_reviews`).
6. **Docs:** este archivo, `FASE1.md`, `.env.example`, README.

### Qué NO se tocó (freeze explícito)

- `src/components/sections/hero.tsx`, `hero-booking-card.tsx`, tickets Vista/Atrio/Cielo.
- Banner de fechas / sticky booking / `stay-draft`.
- `guided-reservation`, `/reservar`, extras, copy «Personaliza tu experiencia».
- Landings SEO, blog, galería, estilos/marca del sitio público.
- Lógica visual del admin shell (solo plumbing tenant detrás).
- No introducir Prisma.
- No implementar pagos, CM OTA, ni booking confirm online (Fases 4/7/10).
- No borrar tablas ni flujos localStorage de migración hasta Fase 8.

### Criterios de aceptación Fase 1

- [x] Un único org seed; filas operativas con `organization_id` (tras aplicar 017–019).
- [x] Staff sin membership no ve datos (RLS + `FORBIDDEN_NO_ORG` en APIs scoped).
- [ ] Panel admin y crons iCal/aseos/gastos — smoke en Supabase real tras aplicar SQL.
- [x] Website público sin cambios UX (solo plumbing/docs).
- [x] `npm run typecheck` + `npm run test` (verificar en CI/local).

### Estimación de invasividad (técnica, no calendario)

Media en **DB/RLS/API**; **nula** en UI marketing. Riesgo residual: aplicar migraciones en prod con cuidado (PK `app_settings`).

---

## 11. Fase 2 — Catálogo (implementada)

> Detalle: [`docs/FASE2.md`](./FASE2.md). Branch: `cursor/fase2-catalogo-pms-f0b5`.

### Qué se tocó

1. **Migración 020:** `properties.room_id` + backfill bridge + vista `v_catalog_rooms`.
2. **Seed TS compartido** (`src/lib/catalog`) alineado con marketing Vista/Atrio/Cielo.
3. **APIs:** `GET/PATCH /api/admin/catalog`; `GET/POST /api/admin/organizations` (switcher cookie).
4. **UI:** `/admin/catalogo` + `OrgSwitcher` en shell.
5. **Docs / tests** de seed, schema y cookie.

### Qué NO se tocó

Website hero/wizard; rename destructivo de `properties`; booking engine; pagos; CM OTA.

### Criterios Fase 2

- [x] Admin catálogo property + room types + rooms
- [x] PATCH mínimo room_types/rooms
- [x] Bridge dual-read PMS ↔ rooms
- [x] Marketing categories ↔ seed
- [ ] Smoke Supabase real con 020

---

## Referencias internas

- Inventario Fase 0: [`docs/FASE0-AUDIT.md`](./FASE0-AUDIT.md)
- Fase 1 foundations: [`docs/FASE1.md`](./FASE1.md)
- Fase 2 catálogo: [`docs/FASE2.md`](./FASE2.md)
- Deploy: [`docs/DEPLOY.md`](./DEPLOY.md)
- SEO cumplimiento: [`docs/AUDITORIA-CUMPLIMIENTO.md`](./AUDITORIA-CUMPLIMIENTO.md)
- Env: [`.env.example`](../.env.example)
- Migraciones: [`supabase/migrations/`](../supabase/migrations/)
