import { createFileRoute, useParams } from "@tanstack/react-router";
import { formatDateToPortuguese, seo } from "~/utils/seo";
import { getCategoryHoroscopeFn } from "~/utils/categoryHoroscope";
import { usePageView, useAnalytics, ANALYTICS_EVENTS } from "~/utils/analytics";
import HoroscopeBreadcrumb from "~/components/HoroscopeBreadcrumb";
import HoroscopeHero from "~/components/HoroscopeHero";
import HoroscopeContent from "~/components/HoroscopeContent";
import SocialShare from "~/components/SocialShare";
import SignNavigation from "~/components/SignNavigation";
import HoroscopeCategories from "~/components/HoroscopeCategories";

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
        <div className="text-padrao/60 text-sm text-black-safe">
          Aguarde enquanto preparamos seu horóscopo personalizado
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/horoscopo-do-dia/$signo/$categoria")({
  component: RouteComponent,
  pendingComponent: LoadingSpinner,
  loader: ({ params: { signo, categoria } }) =>
    getCategoryHoroscopeFn({ data: { signo, categoria } }),
  head: ({ loaderData, params: { signo, categoria } }) => {
    const canonicalUrl = new URL(
      `/horoscopo-do-dia/${signo}/${categoria}`,
      "https://meuhoroscopo.com"
    );

    if (!loaderData || !loaderData.sign) {
      return {
        meta: [
          ...seo({
            title: `Horóscopo de ${categoria} para o signo de ${signo}`,
            description: `Horóscopo de ${signo} hoje: ${categoria} - Marque seu dia. Veja as previsões astrais atualizadas para ${signo} em 2025.`,
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
          title: `Horóscopo sobre ${loaderData.category}, ${formatDateToPortuguese(loaderData.today)}, para o signo de ${loaderData.sign}`,
          description: `Horóscopo de ${signo} hoje: ${categoria} - Marque seu dia. Veja as previsões astrais atualizadas para ${signo} em 2025.`,
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

function RouteComponent() {
  const { signo } = useParams({
    from: "/horoscopo-do-dia/$signo/$categoria",
  });
  const horoscopeData = Route.useLoaderData();
  const { track } = useAnalytics();

  // Track horoscope page view
  usePageView("horoscope_detail", {
    sign: horoscopeData?.sign,
    category: horoscopeData?.category,
    has_category: true,
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
          <div className="text-red-500 mb-4 text-black-safe">Erro ao carregar o horóscopo</div>
          <button
            onClick={() => {
              track(ANALYTICS_EVENTS.ERROR_RETRY_CLICKED, {
                component: "horoscope_page",
                sign: signo,
                category: horoscopeData?.category,
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
      <HoroscopeBreadcrumb
        signName={horoscopeData.sign}
        signo={signo}
        categoryName={horoscopeData.category}
      />

      {/* Hero section */}
      <HoroscopeHero
        signName={horoscopeData.sign}
        dateRange={horoscopeData.dateRange}
        categoryName={horoscopeData.category}
      />

      {/* Horóscopo detalhado */}
      <section className="px-4 py-8 md:pb-12">
        <div className="max-w-3xl mx-auto">
          <HoroscopeCategories sign={signo} />
          <HoroscopeContent
            text={horoscopeData.text}
            signId={horoscopeData.signId}
            effectiveDate={horoscopeData.today}
            categoryId={horoscopeData.categoryId}
          />
        </div>
      </section>

      {/* Social Share */}
      <SocialShare
        text={horoscopeData.text}
        url={typeof window !== "undefined" ? window.location.href : ""}
        sign={horoscopeData.sign}
        category={horoscopeData.category}
      />

      {/* Sign Navigation */}
      <SignNavigation
        signosNavigation={horoscopeData.signosNavigation}
        currentSigno={signo}
        currentSignName={horoscopeData.sign}
        linkTo="/horoscopo-do-dia/$signo"
        linkParams={(signo) => ({ signo })}
      />
    </main>
  );
}
