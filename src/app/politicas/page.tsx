import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `Políticas — ${site.name}`,
  description:
    "Conoce nuestras políticas de reservas, tratamiento de datos, anticipos, cancelaciones y normas del alojamiento.",
};

const sections = [
  {
    id: "reservas",
    title: "Política de Reservas",
    content: [
      {
        heading: "Proceso de reserva",
        body: "La reserva se confirma únicamente cuando el huésped ha comunicado sus fechas de estadía, número de huéspedes, ha recibido confirmación de disponibilidad por parte de LOFTHOUSE 14 y ha realizado el pago del anticipo correspondiente.",
      },
      {
        heading: "Verificación de identidad",
        body: "Para activar el acceso al alojamiento, el huésped debe completar un proceso de verificación de identidad mediante documento válido (cédula de ciudadanía, pasaporte o documento extranjero). Sin verificación exitosa no se habilita el ingreso.",
      },
      {
        heading: "Capacidad máxima",
        body: "Cada unidad tiene una capacidad máxima establecida. No se permite el ingreso de personas adicionales a las declaradas en la reserva. El incumplimiento puede derivar en la terminación inmediata de la estadía sin derecho a reembolso.",
      },
      {
        heading: "Horarios",
        body: `Check-in: ${site.checkIn}. Check-out: ${site.checkOut}. El ingreso antes o la salida después de los horarios establecidos requiere contratación de Early Check-in o Late Check-out respectivamente, sujeto a disponibilidad.`,
      },
    ],
  },
  {
    id: "anticipos",
    title: "Política de Anticipos y Abonos",
    content: [
      {
        heading: "Anticipo para confirmar",
        body: "Se requiere el pago de un anticipo equivalente al 50% del valor total de la reserva para garantizar y bloquear las fechas. Sin este pago, las fechas no quedan reservadas.",
      },
      {
        heading: "Pago del saldo",
        body: "El saldo restante (50%) debe cancelarse a más tardar el día del check-in, antes del ingreso al alojamiento. El no pago del saldo en el plazo acordado puede ocasionar la cancelación de la reserva.",
      },
      {
        heading: "Medios de pago",
        body: "Aceptamos transferencias bancarias, Nequi, Daviplata y efectivo. Los pagos en efectivo deben coordinarse previamente con el anfitrión. No se aceptan pagos fraccionados sin autorización previa.",
      },
      {
        heading: "Estadías de una noche",
        body: "Para reservas de una sola noche, se podrá requerir el pago total al momento de la confirmación.",
      },
    ],
  },
  {
    id: "cancelaciones",
    title: "Política de Cancelaciones y Reembolsos",
    content: [
      {
        heading: "Cancelación con más de 7 días de anticipación",
        body: "El huésped tiene derecho al reembolso del 80% del anticipo pagado. El 20% restante corresponde a gastos administrativos y de gestión.",
      },
      {
        heading: "Cancelación entre 3 y 7 días antes del check-in",
        body: "Se reembolsará el 50% del anticipo. La diferencia cubre la pérdida de oportunidad de arrendar las fechas bloqueadas.",
      },
      {
        heading: "Cancelación con menos de 72 horas",
        body: "No aplica reembolso del anticipo. En casos de fuerza mayor documentados (enfermedad grave, fallecimiento de familiar directo), se evaluará individualmente.",
      },
      {
        heading: "No presentación (No-show)",
        body: "Si el huésped no se presenta en la fecha acordada sin previo aviso, se pierde el anticipo en su totalidad y la reserva se cancela automáticamente.",
      },
      {
        heading: "Cancelación por parte de LOFTHOUSE 14",
        body: "En el improbable caso de cancelación por nuestra parte (fuerza mayor, problemas técnicos graves), se reembolsará el 100% de los valores pagados o se ofrecerá una fecha alternativa.",
      },
    ],
  },
  {
    id: "early-late",
    title: "Early Check-in y Late Check-out",
    content: [
      {
        heading: "Early Check-in",
        body: `El check-in estándar es a partir de las ${site.checkIn}. Si necesitas ingresar antes, puedes solicitar un Early Check-in sujeto a disponibilidad de la unidad. Este servicio tiene un costo adicional que se informará al momento de la solicitud.`,
      },
      {
        heading: "Late Check-out",
        body: `El check-out estándar es hasta las ${site.checkOut}. Si necesitas salir más tarde por vuelo nocturno, pico y placa u otras condiciones de tu itinerario, puedes solicitar un Late Check-out sujeto a disponibilidad. Tiene costo adicional según el horario requerido.`,
      },
      {
        heading: "Cómo solicitarlo",
        body: "Estos servicios deben solicitarse con al menos 24 horas de anticipación vía WhatsApp. No se garantiza disponibilidad sin confirmación previa del anfitrión.",
      },
    ],
  },
  {
    id: "normas",
    title: "Normas del Alojamiento",
    content: [
      {
        heading: "Convivencia y ruido",
        body: "Se prohíben fiestas, eventos o reuniones que superen la capacidad del alojamiento. El silencio nocturno debe respetarse entre las 11:00 PM y las 6:00 AM. El incumplimiento puede resultar en la terminación inmediata de la estadía.",
      },
      {
        heading: "No fumar",
        body: "Está prohibido fumar dentro de las instalaciones. En caso de detectarse fumado en el interior, se cobrará una tarifa de limpieza profunda adicional.",
      },
      {
        heading: "Mascotas",
        body: "No se admiten mascotas salvo autorización previa y expresa del anfitrión. En caso de permitirse, el huésped asume responsabilidad por daños causados.",
      },
      {
        heading: "Cuidado del inmueble",
        body: "El huésped recibe el alojamiento en condiciones óptimas y es responsable de devolverlo en el mismo estado. Los daños causados por mal uso serán cobrados según el costo real de reparación o reposición.",
      },
      {
        heading: "Acceso de terceros",
        body: "Solo pueden ingresar las personas registradas en la reserva. El acceso de visitantes externos debe ser aprobado previamente.",
      },
      {
        heading: "Residuos y aseo",
        body: "El huésped debe depositar los residuos en los recipientes correspondientes y mantener orden básico durante la estadía. Al hacer check-out, los utensilios de cocina deben estar limpios.",
      },
    ],
  },
  {
    id: "datos",
    title: "Política de Tratamiento de Datos Personales",
    content: [
      {
        heading: "Responsable del tratamiento",
        body: `LOFTHOUSE 14, con domicilio en ${site.addressLine}, ${site.neighborhood}, ${site.city}, Colombia. Contacto: ${site.email}.`,
      },
      {
        heading: "Datos recolectados",
        body: "Recolectamos nombre completo, documento de identidad, teléfono, correo electrónico y datos de pago exclusivamente para la gestión de reservas, verificación de identidad y comunicación relacionada con la estadía.",
      },
      {
        heading: "Finalidad del tratamiento",
        body: "Los datos se utilizan para: (i) confirmar y gestionar reservas, (ii) verificar identidad del huésped, (iii) emitir comprobantes de pago, (iv) cumplir obligaciones legales, y (v) enviar comunicaciones relacionadas con el servicio contratado.",
      },
      {
        heading: "Base legal",
        body: "El tratamiento se realiza con el consentimiento del titular, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (Colombia). El titular puede ejercer sus derechos de acceso, rectificación, supresión y portabilidad escribiendo a nuestro correo.",
      },
      {
        heading: "Conservación",
        body: "Los datos se conservan durante el tiempo necesario para cumplir las finalidades descritas y las obligaciones legales aplicables. No se comparten con terceros sin autorización, salvo requerimiento legal.",
      },
      {
        heading: "Derechos del titular",
        body: `Puedes solicitar el acceso, corrección o eliminación de tus datos escribiendo a ${site.email}. Atenderemos tu solicitud en un plazo máximo de 15 días hábiles.`,
      },
    ],
  },
  {
    id: "privacidad",
    title: "Política de Privacidad del Sitio Web",
    content: [
      {
        heading: "Uso del sitio",
        body: "Este sitio web no utiliza cookies de rastreo de terceros. Los datos enviados a través del formulario de contacto se redirigen directamente a WhatsApp y no se almacenan en nuestros servidores.",
      },
      {
        heading: "Google Maps",
        body: "Utilizamos un mapa embebido de Google Maps para mostrar la ubicación del alojamiento. Google puede recopilar información conforme a su propia política de privacidad.",
      },
      {
        heading: "Seguridad",
        body: "Este sitio opera bajo protocolo HTTPS. La información transmitida está cifrada. No almacenamos datos de tarjetas de crédito ni información financiera sensible.",
      },
    ],
  },
];

export default function PoliticasPage() {
  return (
    <div className="min-h-screen bg-[#f5f2ed] dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-black/10 bg-zinc-950 px-4 py-5 dark:border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl tracking-wide text-[#f2f0eb] hover:text-white"
          >
            LOFTHOUSE 14
          </Link>
          <Link
            href="/#reservas"
            className="rounded-full bg-[#f2f0eb] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-white"
          >
            Reservar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14 md:py-20">
        {/* Hero */}
        <div className="mb-14 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            {site.name} · {site.city}
          </p>
          <h1 className="font-display text-5xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-6xl">
            POLÍTICAS
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            Aquí encontrarás todas las condiciones que rigen la relación entre
            LOFTHOUSE 14 y nuestros huéspedes. Te recomendamos leerlas antes de
            confirmar tu reserva.
          </p>
          <p className="text-xs text-zinc-400">
            Última actualización: mayo 2026
          </p>
        </div>

        {/* Index */}
        <nav className="mb-14 rounded-2xl border border-black/10 bg-white/70 p-6 dark:border-white/10 dark:bg-zinc-900/60">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Contenido
          </p>
          <ol className="space-y-1.5">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm font-medium text-amber-800 hover:underline dark:text-amber-400"
                >
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-14">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-8">
              <h2 className="mb-6 font-display text-3xl tracking-wide text-zinc-900 dark:text-[#f2f0eb] sm:text-4xl">
                {i + 1}. {s.title.toUpperCase()}
              </h2>
              <div className="space-y-6">
                {s.content.map((block) => (
                  <div
                    key={block.heading}
                    className="rounded-xl border border-black/8 bg-white/80 px-6 py-5 dark:border-white/8 dark:bg-zinc-900/60"
                  >
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-900 dark:text-[#f2f0eb]">
                      {block.heading}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                      {block.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 rounded-2xl border border-black/10 bg-zinc-950 px-8 py-10 text-center dark:border-white/10">
          <p className="font-display text-2xl tracking-wide text-[#f2f0eb] sm:text-3xl">
            ¿TIENES DUDAS?
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Escríbenos y te aclaramos cualquier condición antes de reservar.
          </p>
          <a
            href={`mailto:${site.email}`}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#f2f0eb] px-7 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-white"
          >
            {site.email}
          </a>
        </div>
      </main>

      <footer className="border-t border-black/10 py-6 text-center text-xs text-zinc-500 dark:border-white/10">
        © {new Date().getFullYear()} {site.name}. Todos los derechos reservados.{" "}
        <Link href="/" className="hover:underline">
          Volver al inicio
        </Link>
      </footer>
    </div>
  );
}
