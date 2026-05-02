#!/usr/bin/env bash
set -euo pipefail

# Uso (ejecutar en tu Mac, NO dentro del Droplet):
#   chmod +x scripts/deploy/rsync-from-mac.sh
#   export DROPLET_HOST=138.197.138.158
#   export DROPLET_USER=root
#   export SSH_KEY=~/.ssh/id_ed25519          # opcional
#   scripts/deploy/rsync-from-mac.sh
#
# Opcional:
#   export LOCAL_DIR="$HOME/lofthouse14-web/lofthouse14"
#   export REMOTE_DIR="/var/www/lofthouse14"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

DROPLET_HOST="${DROPLET_HOST:?Define DROPLET_HOST (IPv4 pública)}"
DROPLET_USER="${DROPLET_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/lofthouse14}"
LOCAL_DIR="${LOCAL_DIR:-$ROOT_DIR}"

SSH_EXTRA=(-o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_EXTRA+=(-i "${SSH_KEY/#\~/$HOME}")
fi

REMOTE="${DROPLET_USER}@${DROPLET_HOST}"

# Cadena segura para rsync -e "…"
RSYNC_RSH="$(printf '%q ' ssh "${SSH_EXTRA[@]}")"

echo "→ Creando directorio remoto ${REMOTE_DIR}"
ssh "${SSH_EXTRA[@]}" "${REMOTE}" "mkdir -p '${REMOTE_DIR}'"

echo "→ rsync ${LOCAL_DIR}/ → ${REMOTE}:${REMOTE_DIR}/"
rsync -avz --delete \
  -e "${RSYNC_RSH}" \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude "*.log" \
  "${LOCAL_DIR}/" \
  "${REMOTE}:${REMOTE_DIR}/"

echo "Listo. Siguiente en el servidor:"
echo "  scripts/deploy/droplet-build-and-start.sh"
