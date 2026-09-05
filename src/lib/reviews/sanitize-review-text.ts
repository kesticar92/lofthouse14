/** Quita HTML del scrape y normaliza espacios para mostrar texto plano. */
export function sanitizeReviewText(raw: string): string {
  let s = raw.trim();
  s = s.replace(/<br\s*\/?>/gi, " ");
  s = s.replace(/<\/p>\s*<p[^>]*>/gi, " ");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/&lt;/gi, "<");
  s = s.replace(/&gt;/gi, ">");
  s = s.replace(/&quot;/gi, '"');
  s = s.replace(/&#39;/gi, "'");
  s = s.replace(/Habitaciones[\d.,]+\s*Servicio[\d.,]+.*$/gi, "");
  s = s.replace(/Aspectos destacados del hotel.*$/gi, "");
  s = s.replace(/…\s*Más información\s*$/gi, "");
  s = s.replace(/\s+Más información\s*$/gi, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}
