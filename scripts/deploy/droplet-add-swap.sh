#!/usr/bin/env bash
set -euo pipefail

# Opcional: si npm run build muere por RAM en Droplets pequeños (512MB).
# Ejecutar EN EL DROPLET como root.
#
# Crea /swapfile de 2G. Ajusta SWAP_MB si quieres.

SWAP_MB="${SWAP_MB:-2048}"

if swapon --show | grep -q '/swapfile'; then
  echo "Swap ya activo."
  exit 0
fi

fallocate -l "${SWAP_MB}M" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count="${SWAP_MB}"
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

sysctl vm.swappiness=10
grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "Swap ${SWAP_MB}M activo."
