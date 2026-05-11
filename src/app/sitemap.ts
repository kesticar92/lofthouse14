import type { MetadataRoute } from "next";

const BASE_URL = "https://lofthouse14.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // No incluir URLs con #fragmento: no son válidas en sitemaps y todas resuelven a GET /
  // (el ancla no se envía al servidor), lo que confunde el rastreo e informes de GSC.
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/politicas`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
