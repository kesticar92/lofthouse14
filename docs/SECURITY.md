# Security (mínimo)

## Principios

1. **Secretos solo servidor:** `SUPABASE_SERVICE_ROLE_KEY`, pasarelas (`WOMPI_*`, `STRIPE_SECRET_KEY`, etc.), `CRON_SECRET`, LLM keys. Nunca `NEXT_PUBLIC_*` para secretos.
2. **RLS:** tablas nuevas (021–028) usan `is_org_member(organization_id)`.
3. **Staff gate:** `/api/admin/*` vía `requireStaff` + módulos.
4. **Rate limit:** middleware limita `/api/admin/*` (`ADMIN_API_RATE_LIMIT_PER_MINUTE`, default 240) y APIs públicas (`PUBLIC_API_RATE_LIMIT_PER_MINUTE`, default **45**): booking, availability (+ calendar), messages, coupons, fx, reviews.
5. **Webhooks:** validación de firma es **placeholder**; no activar OTAs/pagos reales sin verificar HMAC del proveedor.
6. **Idempotencia:** headers `Idempotency-Key` / `x-idempotency-key` en webhooks de canales/pagos (dedupe best-effort en DB).
7. **CSRF:** mutaciones en `/api/admin/*` y `/api/public/booking*` validan **Origin** (preferido) o **Referer** contra allowlist (`NEXT_PUBLIC_SITE_URL` + localhost:43127/3000 + `CSRF_ALLOWED_ORIGINS`). Sin ambos headers: permitido salvo `CSRF_STRICT=1` (smoke/curl). Desactivar: `CSRF_ORIGIN_CHECK=0`.
8. **Audit:** helper `recordLocalAudit` en booking walk-in/create, guest/admin cancel, pay mock, housekeeping checkout y front-desk (redacta password/token/secret).
9. **Persistencia local durable:** sin Supabase, stores escriben `.data/*.json` (sobrevive reinicio del server en dev). Preferir path Supabase cuando hay service role. `LH_DURABLE_STORE=0` / Vitest desactiva disco.

## Checklist prod

- [ ] Service role solo en Droplet/Vercel env, no en repo
- [ ] `CRON_SECRET` fuerte
- [ ] Desactivar module_flags.payments hasta tener proveedor real
- [ ] Revisar políticas Storage (gastos/fotos)
- [ ] No loguear bodies de webhooks con PII completa en prod
- [x] Origin/CSRF check en mutaciones admin + public booking
- [ ] `CSRF_STRICT=1` + allowlist de dominios de producción
- [ ] Bajar `PUBLIC_API_RATE_LIMIT_PER_MINUTE` si hay abuso (default 45)
- [ ] No versionar `.data/` (runtime local)
