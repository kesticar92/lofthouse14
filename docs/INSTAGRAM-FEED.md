# Muro Instagram (Redes)

La sección **Instagram y TikTok** del sitio carga `/api/instagram/feed` y muestra **todas** las publicaciones del catálogo (no solo 4).

## Orígenes (en orden)

1. **Graph API (live)** — si existen:
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID` (IG User ID de la cuenta Business/Creator)
2. **Store local** — `.data/instagram-feed.json` (editable en `/admin/redes`)
3. **Seed** — `src/data/instagram-posts.ts`

## Sync

- Botón **Sincronizar Instagram** en `/admin/redes`
- Cron: `GET /api/cron/sync-instagram` con `Authorization: Bearer $CRON_SECRET`

Sin token Meta no se puede scrapear Instagram; usa el admin para pegar URLs/thumbs nuevas o conecta Graph API.
