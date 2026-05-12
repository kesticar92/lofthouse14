#!/usr/bin/env bash
# =============================================================================
# redeploy-from-github.sh
# -----------------------------------------------------------------------------
# Re-despliega el proyecto en el Droplet clonando la última versión de
# `main` desde GitHub. Pensado para ejecutarse cuando /var/www/lofthouse14
# NO es un repo Git (caso de la instalación inicial por rsync).
#
# Qué hace, en orden:
#   1.  Detiene PM2 (sin borrar el proceso aún).
#   2.  Clona el repo en /var/www/lofthouse14_new.
#   3.  Copia los .env* del directorio actual al nuevo (preserva secretos).
#   4.  Renombra el directorio actual como lofthouse14_old_<timestamp> (backup).
#   5.  Activa el directorio nuevo como /var/www/lofthouse14.
#   6.  Parchea next.config.ts para saltar lint y typecheck en build
#       (evita OOM en Droplets con RAM limitada).
#   7.  npm ci  →  next build (con NODE_OPTIONS para más heap).
#   8.  Reinicia PM2 limpio y guarda el estado.
#   9.  Muestra los últimos logs y deja un log completo en /var/log/.
#
# Uso (en el Droplet, como root):
#   bash scripts/deploy/redeploy-from-github.sh
#
# Variables opcionales:
#   APP_DIR          Directorio de la app (default: /var/www/lofthouse14)
#   REPO_URL         URL del repo (default: https://github.com/kesticar92/lofthouse14.git)
#   BRANCH           Rama a desplegar (default: main)
#   NODE_HEAP_MB     Memoria máx para Node (default: 1536)
#   PM2_NAME         Nombre del proceso PM2 (default: lofthouse14)
#
# Ejemplo:
#   BRANCH=main NODE_HEAP_MB=2048 bash scripts/deploy/redeploy-from-github.sh
# =============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/lofthouse14}"
REPO_URL="${REPO_URL:-https://github.com/kesticar92/lofthouse14.git}"
BRANCH="${BRANCH:-main}"
NODE_HEAP_MB="${NODE_HEAP_MB:-1536}"
PM2_NAME="${PM2_NAME:-lofthouse14}"

PARENT_DIR="$(dirname "$APP_DIR")"
APP_NAME="$(basename "$APP_DIR")"
TS="$(date +%Y%m%d_%H%M%S)"
NEW_DIR="${PARENT_DIR}/${APP_NAME}_new"
BACKUP_DIR="${PARENT_DIR}/${APP_NAME}_old_${TS}"
LOG_FILE="/var/log/lh14-redeploy-${TS}.log"

bold()  { printf "\033[1m%s\033[0m\n" "$*"; }
info()  { printf "[\033[34m%s\033[0m] %s\n" "$(date +%H:%M:%S)" "$*"; }
ok()    { printf "[\033[32mOK\033[0m]    %s\n" "$*"; }
warn()  { printf "[\033[33mWARN\033[0m]  %s\n" "$*"; }
fail()  { printf "[\033[31mFAIL\033[0m]  %s\n" "$*"; exit 1; }

mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

bold "=================================================================="
bold "  REDEPLOY desde GitHub  →  ${BRANCH}"
bold "  APP_DIR=${APP_DIR}"
bold "  REPO=${REPO_URL}"
bold "  Backup destino: ${BACKUP_DIR}"
bold "  Log: ${LOG_FILE}"
bold "=================================================================="

# ---------- 0. Validaciones previas ----------------------------------------
command -v git >/dev/null      || fail "git no está instalado."
command -v npm >/dev/null      || fail "npm no está instalado."
command -v node >/dev/null     || fail "node no está instalado."
command -v pm2 >/dev/null      || fail "pm2 no está instalado (npm i -g pm2)."

if [[ ! -d "$APP_DIR" ]]; then
  warn "No existe ${APP_DIR}. Se creará vacío y se clonará por primera vez."
  mkdir -p "$APP_DIR"
fi

# ---------- 1. Detener PM2 -------------------------------------------------
info "[1/9] Deteniendo PM2 (${PM2_NAME})…"
pm2 stop "${PM2_NAME}" 2>/dev/null || warn "pm2 ${PM2_NAME} no estaba corriendo."

# ---------- 2. Clonar repo limpio -----------------------------------------
info "[2/9] Clonando ${REPO_URL} (${BRANCH}) en ${NEW_DIR}…"
rm -rf "$NEW_DIR"
git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$NEW_DIR"
NEW_COMMIT="$(git -C "$NEW_DIR" rev-parse --short HEAD)"
ok "Clonado commit ${NEW_COMMIT} de ${BRANCH}."

# ---------- 3. Copiar .env* y artefactos sensibles ------------------------
info "[3/9] Copiando archivos de entorno desde ${APP_DIR}…"
shopt -s nullglob
copied=0
for f in "$APP_DIR"/.env "$APP_DIR"/.env.local "$APP_DIR"/.env.production \
         "$APP_DIR"/.env.production.local "$APP_DIR"/.env.development.local; do
  if [[ -f "$f" ]]; then
    cp "$f" "$NEW_DIR/$(basename "$f")"
    ok "  copiado $(basename "$f")"
    copied=$((copied+1))
  fi
done
shopt -u nullglob
if [[ "$copied" -eq 0 ]]; then
  warn "No se encontraron archivos .env*. Asegúrate de configurarlos antes del start."
fi

# Si existe carpeta uploads/ local (poco probable en este proyecto), también la traemos
if [[ -d "$APP_DIR/uploads" ]]; then
  cp -a "$APP_DIR/uploads" "$NEW_DIR/uploads"
  ok "  copiado uploads/"
fi

# ---------- 4. Swap de directorios ----------------------------------------
info "[4/9] Backup ${APP_DIR}  →  ${BACKUP_DIR}"
if [[ -d "$APP_DIR" ]]; then
  mv "$APP_DIR" "$BACKUP_DIR"
fi
mv "$NEW_DIR" "$APP_DIR"
cd "$APP_DIR"
ok "Swap completado. Directorio activo: ${APP_DIR}"

# ---------- 5. Parche next.config.ts (anti-OOM) ---------------------------
info "[5/9] Asegurando ignoreDuringBuilds + ignoreBuildErrors en next.config.ts…"
if [[ -f next.config.ts ]]; then
  if grep -q "ignoreDuringBuilds" next.config.ts && grep -q "ignoreBuildErrors" next.config.ts; then
    ok "next.config.ts ya tiene los flags."
  else
    # Insertar justo después de la línea `const nextConfig: NextConfig = {`
    sed -i '/^const nextConfig: NextConfig = {/a\  eslint: { ignoreDuringBuilds: true },\n  typescript: { ignoreBuildErrors: true },' next.config.ts
    ok "Parcheado next.config.ts."
  fi
else
  warn "No se encontró next.config.ts (¿estructura cambió?)."
fi

# ---------- 6. npm ci -----------------------------------------------------
info "[6/9] npm ci --include=dev (esto puede tardar 1-3 min)…"
npm ci --include=dev

# ---------- 7. Build de producción ----------------------------------------
info "[7/9] next build (NODE_OPTIONS=--max-old-space-size=${NODE_HEAP_MB})…"
NODE_OPTIONS="--max-old-space-size=${NODE_HEAP_MB}" npm run build
[[ -f .next/BUILD_ID ]] || fail "Build falló: no se generó .next/BUILD_ID."
ok "Build OK (BUILD_ID=$(cat .next/BUILD_ID))."

# ---------- 8. PM2 restart ------------------------------------------------
info "[8/9] Reiniciando PM2…"
pm2 delete all 2>/dev/null || true
pm2 start npm --name "${PM2_NAME}" -- start
pm2 save
sleep 5
pm2 status

# ---------- 9. Logs finales -----------------------------------------------
info "[9/9] Últimos logs de ${PM2_NAME}:"
pm2 logs "${PM2_NAME}" --lines 25 --nostream || true

bold "=================================================================="
bold "  DEPLOY COMPLETO"
bold "  Commit desplegado: ${NEW_COMMIT} (rama ${BRANCH})"
bold "  Backup anterior:   ${BACKUP_DIR}"
bold "  Log de deploy:     ${LOG_FILE}"
bold "  Sitio:             https://lofthouse14.com (Cmd+Shift+R)"
bold "=================================================================="
bold ""
bold "Si algo falla y quieres revertir:"
bold "  pm2 stop ${PM2_NAME} && rm -rf ${APP_DIR} && mv ${BACKUP_DIR} ${APP_DIR} && \\"
bold "    cd ${APP_DIR} && pm2 restart ${PM2_NAME} --update-env"
