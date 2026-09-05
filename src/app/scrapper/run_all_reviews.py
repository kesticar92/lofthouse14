#!/usr/bin/env python3
"""Ejecuta scrapers de reseñas: Google, Booking y Airbnb son obligatorios."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

SCRAPERS = (
    ("Google", "scrape_google_reviews.py"),
    ("Booking", "scrape_booking_reviews.py"),
    ("Airbnb", "airbnbReviewsScrapper.py"),
)


def run(name: str, script: str) -> bool:
    path = ROOT / script
    if not path.exists():
        print(f"✗ {name}: no existe {script}")
        return False
    print(f"\n=== {name} ===")
    result = subprocess.run([sys.executable, str(path)], cwd=str(ROOT))
    if result.returncode != 0:
        print(f"✗ {name} terminó con código {result.returncode}")
        return False
    return True


def main() -> int:
    ok = True
    for name, script in SCRAPERS:
        if not run(name, script):
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
