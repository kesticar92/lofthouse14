import {
  ESTADOS,
  FUNCIONA_OPCIONES,
  getCatalogo,
  itemNoAplica,
  type EstadoItem,
  type Funciona,
} from "@/lib/inventory-catalog";
import type { FotoEvidenciaServer } from "@/features/inventarios/types";

export type EditableItem = {
  serverId: string | null;
  orden: number;
  zona: string;
  item: string;
  estado: EstadoItem | "";
  funciona: Funciona | "";
  detalles: string;
  requiereAtencion: boolean;
  fotos: FotoEvidenciaServer[];
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function itemRequiereEvidenciaDanio(it: EditableItem): boolean {
  return it.estado === "Dañado" || it.funciona === "No";
}

export function buildEmpty(loft: number): EditableItem[] {
  const catalogo = getCatalogo(loft);
  return catalogo.map((c) => {
    const noAplica = itemNoAplica(loft, c.item);
    return {
      serverId: null,
      orden: c.orden,
      zona: c.zona,
      item: c.item,
      estado: noAplica ? "No aplica" : "",
      funciona: noAplica ? "No aplica" : "",
      detalles: "",
      requiereAtencion: false,
      fotos: [],
    };
  });
}

export { ESTADOS, FUNCIONA_OPCIONES };
