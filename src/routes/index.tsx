import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getDB } from "../db";
import { setResponseHeader } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { horoscopeContent } from "../db/schema/schema";

function normalizeSignName(signName: string): string {
  return signName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

const getSignos = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  const saoPauloDate = new Date().toLocaleString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  const today = saoPauloDate.split(",")[0].trim();

  const signos = await getDB().query.signs.findMany({
    columns: {
      id: true,
      emoji: true,
      startDate: true,
      endDate: true,
      namePt: true,
    },
    with: {
      horoscopeContent: {
        columns: {
          previewText: true,
        },
        where: eq(horoscopeContent.effectiveDate, today),
        limit: 1,
      },
    },
    orderBy: (signs, { asc }) => [asc(signs.id)],
  });

  const signosWithPreview = signos.map((signo) => {
    const content = signo.horoscopeContent[0];
    const previewText = content?.previewText || "Clique para ver o horóscopo";
    const normalizedName = normalizeSignName(signo.namePt);

    // Format dates as dd/MM
    const formatDate = (dateStr: string) => {
      const [month, day] = dateStr.split("-");
      return `${day}/${month}`;
    };

    const dateRange = `${formatDate(signo.startDate)} a ${formatDate(signo.endDate)}`;

    return {
      id: signo.id,
      emoji: signo.emoji,
      namePt: signo.namePt,
      normalizedName,
      previewText,
      dateRange,
    };
  });

  return { signos: signosWithPreview };
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: () => getSignos(),
});

function Home() {
  const { signos } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-principal overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 py-8 md:py-16 lg:py-20">
        {/* Background constellation/zodiac decoration */}
        <div className="absolute inset-0 opacity-5">
          <svg
            className="w-full h-full"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Constellation patterns */}
            <g
              stroke="currentColor"
              strokeWidth="1"
              className="text-acento-mistico"
            >
              {/* Leo constellation */}
              <circle cx="80" cy="80" r="2" fill="currentColor" />
              <circle cx="120" cy="60" r="2" fill="currentColor" />
              <circle cx="160" cy="90" r="2" fill="currentColor" />
              <circle cx="180" cy="120" r="2" fill="currentColor" />
              <circle cx="140" cy="140" r="2" fill="currentColor" />
              <line x1="80" y1="80" x2="120" y2="60" />
              <line x1="120" y1="60" x2="160" y2="90" />
              <line x1="160" y1="90" x2="180" y2="120" />
              <line x1="180" y1="120" x2="140" y2="140" />

              {/* Gemini constellation */}
              <circle cx="300" cy="200" r="2" fill="currentColor" />
              <circle cx="320" cy="180" r="2" fill="currentColor" />
              <circle cx="340" cy="220" r="2" fill="currentColor" />
              <circle cx="360" cy="200" r="2" fill="currentColor" />
              <line x1="300" y1="200" x2="320" y2="180" />
              <line x1="320" y1="180" x2="340" y2="220" />
              <line x1="340" y1="220" x2="360" y2="200" />

              {/* Scattered stars */}
              <circle cx="50" cy="300" r="1.5" fill="currentColor" />
              <circle cx="250" cy="80" r="1.5" fill="currentColor" />
              <circle cx="350" cy="350" r="1.5" fill="currentColor" />
              <circle cx="100" cy="200" r="1.5" fill="currentColor" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-acento-mistico mb-4 md:mb-6">
            Seu horóscopo diário,{" "}
            <span className="text-toque-solar">com vibe brasileira</span>{" "}
            <span className="inline-block">✨</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-padrao/80 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
            Nada de textos genéricos. Aqui você aprende sobre astrologia,
            horóscopo, mapa astra e muito mais!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto sm:max-w-none">
            {/* WhatsApp Button */}
            {/* <a
              href="#whatsapp-section"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("whatsapp-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="flex-shrink-0"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              Receber no WhatsApp
            </a> */}

            {/* Secondary Button */}
            <button
              onClick={() =>
                document
                  .getElementById("horoscope-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full sm:w-auto bg-transparent border-2 border-acento-mistico text-acento-mistico hover:bg-acento-mistico/10 hover:border-acento-mistico font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Ver horóscopo de hoje
            </button>
          </div>
        </div>
      </section>

      {/* Horóscopo de Hoje Section */}
      <section
        id="horoscope-section"
        className="px-4 py-12 md:py-16 bg-secao-1"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-acento-mistico text-center mb-8 md:mb-12">
            Horóscopo de Hoje
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {signos.map((signo) => (
              <Link
                key={signo.id}
                to="/horoscopo-do-dia/$signo"
                params={{ signo: signo.normalizedName }}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105 block"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{signo.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-acento-mistico">
                      {signo.namePt}
                    </h3>
                    <p className="text-xs text-padrao/60">{signo.dateRange}</p>
                  </div>
                </div>
                <p className="text-padrao/80 text-sm leading-relaxed">
                  {signo.previewText}...
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Receba no WhatsApp Section */}
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
              Receba no WhatsApp
            </h2>

            <p className="text-lg text-padrao/80 mb-8 max-w-2xl mx-auto">
              Quer receber seu horóscopo todo dia no zap? É grátis e sem spam.
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
                Quero meu horóscopo diário
              </button>

              <p className="text-sm text-padrao/60">
                Você pode cancelar a qualquer momento. Seus dados estão seguros.
              </p>
            </form>
          </div>
        </div>
      </section> */}

      {/* Upsell Leve Section */}
      {/* <section className="px-4 py-8 md:py-12 bg-secao-2">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-acento-mistico/5 to-toque-solar/5 rounded-xl p-6 md:p-8 border border-acento-mistico/10">
            <div className="flex justify-center mb-4">
              <div className="text-3xl">✨</div>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-acento-mistico mb-3">
              Quer saber seu mapa astral completo?
            </h3>

            <p className="text-padrao/70 mb-6 text-sm md:text-base">
              Descubra todos os segredos do seu céu natal
            </p>

            <button
              className="bg-white border border-acento-mistico text-acento-mistico hover:border-acento-mistico hover:bg-acento-mistico/10 font-medium py-3 px-6 rounded-full transition-all duration-300 text-sm md:text-base shadow-sm hover:shadow-md"
              onClick={() => {
                // Placeholder for future implementation
                console.log("Premium options - to be implemented later");
              }}
            >
              Ver opções premium
            </button>
          </div>
        </div>
      </section> */}
    </main>
  );
}
