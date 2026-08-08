"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { site, waLink } from "@/lib/site";
import Link from "next/link";

const faqItems = [
  {
    q: "¿Cuál es la tarifa base?",
    a: "Desde $80.000 por noche por loft (2 personas, temporada baja). La tarifa final depende de fechas, demanda, número de huéspedes y cuántos lofts reserves.",
  },
  {
    q: "¿Cuántas personas caben en un loft?",
    a: "Cada loft está pensado para 2 personas, con capacidad máxima de hasta 5. Si reservas varios lofts, sumamos capacidades según la combinación que elijas (grupos grandes hasta 63 personas consultando disponibilidad).",
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
    a: "Espacio tipo apartaestudio con lo esencial para hospedarte: cama, baño privado, área de descanso y equipamiento básico. Detalles por tipo de loft los ves en la sección Nuestros lofts.",
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
    a: "Sí. Muchos huéspedes vienen por citas médicas, rotaciones o proyectos de varias semanas. Consulta tarifas semanales, aseo y disponibilidad con anticipación.",
  },
  {
    q: "¿Es apto para nómadas digitales?",
    a: "Sí: Wi‑Fi, ubicación central, ingreso autónomo y espacios cómodos para teletrabajo. Indica si necesitas escritorio o estancia extendida.",
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
    a: "Desde Alfonso Bonilla Aragón se recomienda app de transporte o taxi oficial. Comparte tu hora de llegada y te enviamos referencias de la dirección y acceso.",
  },
  {
    q: "¿Hay cajero, supermercado o farmacia cerca?",
    a: "Sí, Miraflores concentra restaurantes, cafés, farmacias y comercio a poca distancia. En la sección Ubicación puedes explorar puntos de interés en el mapa.",
  },
  {
    q: "¿Qué hago si tengo un problema durante la estadía?",
    a: `Contáctanos de inmediato por WhatsApp al ${site.phoneDisplay}. Priorizamos seguridad, acceso y cualquier urgencia del alojamiento.`,
  },
  {
    q: "¿Dónde leo las políticas completas?",
    a: "En la página de políticas del sitio encontrarás reservas, anticipos, cancelaciones, datos personales y normas del alojamiento en detalle.",
  },
] as const;

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="preguntas-frecuentes"
      className="scroll-mt-28 border-t border-zinc-200 bg-[#f2f0eb]/40 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-950 md:px-20 md:py-24"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-500">
          Preguntas frecuentes
        </p>
        <h2 className="mt-2 font-display text-4xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] md:text-5xl">
          Resolvemos tus dudas
        </h2>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          Tarifas, reservas, ingreso autónomo, pagos y normas de convivencia. Si
          tu caso es particular, escríbenos.
        </p>

        <ul className="mt-10 space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-zinc-900 dark:text-[#f2f0eb]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-zinc-500 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen ? (
                  <p className="border-t border-zinc-100 px-5 py-4 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    {item.a}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={waLink("Hola, tengo una pregunta sobre LOFTHOUSE 14")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white hover:bg-zinc-800 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Preguntar por WhatsApp
          </Link>
          <Link
            href="/politicas"
            className="inline-flex rounded-full border border-zinc-300 px-8 py-3 text-sm font-bold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Ver políticas completas
          </Link>
        </div>
      </div>
    </section>
  );
}
