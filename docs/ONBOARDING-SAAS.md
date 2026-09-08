# Onboarding SaaS (fundations)

Bases multi-hotel sin billing gateway real todavía.

## Qué hay

- `organizations.module_flags` (migración `028`)
- Seed TypeScript: planes `starter` | `ops` | `growth` en `src/lib/saas/module-flags.ts`
- Admin **read-only**: `/admin/saas` → flags ON/OFF por módulo
- API: `GET /api/admin/saas/flags`

## Flags por defecto (ops)

| Flag | Default |
|------|---------|
| booking | ON |
| channel_manager | ON |
| crm | ON |
| payments | OFF (hasta Wompi keys) |
| analytics | ON |
| ai_assistant | OFF |
| einvoicing | OFF |

## Alta de una org nueva (manual)

1. Insertar fila en `organizations` (slug, name, status=active).
2. Copiar `module_flags` del plan deseado (JSON de `PLAN_SEEDS`).
3. Crear `org_members` para el admin.
4. (Opcional) `org_properties` + rooms vía migraciones 019/020 o admin catálogo.
5. Domain mapping: hoy vía `DEFAULT_ORGANIZATION_SLUG` / cookie switcher — mapping DNS custom = TODO futuro.

## No incluido aún

- Stripe/Billing de suscripción del SaaS
- Portal self-serve de alta
- Enforcement estricto de flags en todas las rutas (hoy flags informativos + seed)
