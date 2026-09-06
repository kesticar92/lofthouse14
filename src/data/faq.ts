import { site } from "@/lib/site";

export const FAQ_ITEMS = [
  {
    q: "¿Cuál es la tarifa base?",
    a: "Desde $80.000 por noche por loft (2 personas, temporada baja). La tarifa final depende de fechas, demanda, número de huéspedes y cuántos lofts reserves.",
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
    q: "¿Cómo reservo?",
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
    q: "¿Dónde están ubicados?",
    a: `${site.addressLine}, ${site.neighborhood}, ${site.city}. En Miraflores, cerca de gastronomía, cultura y servicios (zona Parque del Perro).`,
  },
  {
    q: "¿Hay estacionamiento?",
    a: "La zona suele tener parqueadero público y opciones en la calle según disponibilidad. Escríbenos con tu tipo de vehículo y te orientamos sobre la mejor opción cercana.",
  },
  {
    q: "¿Qué incluye el loft?",
    a: "Espacio tipo apartaestudio con lo esencial para hospedarte: cama, baño privado, área de descanso y equipamiento básico. Detalles por unidad en la sección de lofts y en cada página individual.",
  },
  {
    q: "¿Hay Wi‑Fi?",
    a: "Sí, conexión Wi‑Fi para trabajo remoto y streaming. Si tienes evento o reunión virtual importante, avísanos para recomendarte la unidad más adecuada.",
  },
  {
    q: "¿Puedo cocinar?",
    a: "Los lofts cuentan con zona de preparación de alimentos según el tipo de unidad. Al salir, deja utensilios limpios y orden básico, como indica nuestra política de convivencia.",
  },
] as const;
