# Lofts marketing (fotos + amenities)

Panel: **`/admin/lofts-marketing`** (sidebar → «Lofts web»).

## Qué se edita

Por categoría **Vista / Atrio / Cielo**:

- Lista de fotos (URLs o paths públicos, p. ej. `/gallery/...`)
- Amenities mostradas en las cards del hero

## Persistencia

| Modo | Dónde |
|------|--------|
| Sin Supabase (default local) | `.data/lofts-marketing.json` vía `json-file-store` |
| Variable | `LH_DATA_DIR` cambia el directorio; `LH_DURABLE_STORE=0` desactiva escritura |

No hay tabla Supabase dedicada: el seed vive en `src/data/loft-categories.ts` y el admin solo guarda **overrides**.

## API

- `GET /api/admin/lofts-marketing` — seed + overrides (staff)
- `PUT /api/admin/lofts-marketing` — guarda overrides (staff, módulo `catalogo`)
- `GET /api/public/lofts-marketing` — categorías resueltas para el sitio

## Seed de fotos

Carrusel por defecto (inspección de `/public/gallery`):

| Categoría | 1 | 2 | 3 |
|-----------|---|---|---|
| Vista | Ventana exterior abierta | Cocina | Baño |
| Atrio | Cortina **cerrada** | Cocina | Escaleras |
| Cielo | Luz 1º↔2º (claraboya) | Cocina | Baño |
