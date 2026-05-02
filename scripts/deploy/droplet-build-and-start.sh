#!/usr/bin/env bash
set -euo pipefail

# Ejecutar EN EL DROPLET como root, dentro del repo desplegado.
# Por defecto asume /var/www/lofthouse14
#
# ADVERTENCIA: en Droplets con ~512MB RAM, `next build` suele morir con SIGKILL (OOM).
# Alternativa recomendada:
#   Mac: scripts/deploy/mac-build-production.sh
#   Mac: scripts/deploy/sync-built-artifacts-from-mac.sh
#   Droplet: scripts/deploy/droplet-install-prod-deps-and-start.sh

APP_DIR="${APP_DIR:-/var/www/lofthouse14}"
cd "$APP_DIR"

if [[ ! -f package.json ]]; then
  echo "No encuentro package.json en ${APP_DIR}. ¿Subiste el código?"
  exit 1
fi

if [[ ! -f .env.production.local && ! -f .env.production ]]; then
  echo "Aviso: no hay .env.production.local ni .env.production en ${APP_DIR}."
  echo "Crea uno antes del build (variables NEXT_PUBLIC_* y servidor)."
fi

npm ci
npm run build

pm2 delete lofthouse14 2>/dev/null || true
pm2 start npm --name lofthouse14 -- start
pm2 save
pm2 startup systemd -u root --hp /root

echo "App en pm2 (nombre: lofthouse14). Configura Nginx con:"
echo "  scripts/deploy/nginx-install.sh"
