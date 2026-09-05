/**
 * Catálogo de inventario — basado en "Inventario LOFTHOUSE.xlsx" (hoja Catalogo_Zonas).
 * 95 ítems por loft habitacional + 14 ítems especiales para la bodega del Loft 4.
 */

export type InventoryItem = {
  orden: number;
  zona: string;
  item: string;
  ayuda?: string;
};

/** Listado de lofts habitacionales. El Loft 4 es bodega, no se hospeda. */
export const LOFTS_HABITACIONALES = [
  1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
] as const;

export const TODOS_LOS_LOFTS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
] as const;

/** Lofts que SÍ tienen cortina de ventana en 2º piso. */
const CORTINA_VENTANA_2P = [1, 5, 7, 8, 14];
/** Lofts que SÍ tienen cortina de ventana en 1er piso. */
const CORTINA_VENTANA_1P = [1, 7, 8, 14];

/** Devuelve true si el item requiere marcar "No aplica" para ese loft. */
export function itemNoAplica(loft: number, item: string): boolean {
  if (/Cortinas de VENTANA \(2º nivel\)/i.test(item)) {
    return !CORTINA_VENTANA_2P.includes(loft);
  }
  if (/Cortinas de VENTANA \(1er nivel \/ sala\)/i.test(item)) {
    return !CORTINA_VENTANA_1P.includes(loft);
  }
  // Loft 5 no tiene sofá cama en 2º nivel ni segunda sofá cama en sala
  if (loft === 5) {
    if (/Sofá cama \(2º nivel/i.test(item)) return true;
    if (/Sofá cama sala — segunda unidad/i.test(item)) return true;
  }
  return false;
}

/** Catálogo principal para todos los lofts habitacionales. */
export const CATALOGO_LOFT: InventoryItem[] = [
  {
    orden: 1,
    zona: "Baño (2º nivel)",
    item: "Extractor de aire / calor del baño (enciende y aspira)",
    ayuda: "Probar: aspira y no suena raro",
  },
  { orden: 2, zona: "Baño (2º nivel)", item: "Interruptor de Luz Baño" },
  { orden: 3, zona: "Baño (2º nivel)", item: "Luz de Baño" },
  { orden: 4, zona: "Baño (2º nivel)", item: "1 Papelera de Baño con Bolsa" },
  { orden: 5, zona: "Baño (2º nivel)", item: "ALFOMBRA DE BAÑO" },
  {
    orden: 6,
    zona: "Baño (2º nivel)",
    item: "CORTINA DE DUCHA (baño) — plástico/tela de la ducha",
    ayuda: "Esto NO es cortina de ventana; es la de la ducha.",
  },
  {
    orden: 7,
    zona: "Baño (2º nivel)",
    item: "1 Papel Higienico en Portarrollos",
  },
  { orden: 8, zona: "Baño (2º nivel)", item: "1 Papel Higienico de reserva" },
  { orden: 9, zona: "Baño (2º nivel)", item: "2 Jabones Hoteleros" },
  {
    orden: 10,
    zona: "Baño (2º nivel)",
    item: "1 Recipiente de Jabon Liquido a la mitad (Baño)",
  },
  { orden: 11, zona: "Baño (2º nivel)", item: "1 Toalla de Mano" },
  { orden: 12, zona: "Baño (2º nivel)", item: "2 Toallas de Cuerpo" },
  {
    orden: 13,
    zona: "Baño (2º nivel)",
    item: "Paredes y pintura (baño): manchas, humedad, golpes",
    ayuda: "Anotar en Detalles si hay problema",
  },
  {
    orden: 14,
    zona: "Tragaluz (2º nivel)",
    item: "Acrílicos / cerramiento del tragaluz: limpios, sin grietas",
  },
  {
    orden: 15,
    zona: "Tragaluz (2º nivel)",
    item: "Marco / sellos del tragaluz: sin goteras ni filtraciones",
  },
  {
    orden: 16,
    zona: "Dormitorio (2º nivel)",
    item: "Cortinas de VENTANA (2º nivel)",
    ayuda:
      "SOLO aplica a lofts 1, 5, 7, 8 y 14. En los demás: marcar «No aplica».",
  },
  {
    orden: 17,
    zona: "Dormitorio (2º nivel)",
    item: "Interruptor de Luz 2º Nivel",
  },
  { orden: 18, zona: "Dormitorio (2º nivel)", item: "Luz de 2º Nivel" },
  { orden: 19, zona: "Dormitorio (2º nivel)", item: "AIRE ACONDICIONADO" },
  { orden: 20, zona: "Dormitorio (2º nivel)", item: "EXTENSION DE ENERGIA" },
  { orden: 21, zona: "Dormitorio (2º nivel)", item: "PLANCHA DE ROPA" },
  {
    orden: 22,
    zona: "Dormitorio (2º nivel)",
    item: "Ventilador (2º nivel / dormitorio, si aplica)",
  },
  { orden: 23, zona: "Dormitorio (2º nivel)", item: "1 CAMA" },
  {
    orden: 24,
    zona: "Dormitorio (2º nivel)",
    item: "1 Protector de Colchon antifluido",
  },
  { orden: 25, zona: "Dormitorio (2º nivel)", item: "1 Sabana Ajustable" },
  { orden: 26, zona: "Dormitorio (2º nivel)", item: "1 Sabana Plana" },
  { orden: 27, zona: "Dormitorio (2º nivel)", item: "1 Edredon" },
  { orden: 28, zona: "Dormitorio (2º nivel)", item: "1 Cobija Peluda" },
  {
    orden: 29,
    zona: "Dormitorio (2º nivel)",
    item: "2 Almohadas con Funda Antifluido",
  },
  {
    orden: 30,
    zona: "Dormitorio (2º nivel)",
    item: "1 Almohada con Funda del Edredon",
  },
  { orden: 31, zona: "Dormitorio (2º nivel)", item: "1 Mesa de Noche" },
  {
    orden: 32,
    zona: "Dormitorio (2º nivel)",
    item: "1 Lampara de mesa de noche",
  },
  {
    orden: 33,
    zona: "Dormitorio (2º nivel)",
    item: "Mueble para ropa / closet",
  },
  {
    orden: 34,
    zona: "Dormitorio (2º nivel)",
    item: "Sofá cama (2º nivel / dormitorio)",
    ayuda: "Loft 5 no tiene. Resto: 1 sofá cama arriba.",
  },
  { orden: 35, zona: "Dormitorio (2º nivel)", item: "1 TELEVISOR" },
  { orden: 36, zona: "Dormitorio (2º nivel)", item: "2 Controles (TV & ROKU)" },
  {
    orden: 37,
    zona: "Dormitorio (2º nivel)",
    item: "Tomacorriente debajo del televisor (2º nivel)",
  },
  {
    orden: 38,
    zona: "Dormitorio (2º nivel)",
    item: "Tomacorriente detrás de la mesa de noche / nochero (2º nivel)",
  },
  {
    orden: 39,
    zona: "Dormitorio (2º nivel)",
    item: "Paredes y pintura (dormitorio 2º)",
  },
  { orden: 40, zona: "Escaleras", item: "Pasamanos / barandas: firmes" },
  { orden: 41, zona: "Escaleras", item: "Escalones: huellas y bordes" },
  {
    orden: 42,
    zona: "Escaleras",
    item: "Paredes y pintura (hueco de escaleras)",
  },
  {
    orden: 43,
    zona: "Cocina (1er nivel)",
    item: "Interruptor & Luz de la Cocina",
  },
  {
    orden: 44,
    zona: "Cocina (1er nivel)",
    item: "Tomacorriente en zona de cocina (1er nivel)",
  },
  {
    orden: 45,
    zona: "Cocina (1er nivel)",
    item: "Tomacorriente detrás de la nevera (1er nivel)",
  },
  { orden: 46, zona: "Cocina (1er nivel)", item: "NEVERA" },
  { orden: 47, zona: "Cocina (1er nivel)", item: "BANDEJA PARA HIELOS" },
  {
    orden: 48,
    zona: "Cocina (1er nivel)",
    item: "BASURERO DE COCINA (CON BOLSA)",
  },
  { orden: 49, zona: "Cocina (1er nivel)", item: "AMBIENTADOR" },
  { orden: 50, zona: "Cocina (1er nivel)", item: "HORNO MICROONDAS" },
  { orden: 51, zona: "Cocina (1er nivel)", item: "CAFETERA" },
  { orden: 52, zona: "Cocina (1er nivel)", item: "ARROCERA" },
  { orden: 53, zona: "Cocina (1er nivel)", item: "LICUADORA" },
  { orden: 54, zona: "Cocina (1er nivel)", item: "SANDWICHERA" },
  { orden: 55, zona: "Cocina (1er nivel)", item: "1 olla grande" },
  { orden: 56, zona: "Cocina (1er nivel)", item: "1 olla de hervir agua" },
  { orden: 57, zona: "Cocina (1er nivel)", item: "1 cacerola" },
  { orden: 58, zona: "Cocina (1er nivel)", item: "1 sarten" },
  { orden: 59, zona: "Cocina (1er nivel)", item: "4 Vasos de vidrio" },
  { orden: 60, zona: "Cocina (1er nivel)", item: "4 Pocillos" },
  { orden: 61, zona: "Cocina (1er nivel)", item: "2 copas de vino" },
  { orden: 62, zona: "Cocina (1er nivel)", item: "4 platos hondos" },
  { orden: 63, zona: "Cocina (1er nivel)", item: "4 platos grandes" },
  { orden: 64, zona: "Cocina (1er nivel)", item: "2 platos pequeños" },
  { orden: 65, zona: "Cocina (1er nivel)", item: "4 cucharas" },
  { orden: 66, zona: "Cocina (1er nivel)", item: "4 tenedores" },
  { orden: 67, zona: "Cocina (1er nivel)", item: "4 cuchillos" },
  {
    orden: 68,
    zona: "Cocina (1er nivel)",
    item: "Utensilios (Espatula, Cucharon) de Plastico",
  },
  { orden: 69, zona: "Cocina (1er nivel)", item: "1 colador" },
  { orden: 70, zona: "Cocina (1er nivel)", item: "1 rallador" },
  { orden: 71, zona: "Cocina (1er nivel)", item: "1 abrelatas" },
  { orden: 72, zona: "Cocina (1er nivel)", item: "1 pinza metalica" },
  { orden: 73, zona: "Cocina (1er nivel)", item: "1 exprimidor de limon" },
  { orden: 74, zona: "Cocina (1er nivel)", item: "1 sacacorchos" },
  { orden: 75, zona: "Cocina (1er nivel)", item: "1 tabla de picar" },
  { orden: 76, zona: "Cocina (1er nivel)", item: "1 cuchillo de cocina" },
  { orden: 77, zona: "Cocina (1er nivel)", item: "1 limpion de cocina" },
  {
    orden: 78,
    zona: "Cocina (1er nivel)",
    item: "1 Recipiente de Jabon Liquido a la mitad (Cocina)",
  },
  {
    orden: 79,
    zona: "Cocina (1er nivel)",
    item: "1 Esponja de lavar en buen estado",
  },
  { orden: 80, zona: "Cocina (1er nivel)", item: "1 Encendedor de Estufa" },
  { orden: 81, zona: "Cocina (1er nivel)", item: "Paredes y pintura (cocina)" },
  {
    orden: 82,
    zona: "Sala-comedor (1er nivel)",
    item: "Cortinas de VENTANA (1er nivel / sala)",
    ayuda: "SOLO aplica a lofts 1, 7, 8 y 14. En los demás: «No aplica».",
  },
  {
    orden: 83,
    zona: "Sala-comedor (1er nivel)",
    item: "Interruptor de Luz 1º Nivel",
  },
  { orden: 84, zona: "Sala-comedor (1er nivel)", item: "Luz de 1º Nivel" },
  {
    orden: 85,
    zona: "Sala-comedor (1er nivel)",
    item: "Ventilador (sala-comedor)",
  },
  {
    orden: 86,
    zona: "Sala-comedor (1er nivel)",
    item: "Tomacorriente detrás de sofá cama / sala (1 de 2) (1er nivel)",
  },
  {
    orden: 87,
    zona: "Sala-comedor (1er nivel)",
    item: "Tomacorriente detrás de sofá cama / sala (2 de 2) (1er nivel)",
  },
  {
    orden: 88,
    zona: "Sala-comedor (1er nivel)",
    item: "Sofá cama sala — primera unidad (1er nivel)",
    ayuda: "Loft 5: su ÚNICA sofá cama abajo. Demás: primera de dos.",
  },
  {
    orden: 89,
    zona: "Sala-comedor (1er nivel)",
    item: "Sofá cama sala — segunda unidad (1er nivel)",
    ayuda: "Loft 5: «No aplica». Demás: segunda sofá cama abajo.",
  },
  { orden: 90, zona: "Sala-comedor (1er nivel)", item: "ALFOMBRA" },
  { orden: 91, zona: "Sala-comedor (1er nivel)", item: "COJINES" },
  { orden: 92, zona: "Sala-comedor (1er nivel)", item: "PLANTA DECORATIVA" },
  {
    orden: 93,
    zona: "Sala-comedor (1er nivel)",
    item: "Paredes y pintura (sala-comedor)",
  },
  { orden: 94, zona: "Entrada / general (1er nivel)", item: "LLAVE Y CHAPA" },
  {
    orden: 95,
    zona: "Entrada / general (1er nivel)",
    item: "Observaciones generales del loft",
    ayuda: "Texto libre en Detalles",
  },
];

/** Catálogo especial de la bodega del Loft 4. */
export const CATALOGO_ALMACEN_LOFT4: InventoryItem[] = [
  {
    orden: 1,
    zona: "Almacén Loft 4",
    item: "Ropa de cama de repuesto (juegos completos / sueltas)",
    ayuda: "Contar y describir cantidad en Detalles si hace falta",
  },
  {
    orden: 2,
    zona: "Almacén Loft 4",
    item: "Sábanas / fundas / cobijas de repuesto",
  },
  { orden: 3, zona: "Almacén Loft 4", item: "Toallas de repuesto" },
  {
    orden: 4,
    zona: "Almacén Loft 4",
    item: "Colchones o colchonetas para sofá cama",
    ayuda:
      "Los que se llevan a otros lofts cuando el sofá cama se usa como cama",
  },
  {
    orden: 5,
    zona: "Almacén Loft 4",
    item: "Implementos de aseo: escobas, traperos, baldes, escobillas",
  },
  {
    orden: 6,
    zona: "Almacén Loft 4",
    item: "Químicos / productos de limpieza (stock)",
    ayuda: "Tapas y etiquetas",
  },
  {
    orden: 7,
    zona: "Almacén Loft 4",
    item: "Repuesto cocina: platos, vasos, cubiertos, ollas sueltas, etc.",
  },
  {
    orden: 8,
    zona: "Almacén Loft 4",
    item: "Repuesto menaje pequeño (abrelatas, tablas, etc.)",
  },
  {
    orden: 9,
    zona: "Almacén Loft 4",
    item: "Almohadas / cojines / protectores de repuesto",
  },
  {
    orden: 10,
    zona: "Almacén Loft 4",
    item: "Colchones / bases / piezas sueltas de mobiliario",
  },
  {
    orden: 11,
    zona: "Almacén Loft 4",
    item: "Tomacorrientes / extensiones / focos de repuesto",
  },
  {
    orden: 12,
    zona: "Almacén Loft 4",
    item: "Paredes, pintura y humedades (bodega)",
  },
  {
    orden: 13,
    zona: "Almacén Loft 4",
    item: "Orden general y bicheras (bodega limpia y ordenada)",
  },
  {
    orden: 14,
    zona: "Almacén Loft 4",
    item: "Observaciones del inventario de bodega",
    ayuda: "Texto libre",
  },
];

export function getCatalogo(loft: number): InventoryItem[] {
  return loft === 4 ? CATALOGO_ALMACEN_LOFT4 : CATALOGO_LOFT;
}

export type EstadoItem = "Presente" | "Ausente" | "Dañado" | "No aplica" | "";
export type Funciona = "Sí" | "No" | "No aplica" | "";

export const ESTADOS: EstadoItem[] = [
  "Presente",
  "Ausente",
  "Dañado",
  "No aplica",
];
export const FUNCIONA_OPCIONES: Funciona[] = ["Sí", "No", "No aplica"];
