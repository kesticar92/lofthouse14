"use client";
import React, { useEffect, useState } from "react";
import {
  TestimonialsColumn,
  Testimonial,
} from "@/components/layout/testimonial";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react"; // Importamos un icono de carga

import bookingReviewsData from "@/app/scrapper/reviews/reseñas_booking.json";
import googleReviewsData from "@/app/scrapper/reviews/reseñas_google.json";

// Formatear reseñas de Google
const formattedGoogle: Testimonial[] = googleReviewsData
  .filter((r: any) => r.comentario && r.comentario.trim().length > 0)
  .map((r: any) => ({
    text: r.comentario,
    image: "/default-avatar.png",
    name: r.nombre,
    role: "Huésped de Google",
    rating: 5,
    source: "google" as const,
  }));

// Formatear reseñas de Booking
const formattedBooking: Testimonial[] = bookingReviewsData.reseñas
  .filter((r: any) => r.comentario && r.comentario.trim().length > 0)
  .map((r: any) => {
    const ratingVal = parseFloat(r.calificacion.replace(",", "."));
    const rating = isNaN(ratingVal) ? 5 : ratingVal / 2;
    return {
      text: r.comentario,
      image: "/default-avatar.png",
      name: r.nombre,
      role: "Huésped de Booking",
      rating: rating,
      source: "booking" as const,
    };
  });

// Combinar e intercalar las reseñas
const localReviews: Testimonial[] = [];
const maxLength = Math.max(formattedGoogle.length, formattedBooking.length);
for (let i = 0; i < maxLength; i++) {
  if (i < formattedGoogle.length) {
    localReviews.push(formattedGoogle[i]);
  }
  if (i < formattedBooking.length) {
    localReviews.push(formattedBooking[i]);
  }
}

interface TestimonialsProps {
  data?: Testimonial[];
}

const Testimonials = ({ data }: TestimonialsProps) => {
  const [reviews, setReviews] = useState<Testimonial[]>(data || localReviews);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      setReviews(data);
    }
  }, [data]);

  // Lógica de columnas
  const firstColumn = reviews.filter((_, i) => i % 3 === 0);
  const secondColumn = reviews.filter((_, i) => i % 3 === 1);
  const thirdColumn = reviews.filter((_, i) => i % 3 === 2);

  return (
    <section
      id="testimonios"
      className="py-12 px-4 md:py-20 md:px-20 relative overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 bg-zinc-50 dark:bg-black/20" />

      <div className="container z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[800px] mx-auto text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-6xl tracking-tight text-zinc-900 dark:text-[#f2f0eb]">
            LO QUE <span className="text-amber-600">DICEN</span> LOS HUÉSPEDES
          </h2>
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Reseñas resumidas del estilo de experiencia que buscamos ofrecer
            cada día.
          </p>
        </motion.div>

        {loading ? (
          // Estado de carga mientras llega la data de la API
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : reviews.length > 0 ? (
          // Renderizado solo si hay reseñas de la API
          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[700px] overflow-hidden">
            <TestimonialsColumn
              key="col1"
              testimonials={firstColumn}
              duration={25}
            />
            {secondColumn.length > 0 && (
              <TestimonialsColumn
                key="col2"
                testimonials={secondColumn}
                className="hidden sm:block"
                duration={35}
              />
            )}
            {thirdColumn.length > 0 && (
              <TestimonialsColumn
                key="col3"
                testimonials={thirdColumn}
                className="hidden md:block"
                duration={30}
              />
            )}
          </div>
        ) : (
          // Opcional: Qué mostrar si la API devuelve un array vacío
          <div className="text-center text-zinc-500 py-20">
            No hay reseñas disponibles en este momento.
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
