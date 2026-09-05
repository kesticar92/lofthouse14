/**
 * Convierte un número entero (COP) a su representación en letras en español.
 * Soporta hasta 999.999.999.999 (cientos de miles de millones).
 *
 * Ejemplos:
 *   numeroALetras(0)        → "cero pesos"
 *   numeroALetras(1)        → "un peso"
 *   numeroALetras(80000)    → "ochenta mil pesos"
 *   numeroALetras(1234567)  → "un millón doscientos treinta y cuatro mil quinientos sesenta y siete pesos"
 */

const UNIDADES = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
];

const DECENAS = [
  "",
  "",
  "veinte",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function decenas(n: number): string {
  if (n <= 20) return UNIDADES[n];
  if (n < 30) return n === 20 ? "veinte" : `veinti${UNIDADES[n - 20]}`;
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
}

function centenas(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const c100 = CENTENAS[c];
  return resto === 0 ? c100 : `${c100} ${decenas(resto)}`.trim();
}

function miles(n: number): string {
  if (n === 0) return "";
  if (n === 1) return "mil";
  if (n < 1000) return `${centenas(n)} mil`;
  const m = Math.floor(n / 1000);
  const resto = n % 1000;
  const prefijo = m === 1 ? "mil" : `${centenas(m)} mil`;
  return resto === 0 ? prefijo : `${prefijo} ${centenas(resto)}`.trim();
}

function millones(n: number): string {
  if (n === 0) return "";
  if (n === 1) return "un millón";
  const m = Math.floor(n / 1_000_000);
  const resto = n % 1_000_000;
  const prefijo = m === 1 ? "un millón" : `${miles(m)} millones`;
  if (resto === 0) return prefijo;
  if (resto < 1000) return `${prefijo} ${centenas(resto)}`.trim();
  return `${prefijo} ${miles(resto)}`.trim();
}

export function numeroALetras(monto: number): string {
  const n = Math.max(0, Math.round(monto));
  if (n === 0) return "cero pesos";
  if (n === 1) return "un peso";
  let texto: string;
  if (n < 1000) texto = centenas(n);
  else if (n < 1_000_000) texto = miles(n);
  else texto = millones(n);
  return `${texto.trim()} pesos`;
}
