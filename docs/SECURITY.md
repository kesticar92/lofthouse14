# Security (mínimo)

## Principios

1. **Secretos solo servidor:** `SUPABASE_SERVICE_ROLE_KEY`, pasarelas (`WOMPI_*`, `STRIPE_SECRET_KEY`, etc.), `CRON_SECRET`, LLM keys. Nunca `NEXT_PUBLIC_*` para secretos.
2. **RLS:** tablas nuevas (021–028) usan `is_org_member(organization_id)`.
3. **Staff gate:** `/api/admin/*` vía `requireStaff` + módulos.
4. **Rate limit:** middleware limita `/api/admin/*` (`ADMIN_API_RATE_LIMIT_PER_MINUTE`, default 240) y booking/availability públicos (`PUBLIC_API_RATE_LIMIT_PER_MINUTE`, default 60).
5. **Webhooks:** validación de firma es **placeholder**; no activar OTAs/pagos reales sin verificar HMAC del proveedor.
6. **Idempotencia:** headers `Idempotency-Key` / `x-idempotency-key` en webhooks de canales/pagos (dedupe best-effort en DB).

## Checklist prod

- [ ] Service role solo en Droplet/Vercel env, no en repo
- [ ] `CRON_SECRET` fuerte
- [ ] Desactivar module_flags.payments hasta tener proveedor real
- [ ] Revisar políticas Storage (gastos/fotos)
- [ ] No loguear bodies de webhooks con PII completa en prod
