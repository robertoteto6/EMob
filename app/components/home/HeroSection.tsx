import Link from 'next/link';

const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20">
    <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
    <div className="container mx-auto px-6 relative z-10">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-6 gradient-text">
          EMob Esports
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Tu centro de comando para seguir los mejores torneos y partidos de esports en tiempo real
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/esports" className="bg-accent hover:bg-accent-dark text-black px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
            Explorar Partidos
          </Link>
          <button className="border border-accent text-accent hover:bg-accent hover:text-black px-8 py-3 rounded-xl font-semibold transition-all duration-300">
            Ver Torneos
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
