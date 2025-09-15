import {
  createFileRoute,
  Link,
  notFound,
  useParams,
} from "@tanstack/react-router";
import { formatDateToPortuguese, seo } from "~/utils/seo";
import { createServerFn } from "@tanstack/react-start";
import { generateHoroscope } from "../../utils/horoscope";
import z from "zod";
import { setResponseHeader } from "@tanstack/react-start/server";
import { getDB } from "../../db";
import { and, eq } from "drizzle-orm";
import {
  horoscopeCategories,
  horoscopeContent,
  horoscopeContentCategories,
  signs,
} from "../../db/schema/schema";
import HoroscopeCategories from "../../components/HoroscopeCategories";
import SocialShare from "../../components/SocialShare";
import HoroscopeVoting from "../../components/HoroscopeVoting";
import {
  usePageView,
  useAnalytics,
  ANALYTICS_EVENTS,
} from "../../utils/analytics";

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
  categoria: z.string().optional(),
});

const generateFn = createServerFn({ method: "GET" })
  .validator(schema)
  .handler(async ({ data: { signo, categoria } }) => {
    setResponseHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");

    let categoryId: number | null = null;
    let categoryName: string | null = null;

    if (categoria) {
      const res = await getDB().query.horoscopeCategories.findFirst({
        columns: {
          id: true,
          name: true,
          displayNamePt: true,
        },
        where: eq(horoscopeCategories.name, categoria.replace("-", "")),
      });

      if (!res) {
        throw notFound();
      }

      categoryId = res.id;
      categoryName = res.displayNamePt;
    }

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

    const hasCategory = categoria && !!categoryId;

    const todayHoroscope = hasCategory
      ? await getDB()
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
              eq(horoscopeContentCategories.categoryId, categoryId!),
              eq(horoscopeContent.effectiveDate, today),
              eq(horoscopeContent.signId, sign.id)
            )
          )
          .then((rows) => (rows.length > 0 ? rows[0].horoscope_content : null))
      : await getDB().query.horoscopeContent.findFirst({
          where: and(
            eq(horoscopeContent.effectiveDate, today),
            eq(horoscopeContent.signId, sign.id)
          ),
        });

    // Format dates as dd/MM
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

    const returnData = {
      text: todayHoroscope?.fullText,
      sign: sign.namePt,
      signId: sign.id,
      category: categoryName,
      categoryId: categoryId,
      dateRange,
      signosNavigation,
      today,
    };

    if (!todayHoroscope) {
      const data = await generateHoroscope(
        today,
        signo,
        categoria?.replace("-", "") || undefined
      );

      if (!data) {
        throw new Error("not able to generate content");
      }

      if (!hasCategory) {
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
      } else {
        // check if general sign for today exists

        const res = await getDB().query.horoscopeContent.findFirst({
          columns: { id: true },
          where: and(
            eq(horoscopeContent.effectiveDate, today),
            eq(horoscopeContent.signId, sign.id)
          ),
        });

        //if not, we must create first
        if (!res) {
          const data2 = await generateHoroscope(today, signo);
          if (!data2) {
            throw new Error("nao criou horoscopo de hoje (sem categoria)");
          }

          // create the general content and the category one
          await getDB().transaction(async (tx) => {
            const ins = await tx
              .insert(horoscopeContent)
              .values({
                signId: sign.id,
                effectiveDate: today,
                fullText: data,
                previewText: data?.slice(0, 30),
                typeId: 1,
              })
              .returning({ insertedId: horoscopeContent.id });

            await tx.insert(horoscopeContentCategories).values({
              categoryId: categoryId!,
              horoscopeContentId: ins[0].insertedId,
              contentText: data,
            });
          });

          returnData.text = data2;
        } else {
          //otherwise parent exists, only the category must be created
          await getDB().insert(horoscopeContentCategories).values({
            categoryId: categoryId!,
            horoscopeContentId: res.id,
            contentText: data,
          });

          returnData.text = data;
        }
      }
    }

    return returnData;
  });

export const Route = createFileRoute("/horoscopo-do-dia{-$categoria}/$signo")({
  component: RouteComponent,
  pendingComponent: LoadingSpinner,
  loader: ({ params: { signo, categoria } }) =>
    generateFn({ data: { signo, categoria } }),
  head: ({ loaderData, params: { signo, categoria } }) => {
    const canonicalUrl = new URL(
      `/horoscopo-do-dia${!!categoria ? `${categoria}` : ""}/${signo}`,
      "https://meuhoroscopo.com"
    );

    if (!loaderData || !loaderData.sign) {
      return {
        meta: [
          ...seo({
            title: `Horóscopo de hoje para o signo de ${signo}`,
            description: `Veja as previsões de ${signo} para hoje: amor, dinheiro, trabalho e bem-estar. Dicas práticas + números e cor da sorte. Leia agora!`,
            url: canonicalUrl.toString(),
          }),
        ],
        links: [
          {
            rel: "canonical",
            href: canonicalUrl.toString(),
          },
        ],
      };
    }

    return {
      meta: [
        ...seo({
          title: `Horóscopo de ${!!loaderData.category ? loaderData.category : "hoje"}, ${formatDateToPortuguese(loaderData.today)}, para o signo de ${loaderData.sign}`,
          description: `Veja as previsões de ${signo}${!!loaderData.category ? ` e ${loaderData.category}` : ""} para hoje, ${formatDateToPortuguese(loaderData.today)}: amor, dinheiro, trabalho e bem-estar. Dicas práticas + números e cor da sorte. Leia agora!`,
          url: canonicalUrl.toString(),
        }),
      ],
      links: [
        {
          rel: "canonical",
          href: canonicalUrl.toString(),
        },
      ],
    };
  },
  staleTime: 12 * 60 * 60 * 1000, // 12 hours
});

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-principal flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-acento-mistico/20 rounded-full animate-spin border-t-acento-mistico mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>
        <div className="text-acento-mistico mb-2 text-lg font-medium">
          Consultando os astros...
        </div>
        <div className="text-padrao/60 text-sm">
          Aguarde enquanto preparamos seu horóscopo personalizado
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { signo, categoria } = useParams({
    from: "/horoscopo-do-dia{-$categoria}/$signo",
  });
  const horoscopeData = Route.useLoaderData();
  const { track } = useAnalytics();

  // Track horoscope page view
  usePageView("horoscope_detail", {
    sign: horoscopeData?.sign,
    category: horoscopeData?.category,
    has_category: !!categoria,
    date: horoscopeData?.today,
  });

  // Handle loading and error states
  if (!horoscopeData) {
    return (
      <div className="min-h-screen bg-principal flex items-center justify-center">
        <div className="text-center">
          <div className="text-acento-mistico mb-4">
            Carregando horóscopo...
          </div>
        </div>
      </div>
    );
  }

  if (!horoscopeData.text || !horoscopeData.sign) {
    return (
      <div className="min-h-screen bg-principal flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Erro ao carregar o horóscopo</div>
          <button
            onClick={() => {
              track(ANALYTICS_EVENTS.ERROR_RETRY_CLICKED, {
                component: "horoscope_page",
                sign: signo,
              });
              window.location.reload();
            }}
            className="bg-acento-mistico text-white px-4 py-2 rounded"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-principal">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="text-sm text-padrao/60">
          <Link to="/" className="hover:text-acento-mistico transition-colors">
            Início
          </Link>
          <span className="mx-2">›</span>
          <Link
            to="/horoscopo-do-dia{-$categoria}/$signo"
            params={{ signo: signo, categoria: undefined }}
          >
            Horóscopo de {horoscopeData.sign}
          </Link>
          <span>
            {horoscopeData.category ? ` › ${horoscopeData.category}` : ""}
          </span>
        </nav>
      </div>

      {/* Hero com data atual */}
      <section className="px-4 py-4 md:py-8 bg-gradient-to-br from-acento-mistico/5 to-toque-solar/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-acento-mistico mb-4">
            <span className="text-4xl md:text-5xl lg:text-6xl mr-3">
              {/* {dadosSigno.emoji} */}
            </span>
            Horóscopo{" "}
            {horoscopeData.category
              ? `sobre ${horoscopeData.category}`
              : `do dia ${formatDateToPortuguese(
                  new Date().toLocaleDateString("pt-br", {
                    timeZone: "America/Sao_Paulo",
                  })
                )}`}{" "}
            para o signo de {horoscopeData.sign}
          </h1>
          <p className="text-lg text-padrao/70 mb-4">
            {horoscopeData.dateRange}
          </p>
          <h2 className="text-lg md:text-xl text-padrao/80 mb-2 font-medium">
            Previsões de hoje{" "}
            {formatDateToPortuguese(
              new Date().toLocaleDateString("pt-br", {
                timeZone: "America/Sao_Paulo",
              })
            )}{" "}
            no amor, dinheiro e trabalho para {horoscopeData.sign}
          </h2>
          <p className="text-padrao/60 text-sm md:text-base">
            {/* {periodo} */}
          </p>
        </div>
      </section>

      {/* Horóscopo detalhado */}
      <section className="px-4 py-8 md:pb-12">
        <div className="max-w-3xl mx-auto">
          <HoroscopeCategories sign={signo} />
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="prose prose-lg max-w-none">
              {horoscopeData.text}
            </div>
            <HoroscopeVoting
              signId={horoscopeData.signId}
              effectiveDate={horoscopeData.today}
              categoryId={horoscopeData.categoryId || undefined}
            />
          </div>
        </div>
      </section>

      {/* Social Share */}
      <SocialShare
        text={horoscopeData.text}
        url={typeof window !== "undefined" ? window.location.href : ""}
        sign={horoscopeData.sign}
        category={horoscopeData.category || undefined}
      />

      {/* Outros signos */}
      <section className="px-4 py-8 md:py-12 bg-secao-1">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-acento-mistico text-center mb-8">
            Ver outros signos
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
            {horoscopeData.signosNavigation.map((dados) => (
              <Link
                key={dados.chave}
                to="/horoscopo-do-dia{-$categoria}/$signo"
                params={{ signo: dados.chave }}
                onClick={() => {
                  if (dados.chave !== signo) {
                    track(ANALYTICS_EVENTS.SIGN_NAVIGATION_CLICKED, {
                      from_sign: horoscopeData.sign,
                      to_sign: dados.nome,
                      category: horoscopeData.category,
                      location: "sign_navigation",
                    });
                  }
                }}
                className={`bg-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-lg transition-all duration-300 text-center group hover:scale-105 ${
                  dados.chave === signo
                    ? "ring-2 ring-acento-mistico bg-acento-mistico/5"
                    : ""
                }`}
              >
                <div className="text-2xl md:text-3xl mb-1 md:mb-2">
                  {dados.emoji}
                </div>
                <h3 className="font-semibold text-acento-mistico text-sm md:text-base">
                  {dados.nome}
                </h3>
                <p className="text-xs text-padrao/60 mt-1">{dados.dateRange}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimento */}
      {/* <section className="px-4 py-8 md:py-12 bg-secao-2">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-center mb-4">
              <div className="text-3xl">💬</div>
            </div>
            <p className="text-lg md:text-xl text-padrao/80 italic mb-4">
              "{depoimentoAleatorio.texto}"
            </p>
            <p className="text-sm text-acento-mistico font-medium">
              {depoimentoAleatorio.autor}
            </p>
          </div>
        </div>
      </section> */}

      {/* WhatsApp CTA */}
      {/* <section
        id="whatsapp-section"
        className="px-4 py-12 md:py-16 bg-principal"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-green-600"
                >
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-acento-mistico mb-4">
              Gostou do seu horóscopo?
            </h2>

            <p className="text-lg text-padrao/80 mb-8 max-w-2xl mx-auto">
              Receba todos os dias no WhatsApp! É grátis, sem spam, com a vibe
              brasileira que você já ama.
            </p>

            <form className="max-w-md mx-auto space-y-6">
              <div className="relative">
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-acento-mistico focus:outline-none transition-colors"
                  maxLength={15}
                  onInput={(e) => {
                    let value = (e.target as HTMLInputElement).value.replace(
                      /\D/g,
                      ""
                    );
                    value = value.replace(/^(\d{2})(\d)/, "($1) $2");
                    value = value.replace(/(\d{5})(\d)/, "$1-$2");
                    (e.target as HTMLInputElement).value = value;
                  }}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📱
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
              >
                Quero receber meu horóscopo diário
              </button>

              <p className="text-sm text-padrao/60">
                Você pode cancelar a qualquer momento. Seus dados estão seguros.
              </p>
            </form>
          </div>
        </div>
      </section> */}
    </main>
  );
}
