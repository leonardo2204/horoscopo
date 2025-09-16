import { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { getDB } from "../db";
import { useQuery } from "@tanstack/react-query";
import { useAnalytics, ANALYTICS_EVENTS } from "../utils/analytics";
import { setResponseHeader } from "@tanstack/react-start/server";

const getCategoriesFn = createServerFn().handler(async () => {
  setResponseHeader("cache-control", "public, max-age=43200, s-maxage=3600");
  return await getDB().query.horoscopeCategories.findMany();
});

const CategorySkeleton = () => (
  <div className="flex flex-col items-center border rounded-2xl p-6 flex-shrink-0 animate-pulse">
    <div className="w-8 h-8 bg-gray-300 rounded mb-2"></div>
    <div className="w-16 h-4 bg-gray-300 rounded"></div>
  </div>
);

const CategoriesLoadingSkeleton = () => (
  <div className="relative">
    <div className="flex justify-end gap-2 mb-2">
      <div className="bg-gray-200 rounded-full p-2 w-10 h-10 animate-pulse"></div>
      <div className="bg-gray-200 rounded-full p-2 w-10 h-10 animate-pulse"></div>
    </div>
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex flex-row gap-4 my-4">
        {Array.from({ length: 7 }).map((_, idx) => (
          <CategorySkeleton key={idx} />
        ))}
      </div>
    </div>
  </div>
);

const ErrorState = ({
  onRetry,
  sign,
}: {
  onRetry: () => void;
  sign: string;
}) => {
  const { track } = useAnalytics();

  return (
    <div className="relative">
      <div className="flex justify-end gap-2 mb-2 opacity-50">
        <div className="bg-gray-200 rounded-full p-2 w-10 h-10"></div>
        <div className="bg-gray-200 rounded-full p-2 w-10 h-10"></div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex flex-col items-center justify-center py-8">
          <svg
            className="w-12 h-12 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-gray-600 mb-4">Erro ao carregar as categorias</p>
          <button
            onClick={() => {
              track(ANALYTICS_EVENTS.ERROR_RETRY_CLICKED, {
                component: "categories",
                sign: sign,
              });
              onRetry();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
};

function HoroscopeCategories({ sign }: { sign: string }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { track } = useAnalytics();

  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: useServerFn(getCategoriesFn),
    staleTime: 1000 * 60 * 60 * 12,
  });

  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [categories]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.5;
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
      track(ANALYTICS_EVENTS.CATEGORY_SCROLL, {
        direction: "left",
        sign: sign,
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.5;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
      track(ANALYTICS_EVENTS.CATEGORY_SCROLL, {
        direction: "right",
        sign: sign,
      });
    }
  };

  if (isLoading) {
    return <CategoriesLoadingSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={() => refetch()} sign={sign} />;
  }

  return (
    <div className="relative">
      <div className="flex justify-end gap-2 mb-2">
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all ${
            canScrollLeft ? "opacity-100" : "opacity-30 cursor-not-allowed"
          }`}
          aria-label="Arrastar para a esquerda"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all ${
            canScrollRight ? "opacity-100" : "opacity-30 cursor-not-allowed"
          }`}
          aria-label="Arrastar para a direita"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto no-scrollbar">
        <div className="flex flex-row gap-4 my-4">
          {categories?.map((c) => (
            <Link
              to="/horoscopo-do-dia/$signo/$categoria"
              params={{ signo: sign, categoria: c.name }}
              key={c.id}
              onClick={() => {
                track(ANALYTICS_EVENTS.CATEGORY_CLICKED, {
                  category: c.displayNamePt,
                  category_name: c.name,
                  sign: sign,
                });
              }}
              activeProps={{
                className: "font-bold border-2 border-black bg-gray-100",
              }}
              className="flex flex-col items-center border rounded-2xl p-6 flex-shrink-0"
            >
              <div className="text-2xl">{c.icon}</div>
              <p>{c.displayNamePt}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HoroscopeCategories;
