/**
 * Auditoría #19–20: renombra imágenes con keywords SEO y convierte JPG/PNG → WebP.
 * Actualiza referencias en src/ y docs/.
 *
 * Uso: node scripts/optimize-gallery-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");

/** @type {Record<string, string>} old public path → new public path (leading /) */
const RENAME = {
  // Raíz gallery: quitar "_resultado" y keywords
  "/gallery/cocina_1_resultado.webp":
    "/gallery/loft-cocina-equipada-miraflores-cali.webp",
  "/gallery/cuarto_1_resultado.webp":
    "/gallery/loft-habitacion-miraflores-cali.webp",
  "/gallery/sofa_1_resultado.webp":
    "/gallery/loft-sala-sofa-miraflores-cali.webp",
  "/gallery/cuarto_4_resultado.webp":
    "/gallery/loft-dormitorio-entrepiso-miraflores-cali.webp",
  "/gallery/cuarto_romantico.webp":
    "/gallery/loft-habitacion-romantica-cali.webp",
  "/gallery/cama-sofaCama.webp":
    "/gallery/loft-sofa-cama-miraflores-cali.webp",
  "/gallery/lofthouse_afuera.webp":
    "/gallery/lofthouse-14-fachada-miraflores-cali.webp",
  "/gallery/screenshot_1.webp":
    "/gallery/lofthouse-14-redes-cali-01.webp",
  "/gallery/screenshot_2.webp":
    "/gallery/lofthouse-14-redes-cali-02.webp",
  "/gallery/screenshot_3.webp":
    "/gallery/lofthouse-14-redes-cali-03.webp",
  "/gallery/screenshot_4.webp":
    "/gallery/lofthouse-14-redes-cali-04.webp",

  // Immersive: nombres de cámara → keywords (+ .webp)
  "/gallery/immersive/24-03062026-dsc05254.jpg":
    "/gallery/immersive/24-loft-interior-miraflores-cali.webp",
  "/gallery/immersive/25-03062026-dsc05261.jpg":
    "/gallery/immersive/25-loft-luz-natural-miraflores-cali.webp",
  "/gallery/immersive/26-03062026-dsc05265.jpg":
    "/gallery/immersive/26-loft-detalle-decoracion-cali.webp",
  "/gallery/immersive/27-03062026-dsc05270.jpg":
    "/gallery/immersive/27-loft-espacio-moderno-cali.webp",
  "/gallery/immersive/28-03062026-dsc05277.jpg":
    "/gallery/immersive/28-loft-ambiente-miraflores-cali.webp",
  "/gallery/immersive/29-03062026-dsc05316.jpg":
    "/gallery/immersive/29-loft-detalle-acabados-cali.webp",
  "/gallery/immersive/30-26042026-dsc00199-hdr.jpg":
    "/gallery/immersive/30-loft-vista-interior-cali.webp",
  "/gallery/immersive/31-dsc01498.jpg":
    "/gallery/immersive/31-loft-habitacion-entrepiso-cali.webp",
  "/gallery/immersive/32-dsc01626.jpg":
    "/gallery/immersive/32-bano-privado-loft-cali.webp",
  "/gallery/immersive/33-dsc01693.jpg":
    "/gallery/immersive/33-bano-detalles-loft-cali.webp",
  "/gallery/immersive/34-dsc02424.jpg":
    "/gallery/immersive/34-loft-espacio-amplio-cali.webp",
  "/gallery/immersive/35-dsc02570.jpg":
    "/gallery/immersive/35-loft-amoblado-miraflores-cali.webp",
  "/gallery/immersive/36-dsc02582.jpg":
    "/gallery/immersive/36-loft-amoblado-sala-cali.webp",
  "/gallery/immersive/37-dsc02587.jpg":
    "/gallery/immersive/37-loft-amoblado-cocina-cali.webp",
  "/gallery/immersive/38-dsc02754.jpg":
    "/gallery/immersive/38-loft-ambientacion-miraflores.webp",
  "/gallery/immersive/39-dsc02855.jpg":
    "/gallery/immersive/39-loft-detalle-miraflores-cali.webp",
  "/gallery/immersive/40-img_0446.jpg":
    "/gallery/immersive/40-bano-minimalista-loft-cali.webp",
  "/gallery/immersive/41-img_0448.jpg":
    "/gallery/immersive/41-bano-privado-moderno-cali.webp",
  "/gallery/immersive/42-img_1762.jpg":
    "/gallery/immersive/42-loft-interior-moderno-cali.webp",
  "/gallery/immersive/43-img_7988.jpg":
    "/gallery/immersive/43-loft-amoblado-parque-del-perro.webp",
  "/gallery/immersive/44-img_8015.jpg":
    "/gallery/immersive/44-loft-espacio-estadia-cali.webp",
  "/gallery/immersive/45-img_8038.jpg":
    "/gallery/immersive/45-loft-ambientacion-cali.webp",
  "/gallery/immersive/46-img_8049.jpg":
    "/gallery/immersive/46-loft-detalle-hospedaje-cali.webp",
  "/gallery/immersive/47-img_8053.jpg":
    "/gallery/immersive/47-loft-amoblado-miraflores.webp",
  "/gallery/immersive/48-img_8112.jpg":
    "/gallery/immersive/48-bano-privado-lofthouse-14.webp",
  "/gallery/immersive/49-img_8115.jpg":
    "/gallery/immersive/49-bano-detalle-acabados-cali.webp",
  "/gallery/immersive/50-img_8201.jpg":
    "/gallery/immersive/50-loft-espacio-reserva-cali.webp",
  "/gallery/immersive/51-img_8245.jpg":
    "/gallery/immersive/51-loft-amoblado-cali-miraflores.webp",
  "/gallery/immersive/52-img_8256.jpg":
    "/gallery/immersive/52-loft-ambientacion-hospedaje-cali.webp",
};

function toFs(publicPath) {
  return path.join(publicDir, publicPath.replace(/^\//, ""));
}

async function convertJpgPngToWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) return null;
  const out = filePath.replace(/\.(jpe?g|png)$/i, ".webp");
  if (fs.existsSync(out) && out !== filePath) {
    // already converted
    return out;
  }
  await sharp(filePath)
    .rotate()
    .webp({ quality: 78, effort: 4 })
    .toFile(out);
  return out;
}

function walkImages(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkImages(full, acc);
    else if (/\.(jpe?g|png|webp)$/i.test(name)) acc.push(full);
  }
  return acc;
}

function replaceInTree(from, to) {
  const roots = [
    path.join(root, "src"),
    path.join(root, "docs"),
    path.join(root, "README.md"),
  ];
  const files = [];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    const st = fs.statSync(r);
    if (st.isFile()) files.push(r);
    else {
      const stack = [r];
      while (stack.length) {
        const d = stack.pop();
        for (const name of fs.readdirSync(d)) {
          const full = path.join(d, name);
          const s = fs.statSync(full);
          if (s.isDirectory()) stack.push(full);
          else if (/\.(ts|tsx|js|jsx|mjs|md|json|css)$/i.test(name))
            files.push(full);
        }
      }
    }
  }
  let hits = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    if (!before.includes(from)) continue;
    const after = before.split(from).join(to);
    fs.writeFileSync(file, after);
    hits += 1;
  }
  return hits;
}

async function main() {
  const galleryRoot = path.join(publicDir, "gallery");
  const images = walkImages(galleryRoot);
  const mapping = { ...RENAME };

  // 1) Convert all JPG/PNG under gallery to WebP (keep descriptive stem)
  for (const file of images) {
    const ext = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;
    const rel = "/" + path.relative(publicDir, file).split(path.sep).join("/");
    if (mapping[rel]) continue; // handled in rename map (convert+rename)
    const out = await convertJpgPngToWebp(file);
    if (!out) continue;
    const outRel =
      "/" + path.relative(publicDir, out).split(path.sep).join("/");
    if (outRel !== rel) {
      mapping[rel] = outRel;
      try {
        fs.unlinkSync(file);
      } catch {
        /* keep if locked */
      }
    }
  }

  // 2) Apply explicit renames (convert if needed)
  for (const [from, to] of Object.entries(RENAME)) {
    const fromFs = toFs(from);
    const toFsPath = toFs(to);
    fs.mkdirSync(path.dirname(toFsPath), { recursive: true });

    if (!fs.existsSync(fromFs)) {
      // maybe already converted to webp with old stem
      const alt = fromFs.replace(/\.(jpe?g|png)$/i, ".webp");
      if (fs.existsSync(alt) && alt !== toFsPath) {
        fs.renameSync(alt, toFsPath);
        mapping[from.replace(/\.(jpe?g|png)$/i, ".webp")] = to;
        mapping[from] = to;
        continue;
      }
      if (fs.existsSync(toFsPath)) {
        mapping[from] = to;
        continue;
      }
      console.warn("skip missing", from);
      continue;
    }

    const needsConvert = /\.(jpe?g|png)$/i.test(fromFs);
    if (needsConvert && to.endsWith(".webp")) {
      await sharp(fromFs)
        .rotate()
        .webp({ quality: 78, effort: 4 })
        .toFile(toFsPath);
      fs.unlinkSync(fromFs);
    } else if (fromFs !== toFsPath) {
      if (fs.existsSync(toFsPath)) fs.unlinkSync(toFsPath);
      fs.renameSync(fromFs, toFsPath);
    }
    mapping[from] = to;
  }

  // 3) Rewrite code references (longest keys first)
  const keys = Object.keys(mapping).sort((a, b) => b.length - a.length);
  let filesTouched = 0;
  for (const from of keys) {
    const to = mapping[from];
    if (from === to) continue;
    filesTouched += replaceInTree(from, to);
  }

  // Also map .jpg → .webp for any leftover immersive refs converted in step 1
  console.log(
    JSON.stringify(
      {
        renames: Object.keys(mapping).length,
        filesTouched,
        sample: Object.entries(mapping).slice(0, 8),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
