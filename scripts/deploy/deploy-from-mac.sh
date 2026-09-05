#!/usr/bin/env bash
# =============================================================================
# deploy-from-mac.sh — Un solo comando: Mac → Droplet → clona main y reinicia PM2
#
# Requisito: tu clave SSH debe estar en el Droplet (root@138.197.138.158).
# Si falla "Permission denied", añade tu clave pública:
#   ssh-copy-id -i ~/.ssh/id_ed25519.pub root@138.197.138.158
# O usa la consola web de Digital Ocean (ver docs/DEPLOY.md §3).
# =============================================================================
set -euo pipefail

DROPLET_HOST="${DROPLET_HOST:-138.197.138.158}"
DROPLET_USER="${DROPLET_USER:-root}"
BRANCH="${BRANCH:-main}"
NODE_HEAP_MB="${NODE_HEAP_MB:-2048}"

SSH_EXTRA=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_EXTRA+=(-i "${SSH_KEY/#\~/$HOME}")
fi

REMOTE="${DROPLET_USER}@${DROPLET_HOST}"

echo "→ Conectando a ${REMOTE} y ejecutando redeploy desde GitHub (${BRANCH})…"

ssh "${SSH_EXTRA[@]}" "${REMOTE}" bash -s <<EOF
set -euo pipefail
curl -fsSL "https://raw.githubusercontent.com/kesticar92/lofthouse14/${BRANCH}/scripts/deploy/redeploy-from-github.sh" \\
  -o /tmp/redeploy.sh
BRANCH=${BRANCH} NODE_HEAP_MB=${NODE_HEAP_MB} bash /tmp/redeploy.sh
EOF

echo ""
echo "✓ Deploy lanzado en el servidor. Comprueba: https://lofthouse14.com"
echo "  Log en el Droplet: ls -t /var/log/lh14-redeploy-*.log | head -1 | xargs tail -f"
