import Link from 'next/link';

const CallToActionSection = () => (
  <section className="container mx-auto px-6 py-20 text-center">
    <div className="bg-gradient-to-r from-accent/20 to-info/20 rounded-2xl p-12 border border-accent/30">
      <h2 className="text-4xl font-bold mb-6">¿Listo para sumergirte en el mundo de los esports?</h2>
      <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
        Únete a miles de usuarios que ya siguen sus equipos favoritos y nunca se pierden un partido importante.
      </p>
      <Link href="/esports" className="bg-gradient-to-r from-accent to-blue-500 hover:from-accent/80 hover:to-blue-500/80 text-black px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg">
        Comenzar Ahora
      </Link>
    </div>
  </section>
);

export default CallToActionSection;
