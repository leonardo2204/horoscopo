import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { setResponseHeader } from "@tanstack/react-start/server";
import z from "zod";
import { and, eq } from "drizzle-orm";
import { getDB } from "~/db";
import { horoscopeContent, signs } from "~/db/schema/schema";
import { generateHoroscope } from "./horoscope";
import type { DailyHoroscopeData } from "~/types/horoscope";

function normalizeSignName(signName: string): string {
  return signName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function denormalizeSignName(normalizedName: string): string {
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
  return signMap[normalizedName] || normalizedName;
}

const schema = z.object({
  signo: z.string(),
});

export const getDailyHoroscopeFn = createServerFn({ method: "GET" })
  .validator(schema)
  .handler(async ({ data: { signo } }): Promise<DailyHoroscopeData> => {
    setResponseHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");

    const properSignName = denormalizeSignName(signo.toLowerCase());
    if (!properSignName) {
      throw new Error(`Invalid sign: ${signo}`);
    }

    const saoPauloDate = new Date().toLocaleString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });

    const today = saoPauloDate.split(",")[0].trim();

    const [sign, allSigns] = await Promise.all([
      getDB().query.signs.findFirst({
        where: eq(signs.namePt, properSignName),
        columns: { id: true, namePt: true, startDate: true, endDate: true },
      }),
      getDB().query.signs.findMany({
        columns: {
          id: true,
          namePt: true,
          emoji: true,
          startDate: true,
          endDate: true,
        },
        orderBy: (signs, { asc }) => [asc(signs.id)],
      }),
    ]);

    if (!sign) {
      throw notFound();
    }

    const todayHoroscope = await getDB().query.horoscopeContent.findFirst({
      where: and(
        eq(horoscopeContent.effectiveDate, today),
        eq(horoscopeContent.signId, sign.id)
      ),
    });

    const formatDate = (dateStr: string) => {
      const [month, day] = dateStr.split("-");
      return `${day}/${month}`;
    };

    const dateRange = `${formatDate(sign.startDate)} a ${formatDate(sign.endDate)}`;

    const signosNavigation = allSigns.map((s) => ({
      chave: normalizeSignName(s.namePt),
      nome: s.namePt,
      emoji: s.emoji,
      dateRange: `${formatDate(s.startDate)} a ${formatDate(s.endDate)}`,
    }));

    const returnData: DailyHoroscopeData = {
      text: todayHoroscope?.fullText || null,
      sign: sign.namePt,
      signId: sign.id,
      dateRange,
      signosNavigation,
      today,
    };

    if (!todayHoroscope) {
      const generatedText = await generateHoroscope(today, signo);

      if (!generatedText) {
        throw new Error("Unable to generate horoscope content");
      }

      await getDB()
        .insert(horoscopeContent)
        .values({
          signId: sign.id,
          effectiveDate: today,
          fullText: generatedText,
          previewText: generatedText.slice(0, 30),
          typeId: 1,
        });

      returnData.text = generatedText;
    }

    return returnData;
  });