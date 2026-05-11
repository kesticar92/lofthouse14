# Deploy: GitHub → Digital Ocean (Droplet Ubuntu + Nginx + PM2)

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

Ya dentro del servidor:

```bash
cd /var/www/lofthouse14

git pull origin main
npm ci --include=dev
NODE_OPTIONS="--max-old-space-size=448" npm run build
pm2 restart lofthouse14
pm2 logs lofthouse14 --lines 40 --nostream
```

**Notas**

- `npm ci --include=dev`: el build de Next necesita dependencias de desarrollo (TypeScript, etc.).
- `NODE_OPTIONS=...`: en Droplets de **512 MB RAM** ayuda a evitar que `next build` muera por memoria. Si ves `Killed` o OOM, crea **swap** (2 GB) en el servidor y vuelve a intentar.
- Si `git pull` falla porque la carpeta no es un clon de Git, clona el repo en otra ruta, copia `.env.production` / `.env.local` del servidor, `npm ci`, `build`, y actualiza PM2 al nuevo `cwd` o reemplaza la carpeta (como ya hiciste una vez con `lofthouse14_new`).

Salir del SSH: `exit`.

---

## 3. Deploy desde la consola web de Digital Ocean (sin SSH local)

1. En [DigitalOcean](https://cloud.digitalocean.com) → **Droplets** → tu droplet → **Access** → **Launch Droplet Console** (consola web en el navegador).
2. Inicia sesión como `root` (o el usuario que uses).
3. Ejecuta los mismos comandos del apartado 2, pegando el bloque completo:

```bash
cd /var/www/lofthouse14 && git pull origin main && npm ci --include=dev && NODE_OPTIONS="--max-old-space-size=448" npm run build && pm2 restart lofthouse14 && sleep 3 && pm2 logs lofthouse14 --lines 30 --nostream
```

4. Espera varios minutos (sobre todo en `npm ci` y `npm run build`). Si la consola web no pega bien con **Cmd+V**, usa el menú del navegador **Editar → Pegar**.

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
