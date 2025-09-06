export function Footer() {
  return (
    <footer className="px-4 py-8 md:py-12 bg-acento-mistico">
      <div className="max-w-4xl mx-auto text-center">
        {/* <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-6">
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
        </div> */}

        <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
          Feito com carinho por brasileiros que acreditam no poder dos astros
          ✨
        </p>
      </div>
    </footer>
  );
}