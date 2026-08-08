"use client";

export function Hero() {
  return (
    <>
      <section
        id="inicio"
        className="h-screen w-full overflow-hidden flex flex-col justify-end relative"
      >
        {/* Video Background */}
        <div className="h-screen w-full overflow-hidden absolute inset-0 -z-20">
          <video
            autoPlay
            loop
            muted
            playsInline
            src="/hero.mp4"
            className="h-full w-full object-cover"
            aria-hidden="true"
          ></video>
        </div>
        <div className="z-10 w-full p-6 pb-12 md:p-16 md:pb-20">
          <div className="text-left max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white uppercase leading-tight drop-shadow-md">
              Bienvenido a tu propio rincón <br className="hidden md:block" />
              en el corazón de Cali.
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mt-4 drop-shadow-md">
              Hospedaje moderno, seguro y cerca de{" "}
              <br className="hidden md:block" />
              todo lo que importa. Vive la ciudad a tu ritmo.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
