import { site } from "@/lib/site";

export type FaqItem = { q: string; a: string };

export function getFaqItems(): FaqItem[] {
  return [
    {
      q: "¿Cuál es la tarifa de un loft en Cali Miraflores?",
      a: "Desde $80.000 por noche por loft (2 personas, temporada baja). La tarifa final depende de fechas, demanda, número de huéspedes y cuántos lofts reserves en Lofthouse 14.",
    },
    {
      q: "¿Cuántas personas caben en un loft?",
      a: `Cada loft está pensado para 2 personas, con capacidad máxima de hasta ${site.maxGuestsPerLoft}. Si reservas varios lofts, sumamos capacidades (hasta ${site.maxGuests} huéspedes en total).`,
    },
    {
      q: "¿Cómo funcionan los huéspedes adicionales?",
      a: "Desde el tercer huésped en el mismo loft se cobra $30.000 por noche por persona extra.",
    },
    {
      q: "¿Qué incluye el cargo de aseo?",
      a: "Aseo único por loft: $30.000 (estancias de 1-2 noches), $60.000 (3 noches o más) o $30.000 por semana en largas estancias. Se aplica a cada loft reservado.",
    },
    {
      q: "¿Puedo reservar varios lofts a la vez?",
      a: "Sí. Indícanos fechas, total de personas y si prefieres lofts juntos o distribuidos. Te armamos una cotización clara por unidad y cargos adicionales.",
    },
    {
      q: "¿Cómo reservo un loft en Cali?",
      a: `Escríbenos por WhatsApp al ${site.phoneDisplay} con fechas, número de personas y cuántos lofts necesitas. Confirmamos disponibilidad, tarifa, anticipo y pasos para el ingreso autónomo.`,
    },
    {
      q: "¿Qué necesito para confirmar la reserva?",
      a: "Fechas, número de huéspedes, datos de contacto y pago del anticipo (50% del total). La reserva queda bloqueada solo cuando recibes confirmación escrita y el anticipo está acreditado.",
    },
    {
      q: "¿Qué formas de pago aceptan?",
      a: "Transferencia bancaria, Nequi, Daviplata y efectivo (este último coordinado previamente). Los detalles te los enviamos por WhatsApp al confirmar.",
    },
    {
      q: "¿Cuándo debo pagar el saldo restante?",
      a: "El 50% restante se paga a más tardar el día del check-in, antes de ingresar. En estadías de una sola noche podemos pedir el pago total al confirmar.",
    },
    {
      q: "¿Cómo funciona el ingreso autónomo?",
      a: "Tras verificar tu identidad y confirmar el pago, activamos tu acceso digital para entrar sin filas en recepción. Te enviamos instrucciones claras por WhatsApp.",
    },
    {
      q: "¿Qué documentos piden para el check-in?",
      a: "Documento de identidad válido (cédula, pasaporte o documento extranjero). Sin verificación exitosa no habilitamos el ingreso, por seguridad de todos los huéspedes.",
    },
    {
      q: "¿A qué hora es el check-in y check-out?",
      a: `${site.checkIn}. ${site.checkOut}. Otros horarios solo con Early Check-in o Late Check-out, sujetos a disponibilidad y costo adicional.`,
    },
    {
      q: "¿Puedo entrar antes o salir más tarde?",
      a: "Sí, solicítalo con al menos 24 horas de anticipación por WhatsApp. Te confirmamos si la unidad está libre y el valor del servicio.",
    },
    {
      q: "¿Dónde están ubicados los lofts?",
      a: `${site.addressLine}, ${site.neighborhood}, ${site.city}, Valle del Cauca, Colombia. En Miraflores, cerca de gastronomía, cultura y servicios (zona Parque del Perro y San Fernando).`,
    },
    {
      q: "¿Hay estacionamiento?",
      a: "La zona suele tener parqueadero público y opciones en la calle según disponibilidad. Escríbenos con tu tipo de vehículo y te orientamos sobre la mejor opción cercana.",
    },
    {
      q: "¿Qué incluye el loft?",
      a: "Espacio tipo apartaestudio con cama, baño privado, área de descanso, WiFi, aire acondicionado, Smart TV y cocina equipada. Detalles por unidad en cada página de loft.",
    },
    {
      q: "¿Hay Wi‑Fi?",
      a: "Sí, conexión Wi‑Fi para trabajo remoto y streaming. Si tienes evento o reunión virtual importante, avísanos para recomendarte la unidad más adecuada.",
    },
    {
      q: "¿Puedo cocinar?",
      a: "Los lofts cuentan con zona de preparación de alimentos según el tipo de unidad. Al salir, deja utensilios limpios y orden básico, como indica nuestra política de convivencia.",
    },
    {
      q: "¿Atienden turismo médico o estadías largas?",
      a: "Sí. Muchos huéspedes vienen por citas médicas, rotaciones o proyectos de varias semanas cerca de clínicas de San Fernando. Consulta tarifas semanales, aseo y disponibilidad con anticipación.",
    },
    {
      q: "¿Es apto para nómadas digitales?",
      a: "Sí: Wi‑Fi, ubicación en Miraflores, ingreso autónomo y espacios cómodos para teletrabajo. Indica si necesitas escritorio o estancia extendida.",
    },
    {
      q: "¿Permiten mascotas?",
      a: `Sí, con notificación previa y pago del cargo por mascota: máximo 2 por loft, $30.000 cada una. Escríbenos por WhatsApp al ${site.phoneDisplay} antes de reservar para confirmar.`,
    },
    {
      q: "¿Se puede fumar?",
      a: "No dentro de las instalaciones. Si se detecta fumado en el interior puede aplicarse cargo de limpieza profunda.",
    },
    {
      q: "¿Se permiten fiestas o eventos?",
      a: "No. Está prohibido superar la capacidad declarada o generar ruido que afecte a vecinos. Silencio recomendado entre 11:00 p.m. y 6:00 a.m.",
    },
    {
      q: "¿Pueden visitarme personas que no están en la reserva?",
      a: "Solo ingresan huéspedes registrados. Visitas deben acordarse antes con el anfitrión.",
    },
    {
      q: "¿Qué pasa si cancelo?",
      a: "Más de 7 días antes: reembolso del 80% del anticipo. Entre 3 y 7 días: 50%. Menos de 72 horas: sin reembolso salvo fuerza mayor documentada. No-show: se pierde el anticipo.",
    },
    {
      q: "¿Puedo cambiar fechas después de reservar?",
      a: "Depende de disponibilidad. Escríbenos lo antes posible; reprogramaciones pueden tener ajustes de tarifa según temporada.",
    },
    {
      q: "¿Emiten factura o comprobante?",
      a: "Sí, con los datos que nos envíes al momento del pago. Indica si necesitas factura electrónica o soporte para empresa.",
    },
    {
      q: "¿Cómo llego desde el aeropuerto?",
      a: "Desde Alfonso Bonilla Aragón se recomienda app de transporte o taxi oficial. Comparte tu hora de llegada y te enviamos referencias de la dirección y acceso en Miraflores.",
    },
    {
      q: "¿Hay cajero, supermercado o farmacia cerca?",
      a: "Sí, Miraflores concentra restaurantes, cafés, farmacias y comercio a poca distancia del Parque del Perro. En la página de ubicación puedes explorar puntos de interés.",
    },
    {
      q: "¿Qué hago si tengo un problema durante la estadía?",
      a: `Contáctanos de inmediato por WhatsApp al ${site.phoneDisplay}. Priorizamos seguridad, acceso y cualquier urgencia del alojamiento.`,
    },
    {
      q: "¿Dónde leo las políticas completas?",
      a: "En la página de políticas del sitio encontrarás reservas, anticipos, cancelaciones, datos personales y normas del alojamiento en detalle.",
    },
  ];
}

/** Preguntas que alimentan FAQPage schema (featured snippets). */
export function getFaqSchemaItems(): FaqItem[] {
  return getFaqItems().slice(0, 8);
}
