# Deployment (mínimo Fases 3–11)

Complementa [`DEPLOY.md`](./DEPLOY.md) (Droplet + Nginx + PM2).

## Migraciones

1. Backup DB.
2. Aplicar `supabase/migrations/021` … `028` en orden (tras 017–020).
3. Smoke: `/api/public/availability`, crear booking, `/admin/catalogo`.

## Env nuevas (vacías en `.env.example`)

```
PAYMENT_PROVIDER=stub
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYU_API_KEY=
PAYU_API_LOGIN=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
LLM_API_KEY=
ADMIN_API_RATE_LIMIT_PER_MINUTE=240
PUBLIC_API_RATE_LIMIT_PER_MINUTE=60
```

## Proceso

```bash
npm ci
npm run build
# PM2 / systemd según DEPLOY.md
npm run start
# o next start -p 43127 detrás de Nginx
```

## Crons

Sin cambio: `sync-ical`, `cleaning-sync`, `expense-drive-retry` con `Authorization: Bearer $CRON_SECRET`.

Channel OTA pull real **no** está cableado a cron (solo stubs + iCal existente).

Detalle de activación por provider: [`INTEGRATIONS.md`](./INTEGRATIONS.md).
Migraciones 017–028: [`MIGRATIONS.md`](./MIGRATIONS.md) (`npm run migrations:verify`).
