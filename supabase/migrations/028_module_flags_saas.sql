-- =============================================================================
-- 028_module_flags_saas.sql — Fase 11: flags SaaS / multi-property polish
-- =============================================================================

alter table public.organizations
  add column if not exists module_flags jsonb not null default '{
    "booking": true,
    "channel_manager": true,
    "crm": true,
    "payments": false,
    "analytics": true,
    "ai_assistant": false
  }'::jsonb;

alter table public.organizations
  add column if not exists branding jsonb not null default '{}'::jsonb;

comment on column public.organizations.module_flags is
  'Feature flags por tenant (SaaS readiness). payments/ai off by default hasta keys reales.';
