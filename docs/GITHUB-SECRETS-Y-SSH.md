# GitHub Actions + SSH al Droplet (paso a paso)

## Error 1: CI falló en `format:check`

**Causa:** Prettier detectó archivos sin formatear.

**Solución local:**

```bash
cd /Users/kevin/Desktop/lofthouse14
npm run format
npm run format:check   # debe terminar sin [warn]
git add -A && git commit -m "style: aplicar Prettier para CI" && git push origin main
```

---

## Error 2: Deploy falló con `missing server host`

**Causa:** El workflow intentó SSH sin `DROPLET_HOST` en los secrets de GitHub.

**Solución (una sola vez):**

1. Abre https://github.com/kesticar92/lofthouse14/settings/environments
2. Crea o edita el environment **`production`**
3. Añade **Environment secrets**:
   - `DROPLET_HOST` → `138.197.138.158`
   - `DROPLET_SSH_KEY` → pega la clave **privada** SSH (ver sección 3)
   - `DROPLET_USER` → `root` (opcional)

4. Tras el próximo push a `main`, CI debe pasar y Deploy se ejecutará solo si los secrets existen.

Si no configuras secrets, Deploy mostrará un aviso y **no fallará** (deploy manual sigue válido).

---

## Error 3: Mac → `Permission denied (publickey)`

**Causa:** Tu Mac no tiene autorizada la clave SSH en el Droplet.

### Paso A — Comprobar si tienes clave local

```bash
ls -la ~/.ssh/id_ed25519.pub ~/.ssh/id_rsa.pub 2>/dev/null
```

Si no existe, créala:

```bash
ssh-keygen -t ed25519 -C "kevin@lofthouse14-deploy" -f ~/.ssh/id_ed25519 -N ""
```

### Paso B — Copiar la clave pública al servidor

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@138.197.138.158
```

Si `ssh-copy-id` no está disponible, usa la **consola web de DigitalOcean**:

1. Droplets → tu servidor → **Access** → **Launch Droplet Console**
2. Como root:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

3. Pega **una línea** de tu `~/.ssh/id_ed25519.pub` (en tu Mac: `cat ~/.ssh/id_ed25519.pub`)
4. Guarda, luego:

```bash
chmod 600 ~/.ssh/authorized_keys
```

### Paso C — Probar conexión

```bash
ssh root@138.197.138.158 "echo OK"
```

Debe imprimir `OK` sin pedir contraseña.

### Paso D — Deploy desde Mac

```bash
cd /Users/kevin/Desktop/lofthouse14
scripts/deploy/deploy-from-mac.sh
```

O con clave explícita:

```bash
SSH_KEY=~/.ssh/id_ed25519 scripts/deploy/deploy-from-mac.sh
```

### Paso E — Misma clave para GitHub Actions

Copia la clave **privada** (no la pública) al secret `DROPLET_SSH_KEY`:

```bash
cat ~/.ssh/id_ed25519
```

Incluye las líneas `-----BEGIN ...` y `-----END ...`.

---

## Supabase: protección de contraseñas filtradas

En el [Dashboard Supabase](https://supabase.com/dashboard/project/nxmisnpghrvqggworfry/auth/providers) → **Auth** → **Email** → activa **Leaked password protection**.

---

## Migración SQL 015 (seguridad RPC)

En **SQL Editor** de Supabase, ejecuta:

`supabase/migrations/015_revoke_anon_rpc_execute.sql`

(o ya aplicada vía MCP si el agente la ejecutó).
