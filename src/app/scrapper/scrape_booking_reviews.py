#!/usr/bin/env python3
"""Scrape Booking.com reviews → reviews/reseñas_booking.json"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent


def _reviews_dir() -> Path:
    override = os.environ.get("LOFTHOUSE_REVIEWS_DIR", "").strip()
    if override:
        path = Path(override)
        path.mkdir(parents=True, exist_ok=True)
        return path
    return ROOT / "reviews"


OUT = _reviews_dir() / "reseñas_booking.json"
MIN_REVIEWS = 5

URL = (
    "https://www.booking.com/hotel/co/lofthouse-14.es.html"
    "#tab-reviews"
)


def normalize_part(text: str) -> str:
    return " ".join(text.replace("\n", " ").split()).strip()


def empty_part(text: str) -> bool:
    if not text:
        return True
    return text.strip().lower() in {"n/a", "na", "n.a.", "-", "—"}


def parse_review_date(raw: str) -> str | None:
    """Intenta devolver YYYY-MM-DD desde textos de Booking."""
    raw = raw.strip()
    if not raw:
        return None
    iso = re.search(r"(\d{4})-(\d{2})-(\d{2})", raw)
    if iso:
        return iso.group(0)
    # "9 de agosto de 2026"
    months = {
        "enero": "01",
        "febrero": "02",
        "marzo": "03",
        "abril": "04",
        "mayo": "05",
        "junio": "06",
        "julio": "07",
        "agosto": "08",
        "septiembre": "09",
        "octubre": "10",
        "noviembre": "11",
        "diciembre": "12",
    }
    m = re.search(
        r"(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})",
        raw,
        re.IGNORECASE,
    )
    if m:
        day = int(m.group(1))
        month_name = m.group(2).lower()
        year = m.group(3)
        month = months.get(month_name)
        if month:
            return f"{year}-{month}-{day:02d}"
    return None


async def scrape(min_reviews: int = 9999) -> list[dict]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, channel="chrome")
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1920, "height": 1080},
            locale="es-CO",
            timezone_id="America/Bogota",
        )
        page = await context.new_page()
        await page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )
        await page.goto(URL, wait_until="domcontentloaded", timeout=90000)
        await asyncio.sleep(8)

        try:
            await page.wait_for_selector('[data-testid="review-card"]', timeout=20000)
        except Exception:
            await browser.close()
            return []

        reviews_list: list[dict] = []
        page_number = 1
        max_pages = 60
        while len(reviews_list) < min_reviews and page_number <= max_pages:
            cards = await page.query_selector_all('[data-testid="review-card"]')
            if not cards:
                break
            for review in cards:
                try:
                    name_el = await review.query_selector(".b08850ce41")
                    name = await name_el.inner_text() if name_el else "Anónimo"
                    rating_el = await review.query_selector(
                        '[data-testid="review-score"] .f63b14ab7a'
                    )
                    rating = await rating_el.inner_text() if rating_el else "N/A"
                    pos_el = await review.query_selector(
                        '[data-testid="review-positive-text"]'
                    )
                    neg_el = await review.query_selector(
                        '[data-testid="review-negative-text"]'
                    )
                    pos_text = normalize_part(
                        await pos_el.inner_text() if pos_el else ""
                    )
                    neg_text = normalize_part(
                        await neg_el.inner_text() if neg_el else ""
                    )

                    fecha: str | None = None
                    for date_sel in (
                        '[data-testid="review-date"]',
                        '[data-testid="review-stay-date"]',
                        "time",
                    ):
                        date_el = await review.query_selector(date_sel)
                        if date_el:
                            date_raw = normalize_part(await date_el.inner_text())
                            fecha = parse_review_date(date_raw)
                            if fecha:
                                break

                    entry: dict = {
                        "nombre": name.strip(),
                        "calificacion": rating.strip(),
                        "comentario_positivo": pos_text,
                        "comentario_negativo": neg_text,
                    }
                    if fecha:
                        entry["fecha"] = fecha
                    if not empty_part(pos_text) or not empty_part(neg_text):
                        entry["comentario"] = " ".join(
                            p
                            for p in (pos_text, neg_text)
                            if not empty_part(p)
                        ).strip()

                    reviews_list.append(entry)
                    if len(reviews_list) >= min_reviews:
                        break
                except Exception:
                    continue
            if len(reviews_list) >= min_reviews:
                break
            next_btn = await page.query_selector(
                'button[aria-label="Página siguiente"]'
            )
            if not next_btn or await next_btn.get_attribute("disabled") is not None:
                break
            await next_btn.click()
            await asyncio.sleep(4)
            page_number += 1

        await browser.close()
        return reviews_list


def merge_key(r: dict) -> tuple:
    return (
        r.get("nombre"),
        (r.get("comentario_positivo") or "")[:100],
        (r.get("comentario_negativo") or "")[:100],
        (r.get("comentario") or "")[:80],
    )


def merge(existing: list[dict], incoming: list[dict]) -> list[dict]:
    by_key: dict[tuple, dict] = {}
    for r in existing + incoming:
        by_key[merge_key(r)] = r
    return list(by_key.values())


def main() -> None:
    try:
        incoming = asyncio.run(scrape())
    except Exception as exc:
        print(f"⚠ Booking: scrape en vivo falló ({exc}). Se fusiona con JSON previo.")
        incoming = []

    existing: list[dict] = []
    if OUT.exists():
        try:
            raw = json.loads(OUT.read_text(encoding="utf-8"))
            existing = raw.get("reseñas", []) if isinstance(raw, dict) else raw
        except json.JSONDecodeError:
            existing = []

    merged = merge(existing, incoming)
    if len(incoming) >= len(existing):
        print(f"  Booking: {len(incoming)} reseñas en scrape en vivo")
    elif incoming:
        print(f"  Booking: scrape parcial ({len(incoming)}); fusionado con JSON previo")
    today = datetime.now(ZoneInfo("America/Bogota")).date().isoformat()
    payload = {
        "origen": "Booking.com",
        "total_reseñas": len(merged),
        "actualizado": today,
        "reseñas": merged,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ Booking: {len(merged)} reseñas en {OUT} (actualizado {today})")
    if len(merged) < MIN_REVIEWS:
        print(f"✗ Booking: se requieren al menos {MIN_REVIEWS} reseñas")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
