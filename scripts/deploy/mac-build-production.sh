#!/usr/bin/env bash
set -euo pipefail

# Ejecutar en tu Mac, dentro del repo lofthouse14.
# Hace npm ci + next build usando tu RAM local (evita SIGKILL en Droplets chicos).
#
# Requiere .env.production.local (o .env.production) para variables NEXT_PUBLIC_*.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.production.local && ! -f .env.production ]]; then
  echo "Falta .env.production.local o .env.production en ${ROOT_DIR}"
  exit 1
fi

echo "→ npm ci"
npm ci

echo "→ NODE_OPTIONS=${NODE_OPTIONS:-'(sin override)'}"
echo "→ npm run build"
npm run build

echo "Build OK. Siguiente:"
echo "  scripts/deploy/sync-built-artifacts-from-mac.sh"
