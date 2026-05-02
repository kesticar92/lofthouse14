#!/usr/bin/env bash
set -euo pipefail

# Ejecutar EN EL DROPLET como root.
# Uso:
#   export SERVER_NAME=tudominio.com   # o tu IPv4 para pruebas
#   scripts/deploy/nginx-install.sh
#
# Luego (con dominio real):
#   apt-get install -y certbot python3-certbot-nginx
#   certbot --nginx -d tudominio.com

SERVER_NAME="${SERVER_NAME:?Define SERVER_NAME (dominio o IP pública)}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP="/tmp/lofthouse14-nginx.conf"

sed "s/SERVER_NAME/${SERVER_NAME}/g" "${HERE}/nginx-site.conf.template" > "$TMP"

install -m 0644 "$TMP" /etc/nginx/sites-available/lofthouse14
ln -sf /etc/nginx/sites-available/lofthouse14 /etc/nginx/sites-enabled/lofthouse14

nginx -t
systemctl reload nginx

echo "Nginx OK → http://${SERVER_NAME}"
echo "Si es dominio con DNS apuntando aquí, corre certbot."
