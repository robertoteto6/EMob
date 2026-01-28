import Link from "next/link";

const highlights = [
  {
    icon: "⚡",
    label: "Alertas en vivo",
    description: "Notificaciones instantáneas de tus juegos favoritos. Nunca te pierdas un momento importante.",
  },
  {
    icon: "🎯",
    label: "Cobertura multijuego",
    description: "Dota 2, LoL, CS2 y más en un solo lugar. Todo el ecosistema esports a tu alcance.",
  },
  {
    icon: "📊",
    label: "Estadísticas avanzadas",
    description: "Datos clave para cada liga y enfrentamiento. Análisis detallado de equipos y jugadores.",
  },
];

const features = [
  {
    title: "Partidos en tiempo real",
    description: "Monitoriza resultados en vivo, consulta horarios de las mejores ligas y recibe alertas instantáneas.",
    icon: "🔴",
  },
  {
    title: "Torneos activos",
    description: "Sigue los torneos más importantes que están en curso en este momento.",
    icon: "🏆",
  },
  {
    title: "Equipos y jugadores",
    description: "Explora perfiles detallados de equipos y jugadores profesionales.",
    icon: "👥",
  },
  {
    title: "Personalización",
    description: "Configura notificaciones y selecciona tus títulos favoritos para recomendaciones personalizadas.",
    icon: "⚙️",
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
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-28">
        {/* Fondo con patrón */}
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

        {/* Orbes de luz sutiles */}
        <div className="absolute -left-40 top-10 -z-10 h-[500px] w-[500px] rounded-full bg-white/5 blur-[100px]" aria-hidden="true" />
        <div className="absolute -right-40 top-40 -z-10 h-[400px] w-[400px] rounded-full bg-white/5 blur-[80px]" aria-hidden="true" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                Temporada 2025 · En directo
              </span>
            </div>

            {/* Título principal */}
            <h1 className="mt-8 text-3xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="text-white">Toda la escena</span>
              <br />
              <span className="text-white">esports</span>
              <span className="text-white/60"> en </span>
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">vivo</span>
                <span className="absolute -inset-1 -z-10 rounded-lg bg-white/10 blur-sm" aria-hidden="true"></span>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-white/60 sm:text-lg lg:text-xl leading-relaxed">
              Monitoriza resultados en tiempo real, consulta horarios de las mejores ligas y recibe alertas instantáneas de
              <span className="text-white font-semibold"> Dota 2</span>,
              <span className="text-white font-semibold"> League of Legends</span>,
              <span className="text-white font-semibold"> CS2</span> y más.
            </p>

            {/* Botones de acción */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="group relative touch-target touch-ripple inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                <span className="relative z-10 flex items-center gap-2">
                  🧭 Ir al dashboard
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/esports"
                className="group touch-target touch-ripple inline-flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-transparent px-8 py-4 text-base font-bold text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/5 hover:text-white"
              >
                <span>🎮</span>
                Explorar partidos
                <span className="text-white/60 transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Highlights cards */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {highlights.map((item, index) => (
              <div
                key={item.label}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <h2 className="text-lg font-bold text-white">{item.label}</h2>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" aria-hidden="true" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-white/50 text-sm sm:text-lg max-w-2xl mx-auto">
              Las herramientas más completas para seguir el mundo esports
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Fondo */}
          <div className="absolute inset-0 bg-white/5" aria-hidden="true" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-[100px]" aria-hidden="true" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-[100px]" aria-hidden="true" />

          {/* Borde decorativo */}
          <div className="absolute inset-0 rounded-2xl border border-white/10" aria-hidden="true" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />

          <div className="relative text-center px-6 py-12 sm:py-16 lg:py-24">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-6">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Únete ahora
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-6 max-w-3xl mx-auto leading-tight">
              ¿Listo para sumergirte en el{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                mundo esports
              </span>
              ?
            </h2>

            <p className="text-sm sm:text-lg lg:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Únete a miles de usuarios que ya siguen sus equipos favoritos y nunca se pierden un partido importante.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/esports"
                className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-white px-10 py-4 text-lg font-bold text-black transition-all duration-300 hover:bg-white/90 hover:scale-[1.02] overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                <span className="relative z-10 flex items-center gap-2">
                  🚀 Comenzar Ahora
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-8 py-4 text-lg font-bold text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/5 hover:text-white"
              >
                Hablar con nosotros
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-white/40 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
