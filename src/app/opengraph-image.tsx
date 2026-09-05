import { ImageResponse } from "next/og";

export const alt = "Interior loft moderno en Cali barrio Miraflores — Lofthouse 14";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#141210",
          color: "#f2f0eb",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#d97706",
            fontWeight: 700,
          }}
        >
          Lofthouse 14
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 800,
              maxWidth: 980,
            }}
          >
            Lofts en Cali Miraflores — Parque del Perro
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#d6d3d1" }}>
            WiFi · A/C · Cocina · Check-in autónomo · Desde $80.000/noche
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#a8a29e" }}>
          Carrera 26 # 2-91 · www.lofthouse14.com
        </div>
      </div>
    ),
    { ...size },
  );
}
