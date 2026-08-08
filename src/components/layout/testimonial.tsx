"use client";
import React from "react";
import { motion } from "framer-motion";

// 1. Define la forma de UN testimonio
export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
  rating?: number;
  source?: "google" | "booking" | "local";
}

const StarIcon = ({ fill = "currentColor" }: { fill?: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

const GoogleLogo = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Helper para obtener las iniciales del nombre
const getInitials = (name: string) => {
  if (!name) return "H";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
};

// Marcador de posición para logo de Google
const GoogleLogoPlaceholder = () => (
  <div className="flex items-center gap-1.5" title="Google">
    {/* TODO: Reemplazar por tu propio icono si lo deseas */}
    <GoogleLogo />
    <span className="text-[10px] font-bold tracking-tight text-zinc-600 dark:text-zinc-400">
      Google
    </span>
  </div>
);

// Marcador de posición para logo de Booking
const BookingLogoPlaceholder = () => (
  <div className="flex items-center gap-1.5" title="Booking.com">
    {/* TODO: Reemplazar por tu propio icono de Booking.com */}
    <div className="w-[14px] h-[14px] bg-[#003580] rounded flex items-center justify-center text-[8px] text-white font-extrabold shadow-sm leading-none">
      B
    </div>
    <span className="text-[10px] font-bold tracking-tight text-[#003580] dark:text-blue-400">
      Booking
    </span>
  </div>
);

// 2. Define los props del componente
interface TestimonialsColumnProps {
  className?: string;
  testimonials: Testimonial[]; // Un array de objetos tipo Testimonial
  duration?: number;
}

// 3. Define el componente
export const TestimonialsColumn = (props: TestimonialsColumnProps) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map((testimonial, i) => (
                <div
                  className="p-8 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-xl shadow-primary/5 max-w-xs w-full group transition-all hover:bg-white dark:hover:bg-white/10"
                  key={i}
                >
                  <div className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                      {testimonial.image &&
                      testimonial.image !== "/default-avatar.png" ? (
                        <img
                          width={40}
                          height={40}
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="h-10 w-10 rounded-full border border-zinc-200 dark:border-white/10 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full border border-zinc-200 dark:border-white/10 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs select-none">
                          {getInitials(testimonial.name)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="font-bold text-sm tracking-tight leading-4 text-zinc-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mt-0.5">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>

                    {(testimonial.source === "google" ||
                      testimonial.source === "booking") && (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, starIdx) => (
                            <StarIcon
                              key={starIdx}
                              fill={
                                starIdx < Math.round(testimonial.rating || 5)
                                  ? "#FBBC05"
                                  : "#E5E7EB"
                              }
                            />
                          ))}
                        </div>
                        <div className="opacity-75 group-hover:opacity-100 transition-opacity">
                          {testimonial.source === "google" ? (
                            <GoogleLogoPlaceholder />
                          ) : (
                            <BookingLogoPlaceholder />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
