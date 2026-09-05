#!/usr/bin/env python3
"""Obtiene fotos reales de Google Maps por place_id y actualiza places_updated.json."""

from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
PLACES = ROOT / "src" / "data" / "places_updated.json"

PLACE_ID_RE = re.compile(r"place_id:([A-Za-z0-9_-]+)")


def extract_place_id(link: str) -> str | None:
    if not link:
        return None
    m = PLACE_ID_RE.search(link)
    return m.group(1) if m else None


def normalize_photo_url(url: str) -> str:
    """Tamaño razonable para tarjetas del mapa."""
    if "googleusercontent.com" not in url:
        return url
    base = url.split("=")[0] if "=" in url else url
    return f"{base}=w640-h480-k-no"


async def fetch_photo(page, place_id: str) -> str | None:
    url = f"https://www.google.com/maps/place/?q=place_id:{place_id}&hl=es"
    await page.goto(url, wait_until="domcontentloaded", timeout=90000)
    await page.wait_for_timeout(4500)

    candidates: list[str] = await page.eval_on_selector_all(
        'img[src*="googleusercontent.com"]',
        """els => els
          .map(e => e.src)
          .filter(s => s && !s.includes('=s40') && !s.includes('=s32') && !s.includes('=s64'))
        """,
    )

    seen: set[str] = set()
    for raw in candidates:
        if not raw or "staticmap" in raw:
            continue
        key = raw.split("=")[0]
        if key in seen:
            continue
        seen.add(key)
        return normalize_photo_url(raw)

    return None


async def main() -> None:
    places = json.loads(PLACES.read_text(encoding="utf-8"))
    updated = 0
    skipped = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            locale="es-CO",
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        page = await context.new_page()

        for place in places:
            if place.get("isHome"):
                continue
            pid = extract_place_id(place.get("google_maps_link", ""))
            if not pid:
                skipped += 1
                continue
            name = place.get("name", "?")
            print(f"→ {name} …", flush=True)
            try:
                photo = await fetch_photo(page, pid)
            except Exception as exc:
                print(f"   ⚠ {exc}")
                skipped += 1
                continue
            if photo:
                place["image"] = photo
                place["imageSource"] = "google_maps"
                updated += 1
                print("   ✓ foto")
            else:
                skipped += 1
                print("   ⊘ sin foto")

        await browser.close()

    PLACES.write_text(
        json.dumps(places, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n✓ {updated} fotos actualizadas · {skipped} sin cambio")


if __name__ == "__main__":
    asyncio.run(main())
