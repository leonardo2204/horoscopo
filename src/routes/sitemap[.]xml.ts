import { createServerFileRoute } from "@tanstack/react-start/server";
import { getDB } from "../db";

function denormalizeSignName(portugueseName: string): string {
  const signMap: Record<string, string> = {
    Áries: "aries",
    Touro: "touro",
    Gêmeos: "gemeos",
    Câncer: "cancer",
    Leão: "leao",
    Virgem: "virgem",
    Libra: "libra",
    Escorpião: "escorpiao",
    Sagitário: "sagitario",
    Capricórnio: "capricornio",
    Aquário: "aquario",
    Peixes: "peixes",
  };
  return signMap[portugueseName] || portugueseName;
}

export const ServerRoute = createServerFileRoute("/sitemap.xml").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const baseUrl = url.origin;

    const signs = await getDB().query.signs.findMany({
      columns: { namePt: true },
    });

    const categories = await getDB().query.horoscopeCategories.findMany({
      columns: {
        name: true,
      },
    });

    // Generate junction URLs for each combination of category and sign
    const junctionUrls = categories.flatMap((category) =>
      signs.map(
        (sign) => `  <url>
    <loc>${baseUrl}/horoscopo-do-dia-${category.name}/${denormalizeSignName(sign.namePt)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
      )
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  ${signs
    .map(
      (sign) => `  <url>
    <loc>${baseUrl}/horoscopo-do-dia/${denormalizeSignName(sign.namePt)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
    )
    .join("\n")}
  ${junctionUrls.join("\n")}
</urlset>`;

    // Return the XML with the appropriate content type
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  },
});
