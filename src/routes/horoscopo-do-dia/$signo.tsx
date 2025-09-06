import { createFileRoute } from "@tanstack/react-router";
import { formatDateToPortuguese, seo } from "~/utils/seo";
import { createServerFn } from "@tanstack/react-start";
import { generateHoroscope } from "../../utils/horoscope";
import z from "zod";
import { setResponseHeader } from "@tanstack/react-start/server";
import { getDB } from "../../db";
import { and, eq } from "drizzle-orm";
import { horoscopeContent, signs } from "../../db/schema/schema";

const signMap: Record<string, string> = {
  aries: "Áries",
  touro: "Touro",
  gemeos: "Gêmeos",
  cancer: "Câncer",
  leao: "Leão",
  virgem: "Virgem",
  libra: "Libra",
  escorpiao: "Escorpião",
  sagitario: "Sagitário",
  capricornio: "Capricórnio",
  aquario: "Aquário",
  peixes: "Peixes",
};

const schema = z.object({
  signo: z.string(),
});

const generateFn = createServerFn({ method: "GET" })
  .validator(schema)
  .handler(async ({ data: { signo } }) => {
    setResponseHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");

    const properSignName = signMap[signo.toLowerCase()];
    if (!properSignName) {
      throw new Error(`Invalid sign: ${signo}`);
    }

    const saoPauloDate = new Date().toLocaleString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });

    const today = saoPauloDate.split(",")[0].trim();

    const sign = await getDB().query.signs.findFirst({
      where: eq(signs.namePt, properSignName),
      columns: { id: true, namePt: true },
    });

    if (!sign) {
      throw new Error(`Sign ${signo} not found`);
    }

    const todayHoroscope = await getDB().query.horoscopeContent.findFirst({
      where: and(
        eq(horoscopeContent.effectiveDate, today),
        eq(horoscopeContent.signId, sign.id)
      ),
    });

    const returnData = {
      text: todayHoroscope?.fullText,
      sign: sign.namePt,
      today,
    };

    if (!todayHoroscope) {
      const data = await generateHoroscope(today, signo);

      if (!data) {
        throw new Error("not able to generate content");
      }

      await getDB()
        .insert(horoscopeContent)
        .values({
          signId: sign.id,
          effectiveDate: today,
          fullText: data,
          previewText: data?.slice(0, 30),
          typeId: 1,
        });

      returnData.text = data;
    }

    return returnData;
  });

export const Route = createFileRoute("/horoscopo-do-dia/$signo")({
  loader: ({ params: { signo } }) => generateFn({ data: { signo } }),
  head: ({ loaderData, params: { signo } }) => {
    if (!loaderData) {
      return {
        meta: [
          ...seo({
            title: `Horóscopo de hoje para o signo de ${signo}`,
            description: `Veja as previsões de ${signo} para hoje: amor, dinheiro, trabalho e bem-estar. Dicas práticas + números e cor da sorte. Leia agora!`,
          }),
        ],
      };
    }

    return {
      meta: [
        ...seo({
          title: `Horóscopo de hoje, ${formatDateToPortuguese(loaderData.today)}, para o signo de ${loaderData.sign}`,
          description: `Veja as previsões de ${signo} para hoje, ${formatDateToPortuguese(loaderData.today)}: amor, dinheiro, trabalho e bem-estar. Dicas práticas + números e cor da sorte. Leia agora!`,
        }),
      ],
    };
  },
  staleTime: 12 * 60 * 60 * 1000, // 12 hours
});
