import { airbnbListings } from "@/lib/reviews/airbnb-listings";
import { site } from "@/lib/site";

export const LOFT_AMENITIES = [
  "WiFi de alta velocidad",
  "Aire acondicionado",
  "Cocina equipada",
  "Smart TV",
  "Baño privado",
  "Check-in autónomo",
] as const;

export type LoftUnit = {
  code: string;
  slug: string;
  name: string;
  headline: string;
  seoTitle: string;
  metaDescription: string;
  shortDescription: string;
  description: string;
  image: string;
  gallery: string[];
  guestsIdeal: number;
  guestsMax: number;
  priceFromCop: number;
  airbnbUrl: string;
  type: "loft" | "casa";
};

const GALLERY_POOL = [
  "/gallery/loft-01_resultado.webp",
  "/gallery/loft-02_resultado.webp",
  "/gallery/cocina_1_resultado.webp",
  "/gallery/cuarto_1_resultado.webp",
  "/gallery/sofa_1_resultado.webp",
  "/gallery/cuarto_4_resultado.webp",
  "/gallery/cocina_2.webp",
  "/gallery/cuarto_2.webp",
  "/gallery/cuarto_romantico.webp",
  "/gallery/immersive/09-fachada_diurna.jpg",
  "/gallery/immersive/18-sala_cocina_escalera.jpg",
  "/gallery/immersive/01-cocina_completa_comedor_escalera_izquierda.jpg",
  "/gallery/immersive/21-sofacamas_izquierda.jpg",
] as const;

function listingUrl(code: string): string {
  return (
    airbnbListings.find((l) => l.loftCode === code)?.url ?? site.google_url
  );
}

function loftSlug(code: string): string {
  return `loft-${code}-cali-miraflores`;
}

const LOFT_COPY: Record<
  string,
  Pick<LoftUnit, "headline" | "shortDescription" | "description">
> = {
  "01": {
    headline: "Estudio privado en Miraflores, Cali",
    shortDescription:
      "Loft 01 para 2 personas en Miraflores, a pasos del Parque del Perro. WiFi, A/C y cocina equipada.",
    description:
      "El Loft 01 de Lofthouse 14 es un estudio privado en el barrio Miraflores de Cali, pensado para viajeros que quieren hospedarse cerca del Parque del Perro sin renunciar a cocina, WiFi y aire acondicionado. Está a pocos minutos de restaurantes, cafés y la vida nocturna de San Fernando, y sirve igual de bien para una pareja, un nómada digital o alguien que viene por una cita médica. La tarifa base parte desde $80.000 COP por noche para dos personas en temporada baja; el tercer huésped tiene un cargo adicional. El check-in es autónomo: tras verificar identidad y anticipo recibes las instrucciones de acceso por WhatsApp. El espacio incluye cama, baño privado, Smart TV y zona de preparación de alimentos para desayunar o calentar algo al volver de la ciudad. Si buscas un loft en alquiler en Cali con ubicación clara y precio visible desde el primer contacto, esta unidad es la base más simple del edificio.",
  },
  "02": {
    headline: "Loft moderno cerca del Parque del Perro",
    shortDescription:
      "Loft 02 moderno en Cali Miraflores, ideal para pareja o trabajo remoto junto al Parque del Perro.",
    description:
      "El Loft 02 combina un interior moderno con la ubicación que más buscan quienes preguntan por hotel cerca del Parque del Perro en Cali: estás en Miraflores, no en un corredor hotelero genérico. Es un apartaestudio con cocina equipada, aire acondicionado y WiFi para videollamadas o streaming después de caminar por la zona. Ideal para 2 personas y con cupo de hasta 5 si viajas con familia pequeña. Desde aquí llegas a pie a gastronomía, salsa y servicios; el Estadio Pascual Guerrero y San Antonio quedan a un trayecto corto en transporte. Reservar directo con Lofthouse 14 evita comisiones de plataformas y te da un interlocutor local por WhatsApp para fechas, anticipo e ingreso autónomo. La tarifa base es la misma del resto de lofts individuales: desde $80.000 COP por noche en temporada baja para dos huéspedes, con aseo según duración de la estadía.",
  },
  "03": {
    headline: "Apartaestudio amoblado en San Fernando / Miraflores",
    shortDescription:
      "Loft 03 amoblado en Cali, práctico para estadías cortas junto a San Fernando y clínicas cercanas.",
    description:
      "El Loft 03 es un apartamento amoblado de corta estancia en Cali, en el límite de Miraflores y San Fernando. Sirve a turistas, parejas y a quienes necesitan hospedaje médico cerca de clínicas sin vivir en un hotel tradicional. Encontrarás cama cómoda, baño privado, cocina para comidas simples, WiFi y aire acondicionado —amenidades descritas en texto para que Google y tú sepan exactamente qué incluye el loft. El barrio concentra farmacias, supermercados y restaurantes; el Parque del Perro queda a pocos minutos. Capacidad ideal 2 personas, máximo 5. Check-in autónomo con verificación de identidad. Precio desde $80.000 COP por noche (2 personas, temporada baja). Si vienes por rotación, tratamiento o un fin de semana de salsa, esta unidad te deja a distancia caminable de lo esencial y con un anfitrión local para resolver horarios, parqueadero cercano o lofts extra si llega más gente del grupo.",
  },
  "05": {
    headline: "Loft con cocina equipada en Cali",
    shortDescription:
      "Loft 05 con cocina completa en Miraflores. Ideal si quieres desayunar en casa y salir al Parque del Perro.",
    description:
      "El Loft 05 destaca para quien busca un loft con cocina equipada en Cali por noche: nevera, estufa y utensilios para preparar desayuno o una cena ligera después de recorrer Miraflores. Es un apartaestudio privado con WiFi, A/C, Smart TV y baño propio. La zona del Parque del Perro ofrece restaurantes si prefieres no cocinar; tener cocina te ahorra tiempo y presupuesto, sobre todo en estadías de varias noches. Ideal 2 personas, máximo 5. Lofthouse 14 opera 14 lofts en el mismo edificio, así que si viajas con amigos puedes pedir unidades contiguas y seguir reuniéndote en la calle o en un loft común para grupos. Reserva directo: fechas, huéspedes y anticipo por WhatsApp, ingreso autónomo el día de llegada. Tarifa desde $80.000 COP por noche en temporada baja. Dirección: Carrera 26 # 2-91, Miraflores, Cali.",
  },
  "06": {
    headline: "Base cómoda para nómadas digitales en Cali",
    shortDescription:
      "Loft 06 con WiFi en Miraflores, pensado para teletrabajo y estadías de varias semanas en Cali.",
    description:
      "El Loft 06 está pensado como apartamento para nómadas digitales en Cali: WiFi estable, escritorio improvisado en la zona de estar, cocina para no depender de delivery todos los días y un barrio con cafés a poca distancia. Miraflores y el Parque del Perro mezclan vida local con servicios, mejor que un hotel genérico del norte si quieres caminar al terminar de trabajar. Capacidad 2 ideal, hasta 5. El check-in autónomo evita recepciones y horarios rígidos; coordinamos Early Check-in si tu vuelo llega temprano. Tarifas semanales se cierran por WhatsApp según fechas. Precio de referencia desde $80.000 COP/noche para dos personas en temporada baja. Si viajas en pareja y ambos trabajan remoto, un solo loft suele bastar; si cada quien necesita privacidad, reserva dos unidades en el mismo edificio. Lofthouse 14 no es un coworking, es hospedaje con lo esencial para producir y descansar en Cali.",
  },
  "07": {
    headline: "Hospedaje cerca de clínicas en San Fernando",
    shortDescription:
      "Loft 07 en Miraflores, práctico para acompañantes y pacientes que visitan clínicas de San Fernando, Cali.",
    description:
      "El Loft 07 responde a búsquedas de hospedaje médico en Cali: estás en Miraflores, a un trayecto corto de clínicas y consultorios de San Fernando, con cocina, nevera para medicamentos o alimentos blandos, WiFi y un espacio silencioso para descansar entre citas. No es un hotel hospitalario; es un loft privado con baño propio, aire acondicionado y check-in autónomo para llegar a la hora que te programen. Ideal 2 personas (paciente + acompañante), máximo 5. Estadías de varias noches o semanas se cotizan por WhatsApp, incluyendo aseo. Precio base desde $80.000 COP por noche. La zona tiene farmacias, transporte y comida a cualquier hora razonable. Si el grupo familiar es más grande, Lofthouse 14 puede asignar lofts extra en el mismo predio para que nadie se disperse por la ciudad. Dirección pública: Carrera 26 # 2-91, Miraflores, Cali, Valle del Cauca.",
  },
  "08": {
    headline: "Loft para pareja en el corazón de Cali",
    shortDescription:
      "Loft 08 íntimo en Miraflores. Parejas que quieren salsa, gastronomía y un refugio con A/C al volver.",
    description:
      "El Loft 08 es un loft en Cali para pareja: un solo espacio privado, cama, baño, cocina y aire acondicionado para volver después de salsa, una cena en el Parque del Perro o un día en San Antonio. Miraflores concentra la oferta gastronómica que buscas cuando preguntas dónde hospedarse en Cali, Colombia, sin alejarte de la vida del centro-sur. Capacidad ideal 2; si viaja un tercero, aplica recargo. Check-in autónomo, anticipo del 50% y saldo el día de llegada. Desde $80.000 COP por noche en temporada baja. No se permiten fiestas; el edificio es residencial y el silencio nocturno se respeta. Si celebras un cumpleaños íntimo, avísanos: podemos orientar restaurantes cercanos, no un evento en el loft. Reserva directo en lofthouse14.com o WhatsApp +57 317 424 6076 para ver fechas reales y no una tarifa opaca de OTA.",
  },
  "09": {
    headline: "Alojamiento cerca del Estadio Pascual Guerrero",
    shortDescription:
      "Loft 09 en Miraflores, conveniente si vienes por fútbol, eventos en el Pascual Guerrero o San Fernando.",
    description:
      "El Loft 09 conviene a quien busca alojamiento cerca del Estadio Pascual Guerrero: desde Miraflores llegas al estadio y a San Fernando en un trayecto urbano corto, y vuelves a un loft con ducha, A/C y cocina en lugar de un hotel genérico. Sirve a hinchas, staff de eventos, familias que combinan partido y turismo, o delegaciones pequeñas que pueden tomar varios lofts en Lofthouse 14. Capacidad 2 ideal, 5 máximo por unidad. WiFi, Smart TV y check-in autónomo. Precio desde $80.000 COP/noche (2 personas, temporada baja). El Parque del Perro queda a pasos para comer antes o después del evento. No operamos como palco ni paquete de entradas; sí como hospedaje claro, con reglas de no fiestas y verificación de identidad. Si viaja un grupo de más de 5, usa la página de casa entera o pide varios lofts para mantener al equipo en el mismo edificio.",
  },
  "10": {
    headline: "Loft para bailarines y noches de salsa en Cali",
    shortDescription:
      "Loft 10 en Miraflores: vuelve a ducharte y descansar después de academias y rumba cerca del Parque del Perro.",
    description:
      "El Loft 10 está pensado para quien busca un loft para bailarines de salsa en Cali: Miraflores y el Parque del Perro concentran academias, bares y rumba; aquí tienes ducha, A/C, cama y un espacio privado para estirar sin compartir hostel. No es un estudio de danza; es hospedaje silencioso para dormir de día si ensayas de noche. Ideal 2 personas, hasta 5. WiFi para clases virtuales, cocina para comer a deshoras y check-in autónomo cuando tu vuelo no coincide con recepción. Desde $80.000 COP por noche. Si vienes a un festival o congreso, reserva con anticipación: las fechas pico se llenan. Grupos de pareja de baile o teams pueden tomar lofts contiguos en Lofthouse 14. Normas claras: no fiestas en el inmueble, visitas acordadas y capacidad declarada. WhatsApp +57 317 424 6076 para bloquear noches.",
  },
  "11": {
    headline: "Estadía flexible en Miraflores para trabajo o ocio",
    shortDescription:
      "Loft 11 equilibrado: turismo, teletrabajo o visita familiar en Cali, con precio base visible.",
    description:
      "El Loft 11 es un loft en alquiler en Cali para quien no encaja en un solo perfil: turista de fin de semana, profesional en visita, pareja o alguien que combina reuniones y gastronomía en Miraflores. El espacio es un apartaestudio con las mismas amenidades del edificio —WiFi, aire acondicionado, cocina equipada, Smart TV, baño privado e ingreso autónomo— descritas en texto para que no dependas de un ícono. Capacidad 2 ideal, 5 máximo. Desde $80.000 COP por noche en temporada baja. El Parque del Perro, San Fernando y rutas hacia San Antonio o el oeste de Cali quedan a mano. Reserva directo para ver el total estimado (alojamiento, aseo, huéspedes extra) antes de pagar anticipo. Si más adelante se suma familia, podemos cotizar un segundo loft en el mismo Lofthouse 14 en lugar de moverte a otro barrio.",
  },
  "12": {
    headline: "Loft familiar pequeño en Cali Miraflores",
    shortDescription:
      "Loft 12 para familias compactas: hasta 5 personas en un solo apartaestudio en Miraflores.",
    description:
      "El Loft 12 funciona como hospedaje en Cali Miraflores para familias pequeñas que prefieren un solo apartaestudio antes de tomar dos habitaciones de hotel. Capacidad máxima 5 personas; la tarifa base cubre 2 y desde el tercero hay recargo por noche. Cocina para desayunos, WiFi para que niños o adultos ocupen pantallas con sentido, A/C y baño privado. El Parque del Perro ofrece opciones para comer en grupo; el loft es el refugio, no un salón de fiestas. Check-in autónomo con documento de cada adulto. Precio desde $80.000 COP/noche (2 personas, temporada baja). Si viajan abuelos o primos, Lofthouse 14 puede asignar el Loft 13 o 14 al lado para no separar al grupo por la ciudad. Dirección: Carrera 26 # 2-91. Políticas de no fumar interior y silencio nocturno aplican igual que en el resto de unidades.",
  },
  "13": {
    headline: "Loft silencioso para descansar en Cali",
    shortDescription:
      "Loft 13 en Miraflores, para quienes priorizan descanso, A/C y un barrio con servicios 24/7 cerca.",
    description:
      "El Loft 13 es para viajeros que buscan dónde dormir en Cali barato y cómodo sin hostel: un loft privado con cama, A/C, cortinas y baño propio en Miraflores. No prometemos lujo cinco estrellas; prometemos un espacio funcional, precio claro desde $80.000 COP por noche (2 personas, temporada baja) y un anfitrión que responde por WhatsApp. Ideal si llegas tarde del aeropuerto Alfonso Bonilla Aragón, si tienes una sola noche entre buses, o si quieres una base limpia para conocer el Parque del Perro, San Antonio y la salsa. Capacidad 2–5. Cocina y WiFi incluidas. Check-in autónomo. Si el calendario está lleno, mira los otros lofts del mismo edificio: la experiencia de ubicación es la misma. Reserva directo en el sitio para evitar sorpresas de limpieza o huéspedes extra que a veces no se leen en plataformas.",
  },
  "14": {
    headline: "Cierra el edificio: loft 14 en Lofthouse 14",
    shortDescription:
      "Loft 14 en Cali Miraflores. Misma receta: privado, equipado, a pasos del Parque del Perro.",
    description:
      "El Loft 14 completa la oferta individual de Lofthouse 14: un apartaestudio en Miraflores, Cali, con WiFi, aire acondicionado, cocina, Smart TV y baño privado. Sirve a turistas, nómadas, pacientes y grupos que toman esta unidad junto a otras. Capacidad 2 ideal, 5 máximo. Precio desde $80.000 COP por noche en temporada baja. El nombre del proyecto coincide con esta unidad, pero todas las demás siguen el mismo estándar de check-in autónomo, anticipo 50% y reglas de convivencia. Estás a pasos del Parque del Perro y de San Fernando; el mapa de la página de ubicación marca restaurantes, cultura y ocio. Si necesitas la casa entera para hasta 63 personas, usa la ficha de grupos; si viajas solo o en pareja, este loft basta. WhatsApp +57 317 424 6076. Dirección: Carrera 26 # 2-91, Miraflores, Valle del Cauca, Colombia.",
  },
};

const loftImages: Record<string, string> = {
  "01": "/gallery/loft-01_resultado.webp",
  "02": "/gallery/loft-02_resultado.webp",
  "03": "/gallery/loft-03_resultado.webp",
  "05": "/gallery/loft-05.jpg",
  "06": "/gallery/loft-06.jpg",
  "07": "/gallery/loft-07_resultado.webp",
  "08": "/gallery/cuarto_romantico.webp",
  "09": "/gallery/cuarto_4_resultado.webp",
  "10": "/gallery/sofa_1_resultado.webp",
  "11": "/gallery/cocina_3.webp",
  "12": "/gallery/cuarto_3.webp",
  "13": "/gallery/cuarto_romantico2.webp",
  "14": "/gallery/sala_1.webp",
};

function galleryFor(code: string, image: string): string[] {
  const rest = GALLERY_POOL.filter((src) => src !== image).slice(0, 4);
  return [image, ...rest];
}

function loftUnit(code: string): LoftUnit {
  const copy = LOFT_COPY[code];
  if (!copy) {
    throw new Error(`Falta copy SEO para loft ${code}`);
  }
  const image = loftImages[code] ?? GALLERY_POOL[0];
  const slug = loftSlug(code);
  return {
    code,
    slug,
    name: `Loft ${code}`,
    headline: copy.headline,
    seoTitle: `${copy.headline} | Lofthouse 14`,
    metaDescription: `${copy.shortDescription} Desde $80.000/noche. Check-in autónomo. Reserva directo.`,
    shortDescription: copy.shortDescription,
    description: `${copy.description} Reserva directo en www.lofthouse14.com o por WhatsApp al ${site.phoneDisplay}. Dirección: ${site.addressLine}, Miraflores, Cali, Valle del Cauca. Check-in ${site.checkIn}; check-out ${site.checkOut}.`,
    image,
    gallery: galleryFor(code, image),
    guestsIdeal: 2,
    guestsMax: site.maxGuestsPerLoft,
    priceFromCop: site.priceFromCop,
    airbnbUrl: listingUrl(code),
    type: "loft",
  };
}

export const CASA_ENTERA_SLUG = "casa-entera-grupos-cali";

export const casaEntera: LoftUnit = {
  code: "casa",
  slug: CASA_ENTERA_SLUG,
  name: "Casa entera",
  headline: "Alquiler para grupos en Cali — hasta 63 personas",
  seoTitle:
    "Alojamiento para grupos en Cali · Hasta 63 personas | Lofthouse 14",
  metaDescription:
    "Aloja a tu grupo en Cali. Hasta 63 personas en lofts privados en Miraflores. Coordinación incluida, precio por loft. Cotiza por WhatsApp.",
  shortDescription:
    "Varios lofts en el mismo edificio en Miraflores. Delegaciones, familias grandes y equipos en Cali.",
  description:
    "La casa entera de Lofthouse 14 no es una sola vivienda de 63 camas: es la posibilidad de reservar múltiples lofts privados en el mismo edificio en Miraflores, Cali, hasta completar 14 unidades y 63 huéspedes. Cada loft mantiene baño, cocina y A/C, de modo que el grupo comparte barrio y logística sin sacrificar privacidad. Sirve a familias grandes, delegaciones deportivas, equipos de trabajo, recuas de salsa o acompañantes de turismo médico. El precio se arma por loft y por noche (desde $80.000 COP cada uno en temporada baja, más aseo y huéspedes extra), no como un paquete opaco. Coordinamos check-in autónomo, verificación de identidad y un interlocutor por WhatsApp para todo el bloque. El Parque del Perro, restaurantes y San Fernando quedan a pasos. No se permiten fiestas masivas en el inmueble; sí hospedaje organizado. Pide cotización con fechas, número de personas y si necesitan lofts contiguos.",
  image: "/gallery/immersive/09-fachada_diurna.jpg",
  gallery: [
    "/gallery/immersive/09-fachada_diurna.jpg",
    "/gallery/immersive/11-fachada_sillas_diurna.jpg",
    "/gallery/loft-01_resultado.webp",
    "/gallery/loft-02_resultado.webp",
    "/gallery/cocina_1_resultado.webp",
  ],
  guestsIdeal: 20,
  guestsMax: site.maxGuests,
  priceFromCop: site.priceFromCop * 4,
  airbnbUrl: listingUrl("casa"),
  type: "casa",
};

const LOFT_CODES = [
  "01",
  "02",
  "03",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
] as const;

export const loftUnits: LoftUnit[] = LOFT_CODES.map(loftUnit);

export const allBookableUnits: LoftUnit[] = [...loftUnits, casaEntera];

export function getLoftBySlug(slug: string): LoftUnit | undefined {
  return allBookableUnits.find((unit) => unit.slug === slug);
}

export function loftPath(unit: Pick<LoftUnit, "slug">): string {
  return `/lofts/${unit.slug}`;
}
