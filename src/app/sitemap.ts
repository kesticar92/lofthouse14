import type { MetadataRoute } from "next";

const BASE_URL = "https://lofthouse14.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    { url: `${BASE_URL}/#lofts`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/#galeria`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/galeria`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${BASE_URL}/#experiencias`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/#audiencias`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    { url: `${BASE_URL}/#propuesta`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/#proceso`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${BASE_URL}/#servicios-extra`,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/#testimonios`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    { url: `${BASE_URL}/#ubicacion`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/#tarifas`, changeFrequency: "monthly", priority: 0.85 },
    {
      url: `${BASE_URL}/#preguntas-frecuentes`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${BASE_URL}/#reservas`, changeFrequency: "monthly", priority: 0.9 },
    {
      url: `${BASE_URL}/politicas`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
