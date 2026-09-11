import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/preview-movil/",
          "/mi-reserva",
          "/mensajes",
          "/confirmacion/",
          "/ayuda",
        ],
      },
      { userAgent: "GPTBot", allow: ["/", "/llms.txt"] },
      { userAgent: "ChatGPT-User", allow: ["/", "/llms.txt"] },
      { userAgent: "Google-Extended", allow: ["/", "/llms.txt"] },
      { userAgent: "anthropic-ai", allow: ["/", "/llms.txt"] },
      { userAgent: "ClaudeBot", allow: ["/", "/llms.txt"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
