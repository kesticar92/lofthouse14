/**
 * Solapamiento de intervalos [aStart, aEnd) y [bStart, bEnd)
 * con fechas YYYY-MM-DD.
 */
export function rangesOverlap(
  aStart: string,
  aEndExclusive: string,
  bStart: string,
  bEndExclusive: string,
): boolean {
  return aStart < bEndExclusive && aEndExclusive > bStart;
}
