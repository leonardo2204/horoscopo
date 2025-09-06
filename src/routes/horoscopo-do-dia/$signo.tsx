import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { formatDateToPortuguese, seo } from "~/utils/seo";
import { createServerFn } from "@tanstack/react-start";
import { generateHoroscope } from "../../utils/horoscope";
import z from "zod";
import { setResponseHeader } from "@tanstack/react-start/server";
import { getDB } from "../../db";
import { and, eq } from "drizzle-orm";
import { horoscopeContent, signs } from "../../db/schema/schema";

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

const generateFn = createServerFn({ method: "GET" })
  .validator(schema)
  .handler(async ({ data: { signo } }) => {
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
      throw new Error(`Sign ${signo} not found`);
    }

    const todayHoroscope = await getDB().query.horoscopeContent.findFirst({
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
      dateRange,
      signosNavigation,
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
  component: RouteComponent,
  pendingComponent: LoadingSpinner,
  loader: ({ params: { signo } }) => generateFn({ data: { signo } }),
  head: ({ loaderData, params: { signo } }) => {
    if (!loaderData || !loaderData.sign) {
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
  const { signo } = useParams({ from: "/horoscopo-do-dia/$signo" });
  const horoscopeData = Route.useLoaderData();

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
            onClick={() => window.location.reload()}
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
          <span>Horóscopo de {horoscopeData.sign}</span>
        </nav>
      </div>

      {/* Hero com data atual */}
      <section className="px-4 py-8 md:py-12 bg-gradient-to-br from-acento-mistico/5 to-toque-solar/5">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-acento-mistico mb-4">
            <span className="text-4xl md:text-5xl lg:text-6xl mr-3">
              {/* {dadosSigno.emoji} */}
            </span>
            Horóscopo do dia{" "}
            {formatDateToPortuguese(
              new Date().toLocaleDateString("pt-br", {
                timeZone: "America/Sao_Paulo",
              })
            )}{" "}
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
      <section className="px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="prose prose-lg max-w-none">
              {horoscopeData.text}
              {/* {dadosSigno.completo
                .split("\n\n")
                .map((paragrafo: string, index: number) => {
                  if (paragrafo.startsWith("**Dica do dia:**")) {
                    return (
                      <div
                        key={index}
                        className="bg-toque-solar/10 rounded-xl p-4 my-6 border-l-4 border-toque-solar"
                      >
                        <p className="font-semibold text-toque-solar mb-2 flex items-center gap-2">
                          <span>💡</span> Dica do dia
                        </p>
                        <p className="text-padrao mb-0">
                          {paragrafo.replace("**Dica do dia:**", "").trim()}
                        </p>
                      </div>
                    );
                  } else if (paragrafo.startsWith("**Mantra:**")) {
                    return (
                      <div
                        key={index}
                        className="bg-acento-mistico/10 rounded-xl p-4 my-6 text-center border border-acento-mistico/20"
                      >
                        <p className="font-semibold text-acento-mistico mb-2 flex items-center justify-center gap-2">
                          <span>🧘‍♀️</span> Mantra do dia
                        </p>
                        <p className="text-lg italic text-acento-mistico font-medium mb-0">
                          {paragrafo
                            .replace("**Mantra:**", "")
                            .trim()
                            .replace(/"/g, "")}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <p
                        key={index}
                        className="text-padrao text-base md:text-lg leading-relaxed mb-4"
                      >
                        {paragrafo
                          .split("**")
                          .map((parte: string, i: number) =>
                            i % 2 === 1 ? (
                              <strong key={i} className="text-acento-mistico">
                                {parte}
                              </strong>
                            ) : (
                              parte
                            )
                          )}
                      </p>
                    );
                  }
                })} */}
            </div>
          </div>
        </div>
      </section>

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
                to="/horoscopo-do-dia/$signo"
                params={{ signo: dados.chave }}
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
      <section
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
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 md:py-12 bg-acento-mistico">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-6">
            <a
              href="/sobre"
              className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
            >
              Sobre
            </a>
            <a
              href="/privacidade"
              className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
            >
              Política de Privacidade
            </a>
            <a
              href="/contato"
              className="text-white/80 hover:text-white transition-colors text-sm md:text-base"
            >
              Contato
            </a>
          </div>

          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            Feito com carinho por brasileiros que acreditam no poder dos astros
            ✨
          </p>
        </div>
      </footer>
    </main>
  );
}
