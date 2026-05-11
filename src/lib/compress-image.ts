"use client";

/**
 * Comprime una imagen del lado del cliente para que quepa cómodamente en
 * localStorage y en el PDF generado.
 *
 * Estrategia:
 *  1. Carga el File en un <img> a través de un object URL.
 *  2. Lo dibuja en un <canvas> redimensionando manteniendo proporción si
 *     supera `maxDimension`.
 *  3. Exporta el canvas como JPEG con calidad `quality` (data URL base64).
 *
 * Devuelve `{ dataUrl, bytes }`. `bytes` es el tamaño aproximado del data URL
 * en bytes UTF-8 (útil para chequear el cupo de localStorage, ~5 MB).
 */
export async function compressImage(
  file: File,
  opts: { maxDimension?: number; quality?: number; mimeType?: string } = {},
): Promise<{ dataUrl: string; bytes: number }> {
  const maxDimension = opts.maxDimension ?? 1280;
  const quality = opts.quality ?? 0.7;
  const mimeType = opts.mimeType ?? "image/jpeg";

  if (typeof window === "undefined") {
    throw new Error("compressImage solo funciona en el navegador");
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { width, height } = scaleToFit(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      maxDimension,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D no disponible");
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL(mimeType, quality);
    return { dataUrl, bytes: estimateDataUrlBytes(dataUrl) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

function scaleToFit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w / h;
  if (w >= h) {
    return { width: max, height: Math.round(max / ratio) };
  }
  return { width: Math.round(max * ratio), height: max };
}

/** Aproxima el peso en bytes de un data URL base64. */
function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(",");
  const base64Len = commaIdx >= 0 ? dataUrl.length - commaIdx - 1 : dataUrl.length;
  return Math.floor((base64Len * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
