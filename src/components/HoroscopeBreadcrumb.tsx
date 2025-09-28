import { Link } from "@tanstack/react-router";

interface HoroscopeBreadcrumbProps {
  signName: string;
  signo: string;
  categoryName?: string;
}

function HoroscopeBreadcrumb({ signName, signo, categoryName }: HoroscopeBreadcrumbProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <nav className="text-sm text-padrao/60 text-black-safe">
        <Link to="/" className="hover:text-acento-mistico transition-colors">
          Início
        </Link>
        <span className="mx-2">›</span>
        <Link
          to="/horoscopo-do-dia/$signo"
          params={{ signo }}
        >
          Horóscopo de {signName}
        </Link>
        {categoryName && (
          <span> › {categoryName}</span>
        )}
      </nav>
    </div>
  );
}

export default HoroscopeBreadcrumb;