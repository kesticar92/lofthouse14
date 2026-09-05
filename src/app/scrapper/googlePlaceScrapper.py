!pip install playwright pandas
!playwright install chromium
!playwright install-deps

from playwright.async_api import async_playwright
import pandas as pd
import asyncio
import json # <-- Añadimos la librería para manejar JSON

async def scrape_google_reviews(url):
    print("Iniciando navegador (Async)...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)

        print("Esperando a que cargue la interfaz...")
        # Esperamos explícitamente a que aparezca al menos la primera reseña
        await page.wait_for_selector('.Svr5cf', timeout=15000)

        print("Iniciando técnica de scroll por enfoque de elemento...")

        target_reviews = 25 # Nuestro mínimo deseado (más de 20)
        previous_count = 0

        # Bucle de carga forzada
        for i in range(15): # Máximo 15 intentos para no quedarnos en un bucle infinito
            reviews = await page.query_selector_all('.Svr5cf')
            current_count = len(reviews)

            print(f"Intento {i+1}: {current_count} reseñas visibles.")

            if current_count >= target_reviews:
                print(f"¡Objetivo alcanzado! Tenemos {current_count} reseñas.")
                break

            if current_count == previous_count:
                print("Parece atascado. Forzando movimiento con el teclado...")
                await page.keyboard.press("PageDown")
                await asyncio.sleep(2)

            # --- LA CLAVE ESTÁ AQUÍ ---
            # Tomamos la ÚLTIMA reseña cargada y forzamos a la pantalla a bajar hasta ella
            last_review = reviews[-1]
            await last_review.scroll_into_view_if_needed()

            # Esperamos 3 segundos completos para que Google haga la petición AJAX y traiga más
            await asyncio.sleep(3)
            previous_count = current_count

        # Volvemos a capturar la lista final de reseñas
        final_reviews = await page.query_selector_all('.Svr5cf')
        print(f"\nExtrayendo datos de las {len(final_reviews)} reseñas consolidadas...")

        reviews_list = []

        for index, review in enumerate(final_reviews):
            try:
                name_el = await review.query_selector('.DHIhE')
                rating_el = await review.query_selector('.GDWaad')
                text_el = await review.query_selector('.STQFb')

                name = await name_el.inner_text() if name_el else "N/A"
                rating = await rating_el.inner_text() if rating_el else "N/A"
                text = await text_el.inner_text() if text_el else "N/A"

                reviews_list.append({
                    "id": index + 1,
                    "nombre": name,
                    "calificacion": rating,
                    "comentario": text.replace("\n", " ").strip()
                })
            except Exception as e:
                continue

        await browser.close()
        return reviews_list

# --- Ejecución ---
url_reseñas = "https://www.google.com/travel/search?q=lofthouse%2014&g2lb=4899568%2C4899570%2C4965990%2C72471280%2C72560029%2C72573224%2C72647020%2C72686036%2C72803964%2C72882230%2C73064764%2C73249150&hl=es-419&gl=co&cs=1&ssta=1&ts=CAEaRwopEicyJTB4OGUzMGE2ODM4NWZmZDlhOToweDIxOWE3ODdjOTM3ZjYyOWMSGhIUCgcI6g8QBxgEEgcI6g8QBxgFGAEyAhAA&qs=CAEyE0Nnb0luTVg5bThtUG5zMGhFQUU4AkIJCZxif5N8eJohQgkJnGJ_k3x4miE&ap=ugEHcmV2aWV3cw&ictx=111&ved=0CAAQ5JsGahcKEwi4v-Pp65OVAxUAAAAAHQAAAAAQBQ"

data = await scrape_google_reviews(url_reseñas)

# ---