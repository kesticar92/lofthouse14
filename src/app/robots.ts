import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/preview-movil/"],
      },
    ],
    sitemap: "https://lofthouse14.com/sitemap.xml",
  };
}
