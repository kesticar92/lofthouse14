Aquí se encuentran scrapers para reseñas. Los JSON están en `reviews/`.

| Script | Salida |
|--------|--------|
| `scrape_google_reviews.py` | `reseñas_google.json` |
| `scrape_booking_reviews.py` | `reseñas_booking.json` |
| `airbnbReviewsScrapper.py` | `reseñas_airbnb.json` |
| `run_all_reviews.py` | Ejecuta los tres (**Google, Booking y Airbnb obligatorios**) |

### Publicaciones Airbnb (`reviews/airbnb_listings.json`)

- **Loft 01–03, 05–14**: 13 anuncios (no existe Loft 04; es bodega/oficina de administración).
- **Casa entera (grupos)**: listing `1556929420516931269`.

Cada reseña Airbnb lleva `listing_id`; la web muestra **Loft 01**, **Casa entera (grupos)**, etc.

### Importar / actualizar reseñas (Playwright)

```bash
cd src/app/scrapper
python3 -m venv .venv
source .venv/bin/activate
pip install playwright
playwright install chromium
python run_all_reviews.py
```

- Se importan **todas** las reseñas (cortas, malas o sin texto → “Sin comentario escrito”).
- Los scrapers **fusionan** con el JSON existente para no perder entradas antiguas.

### Automatización diaria

GitHub Actions: `.github/workflows/scrape-reviews-daily.yml` (08:00 UTC). Si hay cambios en `reviews/*.json`, hace commit y push para que el deploy incorpore reseñas nuevas.

### Web pública

Sección **Testimonios**: filtros por **plataforma**, **mes** y **unidad Airbnb**; carrusel sin filtros, cuadrícula al filtrar. Google + Booking + Airbnb ordenados por fecha.

**Calificación en tarjetas:** Booking muestra la nota **numérica 0–10** (como en Booking.com); Google y Airbnb muestran **estrellas** (1–5). La web falla al compilar si faltan reseñas de Google o Booking en los JSON.
