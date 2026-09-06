"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  useMap,
} from "@/components/ui/map";
import {
  Star,
  Navigation,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Minus,
  Compass,
  ChevronDown,
  Hand,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { GlassPanel } from "@/components/ui/glass-panel";
import places from "@/data/places_updated.json";
import { PlacePhoto } from "@/components/sections/place-photo";

type PlaceItem = (typeof places)[number];

const categories = ["Todos", "Gastronomía", "Cultura", "Ocio"];

// Sub-componente para controles de mapa estilizados con Glassmorphism
function MapControls() {
  const { map } = useMap();
  const [is3D, setIs3D] = useState(true);

  if (!map) return null;

  const togglePitch = () => {
    const newPitch = is3D ? 0 : 45;
    map.easeTo({ pitch: newPitch, duration: 1000 });
    setIs3D(!is3D);
  };

  const buttonClass =
    "p-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-xl border border-white/20 shadow-lg hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95";

  return (
    <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
      <button onClick={() => map.zoomIn()} className={buttonClass}>
        <Plus className="size-5 text-zinc-900 dark:text-white" />
      </button>
      <button onClick={() => map.zoomOut()} className={buttonClass}>
        <Minus className="size-5 text-zinc-900 dark:text-white" />
      </button>
      <button onClick={togglePitch} className={buttonClass}>
        <Compass
          className={cn(
            "size-5 transition-colors",
            is3D ? "text-amber-600" : "text-zinc-500",
          )}
        />
      </button>
    </div>
  );
}

function MapController({
  activePlace,
  placesList,
}: {
  activePlace: number | null;
  placesList: PlaceItem[];
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.easeTo({
      center: [site.coordinates.longitude, site.coordinates.latitude],
      zoom: 15,
      pitch: 45,
      duration: 2000,
    });
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded || !activePlace) return;
    const place = placesList.find((p) => p.id === activePlace);
    if (place) {
      map.flyTo({
        center: [place.lng, place.lat],
        zoom: 16,
        speed: 1.5,
      });
    }
  }, [map, isLoaded, activePlace, placesList]);

  return null;
}

function useIsMobileMapLayout() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

function scrollToNextSection() {
  document
    .getElementById("preguntas-frecuentes")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Location() {
  const [routeCoordinates, setRouteCoordinates] = useState<
    [number, number][] | null
  >(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activePlace, setActivePlace] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileMapActive, setMobileMapActive] = useState(false);
  const isMobileLayout = useIsMobileMapLayout();
  const mapInteractive = !isMobileLayout || mobileMapActive;

  const filteredPlaces = places.filter(
    (p) =>
      selectedCategory === "Todos" ||
      p.category === selectedCategory ||
      p.isHome,
  );

  const handleFetchRoute = async (destLng: number, destLat: number) => {
    setIsLoadingRoute(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${site.coordinates.longitude},${site.coordinates.latitude};${destLng},${destLat}?overview=full&geometries=geojson`,
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        setRouteCoordinates(data.routes[0].geometry.coordinates);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  return (
    <section
      id="ubicacion"
      className="scroll-mt-28 relative flex h-auto min-h-0 w-full flex-col overflow-hidden bg-white dark:bg-zinc-950 lg:h-screen lg:flex-row"
    >
      {/* Sidebar Panel */}
      {/* Mobile Overlay Background */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-500",
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={cn(
          "fixed lg:relative inset-x-0 bottom-0 lg:inset-auto",
          "w-full lg:w-1/3 h-[75vh] lg:h-full order-2 lg:order-1 z-40 lg:z-20",
          "flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] lg:shadow-2xl border-t lg:border-t-0 lg:border-r border-zinc-200 dark:border-zinc-800",
          "transition-transform duration-500 ease-out lg:translate-y-0",
          isSidebarOpen
            ? "translate-y-0"
            : "translate-y-[100%] lg:translate-y-0",
          "px-6 lg:px-20 rounded-t-3xl lg:rounded-none",
        )}
      >
        <div className="pt-8 lg:pt-12 pb-6 space-y-6 relative">
          {/* Mobile Handle */}
          <div
            className="lg:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="space-y-2">
            <h2 className="font-display text-4xl md:text-5xl tracking-wide text-zinc-900 dark:text-[#f2f0eb]">
              Explora tu entorno
            </h2>
            <p className="text-base text-zinc-500 dark:text-zinc-400">
              Una de las zonas más activas y estratégicas de Cali. Con acceso a
              lo que necesitas para vivir, trabajar o recuperarte.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                  selectedCategory === cat
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-amber-600 dark:border-amber-600"
                    : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
          {filteredPlaces
            .filter((p) => !p.isHome)
            .map((place) => (
              <button
                key={place.id}
                onClick={() => setActivePlace(place.id)}
                className={cn(
                  "w-full flex gap-4 p-3 rounded-2xl transition-all border text-left group",
                  activePlace === place.id
                    ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30 shadow-sm"
                    : "bg-white dark:bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                )}
              >
                <div className="relative size-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  <PlacePhoto
                    fill
                    src={place.image}
                    alt={place.name}
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                        place.color,
                        "text-white",
                      )}
                    >
                      {place.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {place.rating}
                    </div>
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white leading-tight">
                    {place.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="size-3" />
                    {place.hours}
                  </div>
                </div>
              </button>
            ))}
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
          <GlassPanel className="p-4 border-amber-200 dark:border-amber-900/30">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <Navigation className="size-3 animate-pulse" />
              UBICACIÓN ESTRATÉGICA
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
              San Fernando es el corazón gastronómico y cultural de Cali.
            </p>
          </GlassPanel>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative order-1 h-[min(56svh,520px)] w-full overflow-hidden pe-0 lg:order-2 lg:h-full lg:min-h-0 lg:flex-1 lg:rounded-bl-3xl lg:rounded-tl-3xl lg:pe-12">
        {/* Floating Toggle Button for Mobile */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={cn(
            "lg:hidden absolute bottom-6 left-1/2 z-20 -translate-x-1/2 px-6 py-3.5 rounded-full font-bold shadow-2xl text-sm border flex items-center gap-2 transition-transform duration-500",
            "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-800 dark:border-white/20",
            isSidebarOpen ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0",
            mobileMapActive ? "bottom-20" : "bottom-6",
          )}
        >
          <Navigation className="size-4" />
          Ver lugares
        </button>

        <div
          className={cn(
            "absolute inset-0",
            !mapInteractive && "pointer-events-none",
          )}
          aria-hidden={!mapInteractive}
        >
          <Map
            center={[site.coordinates.longitude, site.coordinates.latitude]}
            zoom={15}
            fallbackMapsUrl={site.google_url}
            cooperativeGestures={isMobileLayout && mobileMapActive}
            className="h-full w-full"
          >
          <MapController
            activePlace={activePlace}
            placesList={filteredPlaces}
          />
          <MapControls />
          {routeCoordinates && (
            <MapRoute
              coordinates={routeCoordinates}
              color="#f59e0b"
              width={6}
              opacity={0.8}
            />
          )}

          {filteredPlaces.map((place) => (
            <MapMarker
              key={place.id}
              longitude={place.lng}
              latitude={place.lat}
              onClick={() => setActivePlace(place.id)}
            >
              <MarkerContent>
                <div className="relative flex items-center justify-center">
                  {place.isHome ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-25" />
                      <div className="relative size-12 bg-white dark:bg-zinc-900 rounded-full border-4 border-amber-500 shadow-2xl p-1.5 z-10 transition-transform hover:scale-110">
                        <Image
                          src="/logo-lofthouse.png"
                          alt="LoftHouse"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "size-8 rounded-full border-2 border-white shadow-xl transition-all flex items-center justify-center text-white font-bold",
                        place.color,
                        activePlace === place.id
                          ? "scale-125 z-50 ring-4 ring-white/30"
                          : "scale-100 hover:scale-110",
                      )}
                    >
                      {place.label[0]}
                    </div>
                  )}
                </div>
              </MarkerContent>

              <MarkerPopup
                forceOpen={activePlace === place.id}
                className="w-72 p-0 bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-2xl border-none overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight pr-2">
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg flex-shrink-0">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {place.rating}
                      </span>
                    </div>
                  </div>

                  {place.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {place.description}
                    </p>
                  )}

                  <div className="relative mt-2 h-32 w-full overflow-hidden rounded-xl transition-transform duration-500 hover:scale-[1.02]">
                    <PlacePhoto
                      fill
                      src={place.image}
                      alt={place.name}
                      sizes="288px"
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-widest",
                          place.color,
                        )}
                      >
                        {place.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                      onClick={() => handleFetchRoute(place.lng, place.lat)}
                    >
                      <Navigation className="size-3.5 mr-2" />
                      Como llegar
                    </button>
                    <button
                      onClick={() =>
                        window.open(place.google_maps_link, "_blank")
                      }
                      className="size-11 flex-shrink-0 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-center transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <ExternalLink className="size-4 text-zinc-500" />
                    </button>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
          </Map>
        </div>

        {isMobileLayout && !mobileMapActive && !isSidebarOpen && (
          <div
            className="absolute inset-0 z-[25] flex flex-col justify-end bg-gradient-to-t from-zinc-950/75 via-zinc-950/25 to-transparent p-4 pb-20 pointer-events-none"
            style={{ touchAction: "pan-y" }}
          >
            <p className="mb-3 text-center text-xs font-medium text-white/90 pointer-events-none">
              Desliza con un dedo para seguir bajando la página
            </p>
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => setMobileMapActive(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/95 py-3.5 text-sm font-bold text-zinc-900 shadow-lg backdrop-blur-sm"
              >
                <Hand className="size-4" />
                Tocar para explorar el mapa
              </button>
              <button
                type="button"
                onClick={scrollToNextSection}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-zinc-900/80 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-sm"
              >
                Continuar en la web
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>
        )}

        {isMobileLayout && mobileMapActive && (
          <button
            type="button"
            onClick={() => setMobileMapActive(false)}
            className="lg:hidden absolute top-4 left-4 z-30 flex items-center gap-1.5 rounded-full border border-white/30 bg-zinc-900/85 px-4 py-2.5 text-xs font-bold text-white shadow-lg backdrop-blur-md"
          >
            Listo, seguir bajando
            <ChevronDown className="size-3.5" />
          </button>
        )}

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-10 left-10 z-10 flex flex-col gap-4 max-lg:hidden">
          {isLoadingRoute && (
            <GlassPanel className="p-4 flex items-center gap-4 border-amber-500 shadow-xl animate-in slide-in-from-left duration-300">
              <Loader2 className="size-5 animate-spin text-amber-600" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  Calculando ruta...
                </span>
                <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
                  OSRM Engine v1
                </span>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>

      {isMobileLayout && (
        <div className="order-2 w-full border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
          <button
            type="button"
            onClick={scrollToNextSection}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3.5 text-sm font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
          >
            Siguiente: preguntas frecuentes
            <ChevronDown className="size-4" />
          </button>
        </div>
      )}
    </section>
  );
}
