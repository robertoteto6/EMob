import Link from "next/link";

const highlights = [
  {
    label: "Alertas en vivo",
    description: "Notificaciones instantáneas de tus juegos favoritos.",
  },
  {
    label: "Cobertura multijuego",
    description: "Dota 2, LoL, CS2 y más en un solo lugar.",
  },
  {
    label: "Estadísticas avanzadas",
    description: "Datos clave para cada liga y enfrentamiento.",
  },
];

const stats = [
  { value: "50K+", label: "Usuarios activos" },
  { value: "1000+", label: "Partidos diarios" },
  { value: "5", label: "Juegos soportados" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black pb-24 pt-24 text-white">
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div className="absolute inset-0 -z-10 opacity-10" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Temporada 2025 · En directo
            </span>
            <h1 className="mt-6 text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
              La landing sigue viva: todo el mundo esports en un solo sitio.
            </h1>
            <p className="mt-6 text-base text-white/60 sm:text-lg">
              Descubre horarios, resultados y alertas instantáneas para mantenerte al día
              con las mejores ligas y equipos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="touch-target touch-ripple inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-all duration-300 hover:bg-white/90"
              >
                🧭 Ir al dashboard
              </Link>
              <Link
                href="/esports"
                className="touch-target touch-ripple inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 py-3 text-sm font-bold text-white/80 transition-all duration-300 hover:border-white/40 hover:bg-white/5 hover:text-white"
              >
                🎮 Explorar partidos
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left"
              >
                <h2 className="text-lg font-bold text-white">{item.label}</h2>
                <p className="mt-2 text-sm text-white/50">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-black sm:text-4xl">
            ¿Listo para sumergirte en el mundo esports?
          </h2>
          <p className="mt-4 text-sm text-white/60 sm:text-base">
            Únete a miles de usuarios que ya siguen sus equipos favoritos y reciben alertas
            personalizadas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/esports"
              className="touch-target touch-ripple inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-all duration-300 hover:bg-white/90"
            >
              🚀 Comenzar ahora
            </Link>
            <Link
              href="/contact"
              className="touch-target touch-ripple inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 py-3 text-sm font-bold text-white/80 transition-all duration-300 hover:border-white/40 hover:bg-white/5 hover:text-white"
            >
              Hablar con nosotros
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs font-semibold text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
