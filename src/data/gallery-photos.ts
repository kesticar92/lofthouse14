/** Fotos de la galería immersiva (orden narrativo). Alts con keywords locales (#18). */
export type GalleryPhoto = {
  src: string;
  alt: string;
  /** Etiqueta corta visible en lightbox (espacio · momento). */
  caption?: string;
  /** Momento o matiz (día/noche, detalle); se combina con caption si ambos existen. */
  moment?: string;
};

/** Texto visible en UI: prioriza caption (+ moment) sobre alt SEO. */
export function galleryPhotoLabel(photo: GalleryPhoto): string {
  if (photo.caption && photo.moment) {
    return `${photo.caption} · ${photo.moment}`;
  }
  return photo.caption ?? photo.moment ?? photo.alt;
}

/**
 * Curada para identificar espacios: se eliminaron clones casi idénticos
 * (varios sofácamas / gabinetes / dormitorios genéricos) y se etiquetaron
 * pares día/noche del mismo sujeto.
 */
export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    src: "/gallery/immersive/09-fachada_diurna.webp",
    alt: "Fachada diurna de lofts en Miraflores Cali cerca del Parque del Perro — Lofthouse 14",
    caption: "Fachada",
    moment: "Día",
  },
  {
    src: "/gallery/immersive/11-fachada_sillas_diurna.webp",
    alt: "Terraza exterior con sillas en lofts Miraflores Cali — Lofthouse 14",
    caption: "Patio exterior",
    moment: "Día",
  },
  {
    src: "/gallery/immersive/10-fachada_nocturna.webp",
    alt: "Fachada nocturna de Lofthouse 14 en Miraflores, Cali",
    caption: "Fachada",
    moment: "Noche",
  },
  {
    src: "/gallery/immersive/06-corredor_salida.webp",
    alt: "Corredor de acceso a lofts en Miraflores Cali",
    caption: "Corredor",
    moment: "Salida al patio",
  },
  {
    src: "/gallery/immersive/05-corredor.webp",
    alt: "Corredor interior de lofts en Miraflores Cali",
    caption: "Corredor",
    moment: "Acceso a lofts",
  },
  {
    src: "/gallery/immersive/18-sala_cocina_escalera.webp",
    alt: "Loft en Cali con sala, cocina equipada y escalera al entrepiso",
    caption: "Sala · Cocina · Escalera",
  },
  {
    src: "/gallery/immersive/21-sofacamas_izquierda.webp",
    alt: "Zona de sofá camas en loft Miraflores cerca del Parque del Perro",
    caption: "Sofá cama",
    moment: "Zona de estar",
  },
  {
    src: "/gallery/immersive/22-sofacamas_izquierda_con_ventilador.webp",
    alt: "Área de sofá camas con ventilador en loft Lofthouse 14",
    caption: "Sofá cama",
    moment: "Con ventilador",
  },
  {
    src: "/gallery/immersive/07-escalera_5.webp",
    alt: "Escalera al entrepiso de loft en Miraflores Cali",
    caption: "Escalera",
    moment: "Al entrepiso",
  },
  {
    src: "/gallery/immersive/01-cocina_completa_comedor_escalera_izquierda.webp",
    alt: "Cocina completa y comedor de loft en Miraflores Cali",
    caption: "Cocina",
    moment: "Vista completa",
  },
  {
    src: "/gallery/immersive/03-cocina_escalera_derecha.webp",
    alt: "Cocina bajo la escalera en loft Lofthouse 14 Cali",
    caption: "Cocina",
    moment: "Bajo la escalera",
  },
  {
    src: "/gallery/immersive/53-comedor_con_cena.webp",
    alt: "Comedor preparado para cenar en loft Cali Miraflores",
    caption: "Comedor",
    moment: "Cena servida",
  },
  {
    src: "/gallery/immersive/04-comedor_con_vino_izquierdo.webp",
    alt: "Comedor con vino en loft romántico en Cali",
    caption: "Comedor",
    moment: "Ambiente romántico",
  },
  {
    src: "/gallery/immersive/08-estufa_completa_izquierda.webp",
    alt: "Estufa y utensilios de cocina equipada en loft Cali",
    caption: "Cocina",
    moment: "Estufa equipada",
  },
  {
    src: "/gallery/immersive/23-utencilios_cocina.webp",
    alt: "Utensilios de cocina listos en loft Lofthouse 14",
    caption: "Cocina",
    moment: "Utensilios",
  },
  {
    src: "/gallery/immersive/34-loft-espacio-amplio-cali.webp",
    alt: "Loft con ventana a la calle y luz de barrio en Miraflores Cali",
    caption: "Ventana a calle",
    moment: "Loft Vista",
  },
  {
    src: "/gallery/cuarto_2.webp",
    alt: "Dormitorio con ventana al patio interior y vegetación — Lofthouse 14",
    caption: "Ventana a atrio",
    moment: "Loft Atrio",
  },
  {
    src: "/gallery/immersive/30-loft-vista-interior-cali.webp",
    alt: "Dormitorio con TV y ventana interior en loft amoblado en Cali",
    caption: "Dormitorio",
    moment: "Ventana interior",
  },
  {
    src: "/gallery/immersive/28-loft-ambiente-miraflores-cali.webp",
    alt: "Dormitorio en entrepiso con barandilla en loft Miraflores Cali",
    caption: "Entrepiso",
    moment: "Loft Cielo",
  },
  {
    src: "/gallery/immersive/31-loft-habitacion-entrepiso-cali.webp",
    alt: "Habitación en entrepiso de loft Miraflores Cali",
    caption: "Entrepiso",
    moment: "Camas twin",
  },
  {
    src: "/gallery/immersive/42-loft-interior-moderno-cali.webp",
    alt: "Interior moderno de loft en Miraflores Cali con entrepiso",
    caption: "Entrepiso",
    moment: "Cama y TV",
  },
  {
    src: "/gallery/immersive/44-loft-espacio-estadia-cali.webp",
    alt: "Espacio de estadía en loft Lofthouse 14 Cali con escalera",
    caption: "Loft completo",
    moment: "Sala bajo escalera",
  },
  {
    src: "/gallery/immersive/25-loft-luz-natural-miraflores-cali.webp",
    alt: "Habitación íntima con luz cálida en loft Miraflores Cali",
    caption: "Dormitorio",
    moment: "Ambiente íntimo",
  },
  {
    src: "/gallery/immersive/32-bano-privado-loft-cali.webp",
    alt: "Baño privado de loft en Cali — Lofthouse 14",
    caption: "Baño",
    moment: "Privado",
  },
  {
    src: "/gallery/immersive/40-bano-minimalista-loft-cali.webp",
    alt: "Baño minimalista privado en loft Cali",
    caption: "Baño",
    moment: "Minimalista",
  },
];
