import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
import { setResponseHeader } from "@tanstack/react-start/server";
import z from "zod";
import { and, eq } from "drizzle-orm";
import { getDB } from "~/db";
import {
  horoscopeContent,
  signs,
  horoscopeCategories,
  horoscopeContentCategories
} from "~/db/schema/schema";
import { generateHoroscope } from "./horoscope";
import type { CategoryHoroscopeData } from "~/types/horoscope";

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
  categoria: z.string(),
});

export const getCategoryHoroscopeFn = createServerFn({ method: "GET" })
  .validator(schema)
  .handler(async ({ data: { signo, categoria } }): Promise<CategoryHoroscopeData> => {
    setResponseHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");

    const properSignName = denormalizeSignName(signo.toLowerCase());
    if (!properSignName) {
      throw new Error(`Invalid sign: ${signo}`);
    }

    const saoPauloDate = new Date().toLocaleString("en-CA", {
      timeZone: "America/Sao_Paulo",
    });

    const today = saoPauloDate.split(",")[0].trim();

    // Get category info
    const categoryRes = await getDB().query.horoscopeCategories.findFirst({
      columns: {
        id: true,
        name: true,
        displayNamePt: true,
      },
      where: eq(horoscopeCategories.name, categoria),
    });

    if (!categoryRes) {
      throw notFound();
    }

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

    // Get category-specific horoscope content
    const todayHoroscope = await getDB()
      .select()
      .from(horoscopeContent)
      .innerJoin(
        horoscopeContentCategories,
        eq(
          horoscopeContent.id,
          horoscopeContentCategories.horoscopeContentId
        )
      )
      .where(
        and(
          eq(horoscopeContentCategories.categoryId, categoryRes.id),
          eq(horoscopeContent.effectiveDate, today),
          eq(horoscopeContent.signId, sign.id)
        )
      )
      .then((rows) => (rows.length > 0 ? rows[0] : null));

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

    const returnData: CategoryHoroscopeData = {
      text: todayHoroscope?.horoscope_content_categories.contentText || null,
      sign: sign.namePt,
      signId: sign.id,
      category: categoryRes.displayNamePt,
      categoryId: categoryRes.id,
      dateRange,
      signosNavigation,
      today,
    };

    if (!todayHoroscope) {
      const generatedText = await generateHoroscope(today, signo, categoria);

      if (!generatedText) {
        throw new Error("Unable to generate category horoscope content");
      }

      // Check if general sign for today exists
      const generalHoroscope = await getDB().query.horoscopeContent.findFirst({
        columns: { id: true },
        where: and(
          eq(horoscopeContent.effectiveDate, today),
          eq(horoscopeContent.signId, sign.id)
        ),
      });

      if (!generalHoroscope) {
        // Create general horoscope first, then the category one
        const generalText = await generateHoroscope(today, signo);
        if (!generalText) {
          throw new Error("Unable to generate general horoscope content");
        }

        await getDB().transaction(async (tx) => {
          const ins = await tx
            .insert(horoscopeContent)
            .values({
              signId: sign.id,
              effectiveDate: today,
              fullText: generalText,
              previewText: generalText.slice(0, 30),
              typeId: 1,
            })
            .returning({ insertedId: horoscopeContent.id });

          await tx.insert(horoscopeContentCategories).values({
            categoryId: categoryRes.id,
            horoscopeContentId: ins[0].insertedId,
            contentText: generatedText,
          });
        });
      } else {
        // Just create the category content
        await getDB().insert(horoscopeContentCategories).values({
          categoryId: categoryRes.id,
          horoscopeContentId: generalHoroscope.id,
          contentText: generatedText,
        });
      }

      returnData.text = generatedText;
    }

    return returnData;
  });