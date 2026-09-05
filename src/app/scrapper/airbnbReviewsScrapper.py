#!/usr/bin/env python3
"""Importa reseñas Airbnb (todas las publicaciones por loft + casa grupos)."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parent
LISTINGS_FILE = ROOT / "reviews" / "airbnb_listings.json"


def _reviews_dir() -> Path:
    override = os.environ.get("LOFTHOUSE_REVIEWS_DIR", "").strip()
    if override:
        path = Path(override)
        path.mkdir(parents=True, exist_ok=True)
        return path
    return ROOT / "reviews"


OUT = _reviews_dir() / "reseñas_airbnb.json"


def load_listings() -> list[dict]:
    data = json.loads(LISTINGS_FILE.read_text(encoding="utf-8"))
    return [
        {
            "id": item["id"],
            "url": item["url"].split("?")[0],
            "label": item["label"],
            "loftCode": item["loftCode"],
        }
        for item in data
    ]


def parse_payload(payload: dict, listing_id: str) -> list[dict]:
    try:
        items = payload["data"]["presentation"]["stayProductDetailPage"]["reviews"]["reviews"]
    except (KeyError, TypeError):
        return []

    out: list[dict] = []
    for r in items:
        comments = (r.get("comments") or "").strip()
        created = r.get("createdAt") or ""
        fecha = (
            created[:10]
            if len(created) >= 10
            else datetime.now(timezone.utc).date().isoformat()
        )
        reviewer = r.get("reviewer") or {}
        name = (reviewer.get("firstName") or "Huésped").strip()
        avatar = reviewer.get("pictureUrl") or ""
        rating = r.get("rating") if r.get("rating") is not None else 5
        out.append(
            {
                "nombre": name,
                "calificacion": str(rating),
                "comentario": comments,
                "fecha": fecha,
                "listing_id": listing_id,
                "avatar": avatar,
            }
        )
    return out


def merge_payloads(payloads: list[dict], listing_id: str) -> list[dict]:
    by_key: dict[tuple, dict] = {}
    for payload in payloads:
        for row in parse_payload(payload, listing_id):
            key = (
                row.get("listing_id"),
                row.get("nombre"),
                row.get("fecha"),
                (row.get("comentario") or "")[:120],
            )
            by_key[key] = row
    return list(by_key.values())


def open_reviews_modal(page: Page) -> None:
    selectors = (
        '[data-testid="pdp-reviews-modal-trigger"]',
        'button[data-testid="listing-page-reviews"]',
        'a[href="#reviews"]',
        '[data-section-id="REVIEWS_DEFAULT"] button',
        'button:has-text("reseñas")',
        'button:has-text("Reseñas")',
    )
    for sel in selectors:
        loc = page.locator(sel).first
        if not loc.count():
            continue
        try:
            loc.click(timeout=5000)
            page.wait_for_timeout(2500)
            return
        except Exception:
            continue

    # Scroll hasta la sección de reseñas en la página
    page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.55)")
    page.wait_for_timeout(2000)


def scroll_reviews_surface(page: Page, rounds: int = 35) -> None:
    dialog = page.locator('[role="dialog"], [data-testid="modal-container"]').first
    for _ in range(rounds):
        if dialog.count():
            try:
                dialog.evaluate(
                    """(el) => {
                    const scrollable = el.querySelector('[data-testid="modal-scroll-panel"]')
                      || el.querySelector('.scrollable-area')
                      || el;
                    scrollable.scrollTop = scrollable.scrollHeight;
                }""",
                )
            except Exception:
                pass
        else:
            page.mouse.wheel(0, 2200)
        page.wait_for_timeout(1100)


def scrape_listing(page: Page, listing: dict) -> list[dict]:
    captured: list[dict] = []

    def on_response(resp) -> None:
        url = resp.url
        if not any(k in url for k in ("StaysPdpReviewsQuery", "PdpReviews", "GetReviews")):
            return
        try:
            captured.append(resp.json())
        except Exception:
            pass

    page.on("response", on_response)
    page.goto(listing["url"], wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(8000)
    open_reviews_modal(page)
    scroll_reviews_surface(page)
    page.wait_for_timeout(3000)
    page.remove_listener("response", on_response)

    if not captured:
        return []

    rows = merge_payloads(captured, listing["id"])
    return rows


def merge_reviews(existing: list[dict], incoming: list[dict]) -> list[dict]:
    by_key: dict[tuple, dict] = {}
    for r in existing + incoming:
        key = (
            r.get("listing_id"),
            r.get("nombre"),
            r.get("fecha"),
            (r.get("comentario") or "")[:120],
        )
        by_key[key] = r
    merged = list(by_key.values())
    merged.sort(key=lambda x: x.get("fecha", ""), reverse=True)
    return merged


def main() -> None:
    listings = load_listings()
    existing: list[dict] = []
    if OUT.exists():
        try:
            existing = json.loads(OUT.read_text(encoding="utf-8")).get("reseñas", [])
        except json.JSONDecodeError:
            existing = []

    all_reviews: list[dict] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        context = browser.new_context(
            locale="es-CO",
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1440, "height": 900},
        )
        page = context.new_page()
        page.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})",
        )

        for listing in listings:
            print(f"→ {listing['label']} ({listing['id']})…")
            chunk = scrape_listing(page, listing)
            print(f"   {len(chunk)} reseñas en esta pasada")
            all_reviews.extend(chunk)

        browser.close()

    unique = merge_reviews(existing, all_reviews)
    today = datetime.now(timezone.utc).date().isoformat()

    OUT.write_text(
        json.dumps(
            {
                "origen": "Airbnb",
                "actualizado": today,
                "total_reseñas": len(unique),
                "listings": listings,
                "reseñas": unique,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"✓ Airbnb: {len(unique)} reseñas totales en {OUT} (actualizado {today})")


if __name__ == "__main__":
    main()
