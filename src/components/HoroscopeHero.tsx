import { formatDateToPortuguese } from "~/utils/seo";

interface HoroscopeHeroProps {
  signName: string;
  dateRange: string;
  categoryName?: string;
}

function HoroscopeHero({ signName, dateRange, categoryName }: HoroscopeHeroProps) {
  const currentDate = new Date().toLocaleDateString("pt-br", {
    timeZone: "America/Sao_Paulo",
  });

  return (
    <section className="px-4 py-4 md:py-8 bg-gradient-to-br from-acento-mistico/5 to-toque-solar/5">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-acento-mistico mb-4">
          <span className="text-4xl md:text-5xl lg:text-6xl mr-3">
            {/* Sign emoji will be added by parent component */}
          </span>
          Horóscopo{" "}
          {categoryName
            ? `sobre ${categoryName}`
            : `do dia ${formatDateToPortuguese(currentDate)}`}{" "}
          para o signo de {signName}
        </h1>
        <p className="text-lg text-padrao/70 mb-4">
          {dateRange}
        </p>
        <h2 className="text-lg md:text-xl text-padrao/80 mb-2 font-medium">
          Previsões de hoje{" "}
          {formatDateToPortuguese(currentDate)}{" "}
          no amor, dinheiro e trabalho para {signName}
        </h2>
      </div>
    </section>
  );
}

export default HoroscopeHero;