#!/usr/bin/env python3
"""Scrape reseñas Google (Maps DOM + red) → reviews/reseñas_google.json"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from playwright.async_api import Page, Response, async_playwright

ROOT = Path(__file__).resolve().parent

# Ficha LOFTHOUSE 14 — place id 0x8e30a68385ffd941:0x219a787c937f629
MAPS_PLACE_URL = (
    "https://www.google.com/maps/place/LOFTHOUSE+14/"
    "@3.4369469,-76.5435608,17z/data=!4m8!3m7!"
    "1s0x8e30a68385ffd941:0x219a787c937f629!"
    "8m2!3d3.4369468662280838!4d-76.54356082617328!"
    "16s%2Fg%2F11v0xqk8xq?hl=es&entry=ttu"
)

MIN_REVIEWS = 1
PLACE_NAME = "LOFTHOUSE 14"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
STEALTH = """
Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
window.chrome = { runtime: {} };
Object.defineProperty(navigator, 'languages', {get: () => ['es-CO', 'es', 'en']});
Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]});
"""


def _headless() -> bool:
    raw = os.environ.get("HEADLESS", "1").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def _reviews_dir() -> Path:
    override = os.environ.get("LOFTHOUSE_REVIEWS_DIR", "").strip()
    if override:
        path = Path(override)
        path.mkdir(parents=True, exist_ok=True)
        return path
    return ROOT / "reviews"


OUT = _reviews_dir() / "reseñas_google.json"


def parse_review_date(raw: str) -> str | None:
    raw = raw.strip()
    if not raw:
        return None
    iso = re.search(r"(\d{4})-(\d{2})-(\d{2})", raw)
    if iso:
        return iso.group(0)
    months = {
        "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
        "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
        "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12",
    }
    m = re.search(r"(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})", raw, re.I)
    if m:
        month = months.get(m.group(2).lower())
        if month:
            return f"{m.group(3)}-{month}-{int(m.group(1)):02d}"
    rel = re.search(
        r"hace\s+(\d+)\s+(día|días|semana|semanas|mes|meses|año|años)",
        raw,
        re.I,
    )
    if rel:
        return datetime.now(ZoneInfo("America/Bogota")).date().isoformat()
    return None


def clean_comment(text: str) -> str:
    s = text.replace("\n", " ").strip()
    s = re.sub(r"Habitaciones[\d.,]+\s*Servicio[\d.,]+.*", "", s, flags=re.I)
    s = re.sub(r"Aspectos destacados del hotel.*", "", s, flags=re.I)
    s = re.sub(r"…\s*Más información\s*$", "", s)
    s = re.sub(r"\s+Más información\s*$", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_rating(raw: str) -> str:
    raw = (raw or "").strip()
    for pattern in (
        r"([\d.,]+)\s*/\s*5",
        r"([\d.,]+)\s*de\s*5",
        r"([\d.,]+)\s*estrellas?",
        r"^([\d.,]+)$",
    ):
        m = re.search(pattern, raw, re.I)
        if m:
            return f"{m.group(1).replace(',', '.')}/5"
    return raw or "N/A"


@dataclass
class ReviewCapture:
    rows: list[dict] = field(default_factory=list)
    seen: set[tuple[str, str]] = field(default_factory=set)

    def add(self, nombre: str, comentario: str, calificacion: str = "N/A", fecha: str | None = None) -> None:
        comment = clean_comment(comentario)
        if len(comment) < 4:
            return
        name = (nombre or "Anónimo").strip()
        key = (name.lower(), comment[:100])
        if key in self.seen:
            return
        self.seen.add(key)
        row: dict = {"nombre": name, "calificacion": parse_rating(calificacion), "comentario": comment}
        if fecha:
            row["fecha"] = fecha
        self.rows.append(row)


def _walk_json(node, capture: ReviewCapture, depth: int = 0) -> None:
    """Busca tuplas nombre+texto+rating en respuestas RPC de Maps."""
    if depth > 14:
        return
    if isinstance(node, dict):
        for v in node.values():
            _walk_json(v, capture, depth + 1)
        return
    if isinstance(node, list):
        if len(node) >= 3:
            texts = [x for x in node if isinstance(x, str) and len(x) > 12]
            names = [x for x in node if isinstance(x, str) and 2 < len(x) < 80]
            rating = None
            for x in node:
                if isinstance(x, str) and re.search(r"\d\s*estrellas?", x, re.I):
                    rating = x
                if isinstance(x, (int, float)) and 1 <= x <= 5:
                    rating = f"{x}/5"
            if texts and names:
                comment = max(texts, key=len)
                if not re.match(r"^https?://", comment) and "google" not in comment.lower()[:20]:
                    capture.add(names[0], comment, rating or "N/A")
        for item in node:
            _walk_json(item, capture, depth + 1)


def parse_network_body(body: str, capture: ReviewCapture) -> None:
    body = body.strip()
    if body.startswith(")]}'"):
        body = body[4:].strip()
    try:
        data = json.loads(body)
        _walk_json(data, capture)
        return
    except json.JSONDecodeError:
        pass
    # batchexecute: varios JSON concatenados
    for chunk in re.split(r"\n+", body):
        chunk = chunk.strip()
        if not chunk or chunk.startswith("["):
            try:
                _walk_json(json.loads(chunk), capture)
            except json.JSONDecodeError:
                pass


async def _launch_browser(p):
    headless = _headless()
    args = [
        "--lang=es-CO",
        "--disable-blink-features=AutomationControlled",
        "--headless=new",
    ]
    launch = {"headless": headless, "args": args if headless else args[2:]}
    try:
        return await p.chromium.launch(channel="chrome", **launch)
    except Exception:
        return await p.chromium.launch(**launch)


async def dismiss_consent(page: Page) -> None:
    for label in ("Aceptar todo", "Accept all", "Rechazar todo", "Reject all"):
        btn = page.get_by_role("button", name=re.compile(label, re.I))
        if await btn.count():
            try:
                await btn.first.click(timeout=2000)
                await page.wait_for_timeout(600)
                return
            except Exception:
                pass


async def dismiss_modals(page: Page) -> None:
    await dismiss_consent(page)
    for label in ("Cancelar", "Cancel", "Cerrar", "Close", "Ahora no", "Not now"):
        btn = page.get_by_role("button", name=re.compile(f"^{label}$", re.I))
        if await btn.count():
            try:
                await btn.first.click(timeout=1500)
                await page.wait_for_timeout(500)
            except Exception:
                pass


async def ensure_place_panel(page: Page) -> bool:
    title = page.locator("h1.DUwDvf, h1.fontHeadlineLarge")
    try:
        await title.first.wait_for(state="visible", timeout=15000)
        text = (await title.first.inner_text()).upper()
        return "LOFTHOUSE" in text
    except Exception:
        pass

    await dismiss_modals(page)
    for loc in (
        page.get_by_text(PLACE_NAME, exact=False),
        page.locator(f'[aria-label*="{PLACE_NAME}"]'),
        page.locator('div[role="feed"] a[href*="/maps/place/"]').first,
    ):
        if not await loc.count():
            continue
        try:
            await loc.first.click(timeout=4000)
            await page.wait_for_timeout(3000)
            if await title.count():
                return True
        except Exception:
            continue
    return await title.count() > 0


async def open_reviews_list(page: Page) -> None:
    await dismiss_modals(page)

    # Pestaña «Reseñas» (no «Escribir una reseña»)
    tab = page.get_by_role("tab", name=re.compile("^Reseñas$", re.I))
    if await tab.count():
        try:
            await tab.first.click(timeout=4000)
            await page.wait_for_timeout(2000)
            return
        except Exception:
            pass

    for loc in (
        page.locator('button[jsaction*="pane.reviewChart"]'),
        page.locator('button[aria-label*="reseñas"]:not([aria-label*="Escribir"]):not([aria-label*="escribir"])'),
    ):
        if not await loc.count():
            continue
        try:
            await loc.first.click(timeout=4000)
            await page.wait_for_timeout(2000)
            await dismiss_modals(page)
            if await page.locator("div[data-review-id], div.jftiEf").count():
                return
        except Exception:
            continue

    # Scroll en panel lateral (Resumen incluye reseñas)
    panel = page.locator("div[role='main'] div.m6QErb.DxyBCb, div.m6QErb.DxyBCb").first
    if await panel.count():
        for _ in range(15):
            await dismiss_modals(page)
            if await page.locator("div[data-review-id], div.jftiEf").count():
                return
            await panel.evaluate("(el) => { el.scrollTop += 800; }")
            await page.wait_for_timeout(900)


async def scroll_reviews(page: Page) -> int:
    container = page.locator(
        "div.m6QErb.DxyBCb.kA9KIf.dS8AEf, div.m6QErb.DxyBCb, div[role='feed']",
    ).first
    idle = 0
    last = 0
    for _ in range(100):
        count = await page.locator("div[data-review-id], div.jftiEf").count()
        if await container.count():
            await container.evaluate("(el) => { el.scrollTop = el.scrollHeight; }")
        else:
            await page.keyboard.press("End")
        await page.wait_for_timeout(1400)
        await dismiss_modals(page)
        for btn in await page.locator('button:has-text("Más"), button:has-text("More")').all():
            try:
                await btn.click(timeout=200)
            except Exception:
                pass
        new = await page.locator("div[data-review-id], div.jftiEf").count()
        if new <= last:
            idle += 1
            if idle >= 6:
                break
        else:
            idle = 0
            last = new
    return last


async def extract_dom_reviews(page: Page, capture: ReviewCapture) -> None:
    cards = await page.query_selector_all("div[data-review-id], div.jftiEf")
    for card in cards:
        try:
            name_el = await card.query_selector(".d4r55, .WNxzHc .d4r55")
            name = (await name_el.inner_text()).strip() if name_el else "Anónimo"
            rating_raw = "N/A"
            rating_el = await card.query_selector('span[role="img"][aria-label*="estrella"]')
            if rating_el:
                rating_raw = (await rating_el.get_attribute("aria-label")) or "N/A"
            text = ""
            for sel in (".wiI7pd", ".MyEned span", ".MyEned"):
                el = await card.query_selector(sel)
                if el:
                    text = (await el.inner_text()).strip()
                    if len(text) > 8:
                        break
            fecha = None
            date_el = await card.query_selector(".rsqaWe, .dehysf")
            if date_el:
                fecha = parse_review_date(await date_el.inner_text())
            capture.add(name, text, rating_raw, fecha)
        except Exception:
            continue


async def on_maps_response(response: Response, capture: ReviewCapture) -> None:
    url = response.url
    if not any(k in url for k in ("listugcposts", "listentitiesreviews", "batchexecute", "/maps/rpc")):
        return
    try:
        body = await response.text()
        if len(body) < 80:
            return
        parse_network_body(body, capture)
    except Exception:
        pass


async def scrape_maps() -> list[dict]:
    capture = ReviewCapture()

    async with async_playwright() as p:
        browser = await _launch_browser(p)
        context = await browser.new_context(
            locale="es-CO",
            user_agent=USER_AGENT,
            viewport={"width": 1440, "height": 960},
            timezone_id="America/Bogota",
        )
        page = await context.new_page()
        await page.add_init_script(STEALTH)

        async def handler(resp: Response) -> None:
            await on_maps_response(resp, capture)

        page.on("response", handler)
        try:
            await page.goto(MAPS_PLACE_URL, wait_until="domcontentloaded", timeout=90000)
            await page.wait_for_timeout(5000)
            await dismiss_modals(page)
            if not await ensure_place_panel(page):
                print("  Maps: ficha del negocio no visible")
            else:
                await open_reviews_list(page)
                await scroll_reviews(page)
                await extract_dom_reviews(page, capture)
            print(
                f"  Maps: {len(capture.rows)} reseñas "
                f"({await page.locator('div[data-review-id], div.jftiEf').count()} tarjetas DOM)",
            )
            return capture.rows
        finally:
            page.remove_listener("response", handler)
            await browser.close()


def merge(existing: list[dict], incoming: list[dict]) -> list[dict]:
    capture = ReviewCapture()
    for r in existing + incoming:
        capture.add(
            r.get("nombre") or "Anónimo",
            r.get("comentario") or "",
            r.get("calificacion") or "N/A",
            r.get("fecha"),
        )
    return capture.rows


def main() -> None:
    existing: list[dict] = []
    if OUT.exists():
        try:
            raw = json.loads(OUT.read_text(encoding="utf-8"))
            existing = raw if isinstance(raw, list) else raw.get("reseñas", [])
        except json.JSONDecodeError:
            existing = []

    incoming = asyncio.run(scrape_maps())
    merged = merge(existing, incoming)

    for i, row in enumerate(merged, start=1):
        row["id"] = i

    today = datetime.now(ZoneInfo("America/Bogota")).date().isoformat()
    payload = {
        "origen": "Google",
        "actualizado": today,
        "total_reseñas": len(merged),
        "reseñas": merged,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ Google: {len(merged)} reseñas en {OUT} (actualizado {today})")
    if len(merged) < MIN_REVIEWS:
        print(f"✗ Google: se requieren al menos {MIN_REVIEWS} reseñas")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
