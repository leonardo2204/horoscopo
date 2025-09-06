import { Link } from '@tanstack/react-router'

export function NotFound({ children }: { children?: any }) {
  return (
    <main className="min-h-screen bg-principal flex items-center justify-center px-4">
      <div className="max-w-lg mx-auto text-center">
        {/* Mystical constellation background */}
        <div className="relative mb-8">
          <div className="absolute inset-0 opacity-10">
            <svg
              className="w-full h-32"
              viewBox="0 0 200 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke="currentColor" strokeWidth="1" className="text-acento-mistico">
                <circle cx="40" cy="30" r="1.5" fill="currentColor" />
                <circle cx="80" cy="20" r="1.5" fill="currentColor" />
                <circle cx="120" cy="40" r="1.5" fill="currentColor" />
                <circle cx="160" cy="25" r="1.5" fill="currentColor" />
                <line x1="40" y1="30" x2="80" y2="20" />
                <line x1="80" y1="20" x2="120" y2="40" />
                <line x1="120" y1="40" x2="160" y2="25" />
              </g>
            </svg>
          </div>
          
          {/* 404 with mystical styling */}
          <h1 className="text-6xl md:text-8xl font-bold text-acento-mistico opacity-20 relative z-10">
            404
          </h1>
        </div>

        {/* Main error message */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="text-4xl mb-4">🔮</div>
          <h2 className="text-2xl md:text-3xl font-bold text-acento-mistico mb-4">
            Ops! Página não encontrada
          </h2>
          
          <div className="text-padrao/80 mb-6">
            {children || (
              <p className="text-lg leading-relaxed">
                Parece que esta página se perdeu no cosmos... 
                <br />
                Que tal voltarmos ao seu horóscopo?
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto bg-transparent border-2 border-acento-mistico text-acento-mistico hover:bg-acento-mistico/10 font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Voltar
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto bg-acento-mistico hover:bg-acento-mistico/90 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Ver horóscopo de hoje ✨
            </Link>
          </div>
        </div>

        {/* Mystical quote */}
        <p className="text-padrao/60 text-sm italic">
          "Nem todas as jornadas seguem o caminho planejado pelas estrelas..."
        </p>
      </div>
    </main>
  )
}
