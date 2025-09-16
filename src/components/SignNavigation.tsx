import { Link } from "@tanstack/react-router";
import { useAnalytics, ANALYTICS_EVENTS } from "~/utils/analytics";
import type { SignNavigation as SignNavigationData } from "~/types/horoscope";

interface SignNavigationProps {
  signosNavigation: SignNavigationData[];
  currentSigno: string;
  currentSignName: string;
  categoryName?: string;
  linkTo: "/horoscopo-do-dia/$signo" | "/horoscopo-do-dia/$signo/$categoria";
  linkParams?: (signo: string) => { signo: string } | { signo: string; categoria: string };
}

function SignNavigation({
  signosNavigation,
  currentSigno,
  currentSignName,
  categoryName,
  linkTo,
  linkParams = (signo) => ({ signo })
}: SignNavigationProps) {
  const { track } = useAnalytics();

  return (
    <section className="px-4 py-8 md:py-12 bg-secao-1">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-acento-mistico text-center mb-8">
          Ver outros signos
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {signosNavigation.map((dados) => (
            <Link
              key={dados.chave}
              to={linkTo}
              params={linkParams(dados.chave)}
              onClick={() => {
                if (dados.chave !== currentSigno) {
                  track(ANALYTICS_EVENTS.SIGN_NAVIGATION_CLICKED, {
                    from_sign: currentSignName,
                    to_sign: dados.nome,
                    category: categoryName,
                    location: "sign_navigation",
                  });
                }
              }}
              className={`bg-white rounded-xl p-3 md:p-4 shadow-sm hover:shadow-lg transition-all duration-300 text-center group hover:scale-105 ${
                dados.chave === currentSigno
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
  );
}

export default SignNavigation;