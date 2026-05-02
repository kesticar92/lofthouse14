#!/usr/bin/env bash
set -euo pipefail

# Ejecutar EN EL DROPLET después de sync-built-artifacts-from-mac.sh.
# Solo instala dependencias de producción y arranca pm2 (sin next build).

APP_DIR="${APP_DIR:-/var/www/lofthouse14}"
cd "$APP_DIR"

if [[ ! -f package.json ]]; then
  echo "No encuentro package.json en ${APP_DIR}"
  exit 1
fi

if [[ ! -d .next ]]; then
  echo "No hay carpeta .next. ¿Subiste el build desde tu Mac?"
  exit 1
fi

export NODE_ENV=production

echo "→ npm ci --omit=dev"
npm ci --omit=dev

pm2 delete lofthouse14 2>/dev/null || true
pm2 start npm --name lofthouse14 -- start
pm2 save
pm2 startup systemd -u root --hp /root

echo "Arrancado. Estado:"
pm2 status lofthouse14

echo "Siguiente: Nginx"
echo "  export SERVER_NAME=tu-ip-o-dominio"
echo "  scripts/deploy/nginx-install.sh"
