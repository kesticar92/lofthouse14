#!/usr/bin/env bash
set -euo pipefail

# Ejecutar EN EL DROPLET como root (primera vez).
#   chmod +x scripts/deploy/droplet-bootstrap.sh
#   scripts/deploy/droplet-bootstrap.sh

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates \
  curl \
  git \
  nginx \
  ufw

ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

mkdir -p /var/www/lofthouse14

echo "Bootstrap listo. Siguiente:"
echo "  scripts/deploy/droplet-install-node.sh"
