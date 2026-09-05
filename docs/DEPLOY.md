# Deploy: GitHub → Digital Ocean (Droplet Ubuntu + Nginx + PM2)

## Resumen (qué es cada cosa)

| Paso              | Dónde                                               | Qué hace                                                                                                                                          |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Git push**   | Tu Mac → **GitHub**                                 | Guarda el código en `main`. **No toca el servidor.**                                                                                              |
| **2. Redeploy**   | **Digital Ocean** (Droplet)                         | Descarga `main` desde GitHub, hace `npm ci` + `build`, reinicia PM2. **Esto publica la web.**                                                     |
| **CI**            | **GitHub Actions** (`.github/workflows/ci.yml`)     | `format:check`, `lint`, `typecheck`, `test`, `build` en cada push/PR.                                                                             |
| **CD (opcional)** | **GitHub Actions** (`.github/workflows/deploy.yml`) | Tras push a `main`, SSH al Droplet si configuras secrets en environment `production`: `DROPLET_HOST`, `DROPLET_SSH_KEY`, opcional `DROPLET_USER`. |

**IP del Droplet:** `138.197.138.158` → `https://lofthouse14.com`

### Un comando desde tu Mac (si tienes SSH al servidor)

```bash
chmod +x scripts/deploy/deploy-from-mac.sh
scripts/deploy/deploy-from-mac.sh
```

### Sin SSH en tu Mac (consola web de Digital Ocean)

1. [cloud.digitalocean.com](https://cloud.digitalocean.com) → Droplets → tu servidor → **Access** → **Launch Droplet Console**
2. Pega y ejecuta:

```bash
curl -fsSL https://raw.githubusercontent.com/kesticar92/lofthouse14/main/scripts/deploy/redeploy-from-github.sh -o /tmp/redeploy.sh && BRANCH=main NODE_HEAP_MB=2048 bash /tmp/redeploy.sh
```

---

Este proyecto usa **Next.js** en producción con `next start` bajo **PM2**. Nginx hace de proxy hacia el puerto donde escucha Node (típicamente **3000**). La base de datos es **Supabase** (migraciones en `supabase/migrations/`); muchos cambios solo requieren aplicar SQL en Supabase y **no** obligan a redeployar la app.

---

## 1. Subir cambios desde tu Mac (terminal local → GitHub)

Desde la carpeta del proyecto:

```bash
cd /ruta/a/lofthouse14

git status
git add -A
git commit -m "tipo(ámbito): descripción breve

Cuerpo opcional:
- qué cambió y por qué
- migraciones Supabase si aplica (nombres de archivo)
- variables de entorno nuevas si aplica
"

git push origin main
```

**Buenas prácticas del mensaje de commit**

- Primera línea: imperativo, ~72 caracteres, clara (ej. `fix(pms): evitar arrastre en reservas iCal`).
- Si el cambio es grande, lista viñetas en el cuerpo: módulos tocados, riesgos, cómo probar.

Tras el `push`, GitHub queda actualizado. **El Droplet no se actualiza solo** salvo que tengas un webhook o CI que lo haga (este repo no lo incluye por defecto).

---

## 2. Deploy en el servidor (SSH desde tu Mac)

Sustituye `IP_DEL_DROPLET` y la ruta si en tu máquina el proyecto no está en `/var/www/lofthouse14`:

```bash
ssh root@IP_DEL_DROPLET
```

### Opción A — Re-deploy automatizado desde GitHub (recomendado)

Este flujo funciona **incluso si `/var/www/lofthouse14` no es un repo Git** (instalación inicial por rsync, o `.git` borrado). Clona el repo limpio, conserva los `.env*` actuales, parchea `next.config.ts` para evitar OOM y reinicia PM2.

Un solo comando, ya dentro del servidor:

```bash
curl -fsSL https://raw.githubusercontent.com/kesticar92/lofthouse14/main/scripts/deploy/redeploy-from-github.sh \
  -o /tmp/redeploy.sh && bash /tmp/redeploy.sh
```

Variables opcionales (anteponlas al `bash`):

```bash
BRANCH=main NODE_HEAP_MB=2048 bash /tmp/redeploy.sh
```

El script crea un backup en `/var/www/lofthouse14_old_<timestamp>` y un log en `/var/log/lh14-redeploy-<timestamp>.log`. Si algo sale mal:

```bash
pm2 stop lofthouse14
rm -rf /var/www/lofthouse14
mv /var/www/lofthouse14_old_<timestamp> /var/www/lofthouse14
cd /var/www/lofthouse14 && pm2 restart lofthouse14 --update-env
```

### Opción B — Comando a comando (cuando ya hay clon de Git en el servidor)

```bash
cd /var/www/lofthouse14

git pull origin main
npm ci --include=dev
NODE_OPTIONS="--max-old-space-size=1536" npm run build
pm2 restart lofthouse14
pm2 logs lofthouse14 --lines 40 --nostream
```

**Notas**

- `npm ci --include=dev`: el build de Next necesita dependencias de desarrollo (TypeScript, etc.).
- `NODE_OPTIONS=...`: en Droplets pequeños ayuda a evitar que `next build` muera por memoria. Si ves `Killed` o OOM, crea **swap** (2 GB) en el servidor y vuelve a intentar.
- Si `git pull` falla porque la carpeta no es un clon de Git, **usa la Opción A** (script automatizado).

Salir del SSH: `exit`.

---

## 3. Deploy desde la consola web de Digital Ocean (sin SSH local)

1. En [DigitalOcean](https://cloud.digitalocean.com) → **Droplets** → tu droplet → **Access** → **Launch Droplet Console** (consola web en el navegador).
2. Inicia sesión como `root` (o el usuario que uses).
3. Pega el siguiente bloque (descarga el script `redeploy-from-github.sh` y lo ejecuta — sirve aunque la carpeta no tenga `.git`):

```bash
curl -fsSL https://raw.githubusercontent.com/kesticar92/lofthouse14/main/scripts/deploy/redeploy-from-github.sh -o /tmp/redeploy.sh && bash /tmp/redeploy.sh
```

4. Espera varios minutos (sobre todo en `npm ci` y `npm run build`). Si la consola web no pega bien con **Cmd+V**, usa el menú del navegador **Editar → Pegar**. La sesión puede cerrarse durante el build; si pasa, vuelve a abrir la consola y revisa el log con `tail -f /var/log/lh14-redeploy-*.log`.

---

## 4. Supabase (migraciones)

Las migraciones viven en `supabase/migrations/`. Si añades una nueva:

- Aplícala en el proyecto correcto (Dashboard → SQL Editor, o `supabase db push`, o MCP según tu flujo).
- Documenta en el commit qué migración toca producción.

Algunos cambios (p. ej. triggers, RLS, funciones) **solo** requieren Supabase y no necesitan `npm run build` en el Droplet.

---

## 5. Comprobar el sitio

```bash
curl -sI https://lofthouse14.com | head -5
```

Deberías ver `HTTP/2 200` (o `HTTP/1.1 200`) si Nginx enruta bien al proceso Node.

---

## 6. Si la web “no funciona” tras un deploy (errores frecuentes)

### A) `fatal: not a git repository`

La carpeta `/var/www/lofthouse14` no es un clon de Git (se subió por SFTP o se borró `.git`). Opción segura:

```bash
cd /var/www
pm2 stop lofthouse14

# Respalda env y sube de nuevo el código con git
TS=$(date +%Y%m%d_%H%M%S)
[ -d lofthouse14 ] && mv lofthouse14 "lofthouse14_backup_${TS}"

git clone https://github.com/kesticar92/lofthouse14.git lofthouse14
cd lofthouse14

# Copia variables desde el backup (ajusta el nombre de la carpeta backup)
# cp ../lofthouse14_backup_${TS}/.env.production.local .   # si existía
# cp ../lofthouse14_backup_${TS}/.env.local .

nano .env.production.local   # créalo si no existe: ver sección B)

npm ci --include=dev
# Build: ver sección C (memoria)
NODE_OPTIONS="--max-old-space-size=768" npm run build
pm2 restart lofthouse14 --update-env
pm2 save
```

Luego vuelve a apuntar PM2 al `cwd` correcto si el proceso usa ruta absoluta antigua:

```bash
pm2 delete lofthouse14
cd /var/www/lofthouse14 && pm2 start npm --name lofthouse14 -- start
pm2 save
```

_(Si ya tenías otro comando `pm2 start`, úsalo igual que antes; lo importante es que el `cwd` sea `/var/www/lofthouse14`.)_

### B) `Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor`

Next carga en producción, entre otros, **`.env.production.local`** en la raíz del proyecto (junto a `package.json`). Crea o edita ese archivo **en el Droplet** (no se sube a GitHub):

```bash
nano /var/www/lofthouse14/.env.production.local
```

Mínimo para que el panel y las APIs admin funcionen:

```env
NEXT_PUBLIC_SITE_URL=https://lofthouse14.com
NEXT_PUBLIC_SUPABASE_URL=https://TU_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
SUPABASE_SERVICE_ROLE_KEY=eyJ… o sb_secret_…
```

Guarda (`Ctrl+O`, Enter, `Ctrl+X`) y reinicia:

```bash
cd /var/www/lofthouse14
pm2 restart lofthouse14 --update-env
```

_(La clave `service_role` solo en el servidor; nunca en el repo ni en variables `NEXT*PUBLIC*_`.)\*

### C) `JavaScript heap out of memory` durante `npm run build`

En un Droplet de **512 MB RAM**, `next build` suele necesitar más memoria virtual. Si ya tienes **swap** (tu log mostró ~3% de uso, bien), sube el límite del heap y vuelve a compilar:

```bash
cd /var/www/lofthouse14
NODE_OPTIONS="--max-old-space-size=768" npm run build
```

Si aún falla, aumenta swap a **2 GB** (una vez):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
grep -q swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Luego repite el `npm run build` con `768` u `896`.

### D) `Failed to find Server Action` en logs

Suele ser caché del navegador o mezcla de **build viejo** con **código nuevo** tras un build fallido. Tras un `npm run build` **exitoso**, haz un hard refresh (Ctrl+Shift+R) o prueba en ventana privada.

---

## 7. Orden recomendado en un Droplet “roto”

1. Variables en `.env.production.local` (sección B).
2. Código actualizado con `git` (sección A si hace falta).
3. `npm ci --include=dev` → `npm run build` con heap y swap (sección C).
4. `pm2 restart lofthouse14 --update-env` → revisar `pm2 logs`.
