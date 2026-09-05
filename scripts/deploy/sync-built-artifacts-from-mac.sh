#!/usr/bin/env bash
set -euo pipefail

# Ejecutar en tu Mac DESPUÉS de mac-build-production.sh.
# Sube código fuente + carpeta .next al Droplet (sin node_modules).
#
# Requiere haber corrido antes en el Droplet (una vez):
#   scripts/deploy/droplet-install-node.sh   # Node + pm2
#
# Variables:
#   DROPLET_HOST  (obligatoria)
#   DROPLET_USER  (default root)
#   REMOTE_DIR    (default /var/www/lofthouse14)
#   SSH_KEY       (opcional, ej ~/.ssh/id_ed25519)
#   LOCAL_DIR     (opcional; por defecto raíz del repo)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

DROPLET_HOST="${DROPLET_HOST:?Define DROPLET_HOST}"
DROPLET_USER="${DROPLET_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/lofthouse14}"
LOCAL_DIR="${LOCAL_DIR:-$ROOT_DIR}"

SSH_EXTRA=(-o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_EXTRA+=(-i "${SSH_KEY/#\~/$HOME}")
fi

REMOTE="${DROPLET_USER}@${DROPLET_HOST}"
RSYNC_RSH="$(printf '%q ' ssh "${SSH_EXTRA[@]}")"

if [[ ! -d "${LOCAL_DIR}/.next" ]]; then
  echo "No existe ${LOCAL_DIR}/.next — ejecuta antes scripts/deploy/mac-build-production.sh"
  exit 1
fi

echo "→ Creando directorio remoto"
ssh "${SSH_EXTRA[@]}" "${REMOTE}" "mkdir -p '${REMOTE_DIR}'"

echo "→ rsync (incluye .next)"
rsync -avz --delete \
  -e "${RSYNC_RSH}" \
  --exclude node_modules \
  --exclude .git \
  --exclude "*.log" \
  "${LOCAL_DIR}/" \
  "${REMOTE}:${REMOTE_DIR}/"

echo "→ Subiendo .env.production.local si existe localmente"
if [[ -f "${LOCAL_DIR}/.env.production.local" ]]; then
  scp "${SSH_EXTRA[@]}" "${LOCAL_DIR}/.env.production.local" "${REMOTE}:${REMOTE_DIR}/.env.production.local"
else
  echo "  (omitido: no hay .env.production.local local)"
fi

echo "Listo. En el Droplet ejecuta:"
echo "  scripts/deploy/droplet-install-prod-deps-and-start.sh"
