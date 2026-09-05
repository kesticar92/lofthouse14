!pip install playwright pandas
!playwright install chromium
!playwright install-deps

from playwright.async_api import async_playwright
import json
import asyncio

async def scrape_booking_reviews_stealth(url, min_reviews=20):
    print("Iniciando navegador con camuflaje Anti-Bot...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="es-CO",
            timezone_id="America/Bogota"
        )

        page = await context.new_page()
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        print("Navegando a la URL...")
        await page.goto(url)
        await asyncio.sleep(8)

        try:
            print("Buscando las tarjetas de reseña...")
            await page.wait_for_selector('[data-testid="review-card"]', timeout=10000)
        except Exception as e:
            print("\n❌ ALERTA: Booking bloqueó el acceso. Abortando.")
            await browser.close()
            return []

        reviews_list = []
        page_number = 1

        print(f"¡Acceso concedido! Iniciando extracción. Meta: {min_reviews} reseñas.")

        while len(reviews_list) < min_reviews:
            print(f"--- Escaneando página {page_number} ---")
            review_cards = await page.query_selector_all('[data-testid="review-card"]')

            if not review_cards:
                break

            for review in review_cards:
                try:
                    name_el = await review.query_selector('.b08850ce41')
                    name = await name_el.inner_text() if name_el else "Anónimo"

                    rating_el = await review.query_selector('[data-testid="review-score"] .f63b14ab7a')
                    rating = await rating_el.inner_text() if rating_el else "N/A"

                    # CORRECCIÓN: Buscando el texto completo dentro del contenedor
                    positive_el = await review.query_selector('[data-testid="review-positive-text"]')
                    negative_el = await review.query_selector('[data-testid="review-negative-text"]')

                    pos_text = await positive_el.inner_text() if positive_el else ""
                    neg_text = await negative_el.inner_text() if negative_el else ""

                    full_comment = f"{pos_text} {neg_text}".replace("\n", " ").strip()
                    if not full_comment:
                        full_comment = "Solo dejó calificación, sin texto"

                    reviews_list.append({
                        "nombre": name.strip(),
                        "calificacion": rating.strip(),
                        "comentario": full_comment
                    })

                    if len(reviews_list) >= min_reviews:
                        break

                except Exception as e:
                    continue

            print(f"Total acumulado: {len(reviews_list)} reseñas.")

            if len(reviews_list) >= min_reviews:
                break

            next_button = await page.query_selector('button[aria-label="Página siguiente"]')

            if next_button:
                is_disabled = await next_button.get_attribute('disabled')
                if is_disabled is not None:
                    print("Se alcanzó la última página.")
                    break

                await next_button.click()
                await asyncio.sleep(4)
                page_number += 1
            else:
                break

        await browser.close()
        return reviews_list

# --- Ejecución ---
url_booking = "https://www.booking.com/hotel/co/lofthouse-14.es.html?aid=318615&label=New_Spanish_ES_CO_20153958985-2nAvy2Dme98e1dkfuCnPVAS813129177545%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap%3Aneg%3Afi%3Atikwl-3500001%3Alp1003668%3Ali%3Adec%3Adm%3Aag20153958985%3Acmp313803625&sid=cfb822c9961bd82d404bcd0bfb4ee654&dest_id=-579248&dest_type=city&dist=0&group_adults=2&group_children=0&hapos=1&hpos=1&no_rooms=1&req_adults=2&req_children=0&room1=A%2CA&sb_price_type=total&sr_order=popularity&srepoch=1781883962&srpvid=c7f96eda12910274&type=total&ucfs=1&#tab-reviews"

# Pon tu meta en 25
data = await scrape_booking_reviews_stealth(url_booking, min_reviews=25)

# --- Guardar en JSON ---
if data:
    # Creamos un diccionario base para estructurar mejor el JSON
    json_data = {
        "origen": "Booking.com",
        "total_reseñas": len(data),
        "reseñas": data
    }

    # Abrimos un archivo con permisos de escritura ("w")
    with open('reseñas_booking.json', 'w', encoding='utf-8') as f:
        # json.dump escribe los datos en el archivo.
        # ensure_ascii=False asegura que las tildes y las eñes se guarden bien
        # indent=4 le da un formato bonito de lectura con espacios
        json.dump(json_data, f, ensure_ascii=False, indent=4)

    print(f"\n¡Éxito total! Se guardaron {len(data)} reseñas en 'reseñas_booking.json'.")