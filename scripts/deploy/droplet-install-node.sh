#!/usr/bin/env bash
set -euo pipefail

# Ejecutar EN EL DROPLET como root.
# Instala Node.js 22.x (NodeSource).

export DEBIAN_FRONTEND=noninteractive

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

node -v
npm -v

npm install -g pm2

echo "Node + pm2 listos. Subir código con rsync-from-mac.sh y luego:"
echo "  scripts/deploy/droplet-build-and-start.sh"
