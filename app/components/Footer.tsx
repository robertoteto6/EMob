"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 text-sm text-gray-400">
      {/* Soft glow background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/80 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" aria-hidden="true" />

      <div className="container mx-auto px-6">
        {/* CTA superior */}
        <div className="relative -mt-16 mb-16 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 backdrop-blur-xl shadow-[0_25px_80px_-35px_rgba(59,130,246,0.65)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.25),transparent_55%)]" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 px-8 py-10 text-center md:px-12 md:py-12 md:text-left md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                Comunidad EMob
              </p>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white leading-tight">
                Mantente al día con alertas de partidos, estadísticas y torneos sorpresa
              </h2>
              <p className="mt-3 max-w-xl text-sm text-white/70">
                Únete a más de 50K fans que ya reciben notificaciones inteligentes y contenido exclusivo de esports.
              </p>
            </div>
            <div className="w-full max-w-md space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  aria-label="Correo electrónico"
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:border-emerald-400 focus:outline-none"
                />
                <button className="inline-flex justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]">
                  Quiero enterarme
                </button>
              </div>
              <p className="text-xs text-white/60">
                Sin spam. Cancelar cuando quieras.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 border border-white/5 bg-white/[0.02] p-10 backdrop-blur-xl rounded-3xl md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center font-extrabold text-black group-hover:scale-110 transition-transform">
                E
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                EMob
              </span>
            </Link>
            <p className="text-gray-400 mt-4 leading-relaxed">
              Tu plataforma definitiva para seguir esports en vivo, estadísticas y torneos.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" aria-label="X/Twitter" className="group/social relative rounded-xl border border-white/10 p-2 text-gray-300 transition-all duration-300 hover:border-emerald-400/60 hover:text-white">
                <span className="absolute inset-0 rounded-xl bg-emerald-400/0 transition group-hover/social:bg-emerald-400/10" aria-hidden="true" />
                <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.77 3H17.7l-4.61 6.18L9.5 6.1 3 14.96h3.08l3.83-5.13 2.59 3.08L21 3.67 20.77 3z"/></svg>
              </a>
              <a href="#" aria-label="YouTube" className="group/social relative rounded-xl border border-white/10 p-2 text-gray-300 transition-all duration-300 hover:border-emerald-400/60 hover:text-white">
                <span className="absolute inset-0 rounded-xl bg-emerald-400/0 transition group-hover/social:bg-emerald-400/10" aria-hidden="true" />
                <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 15l5.19-3L10 9v6zm11.5-6.5s-.2-1.43-.82-2.05c-.78-.82-1.65-.82-2.05-.87C16.68 5.3 12 5.3 12 5.3h-.01s-4.68 0-6.62.28c-.4.05-1.27.05-2.05.87C2.7 7.07 2.5 8.5 2.5 8.5S2.3 10.2 2.3 12v.01c0 1.8.2 3.49.2 3.49s.2 1.43.82 2.05c.78.82 1.8.79 2.26.87 1.64.16 6.42.27 6.42.27s4.68 0 6.62-.28c.4-.05 1.27-.05 2.05-.87.62-.62.82-2.05.82-2.05s.2-1.8.2-3.6v-.01c0-1.8-.2-3.49-.2-3.49z"/></svg>
              </a>
              <a href="#" aria-label="Discord" className="group/social relative rounded-xl border border-white/10 p-2 text-gray-300 transition-all duration-300 hover:border-emerald-400/60 hover:text-white">
                <span className="absolute inset-0 rounded-xl bg-emerald-400/0 transition group-hover/social:bg-emerald-400/10" aria-hidden="true" />
                <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 24l-4.7-3.6.5 1.8h-14L2 24l2.3-7.9c-.7-1.2-1.1-2.6-1.1-4 0-5.5 4.5-10 10-10s10 4.5 10 10c0 1.4-.4 2.8-1.1 4L22 24zM8.3 10.7c-.8 0-1.5.8-1.5 1.8s.7 1.8 1.5 1.8 1.5-.8 1.5-1.8-.6-1.8-1.5-1.8zm7.4 0c-.8 0-1.5.8-1.5 1.8s.7 1.8 1.5 1.8 1.5-.8 1.5-1.8-.6-1.8-1.5-1.8z"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Explorar</h3>
            <ul className="mt-4 space-y-3 text-gray-400">
              <li><Link className="transition-colors hover:text-white" href="/">Inicio</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/esports">Partidos</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/equipos">Equipos</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/jugadores">Jugadores</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Juegos</h3>
            <ul className="mt-4 space-y-3 text-gray-400">
              <li><Link className="transition-colors hover:text-white" href="/esports/game/dota2">Dota 2</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/esports/game/leagueoflegends">LoL</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/esports/game/counterstrike">CS2</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/esports/game/overwatch">Overwatch</Link></li>
              <li><Link className="transition-colors hover:text-white" href="/esports/game/rainbow6siege">R6</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-3 text-gray-400">
              <li><a className="transition-colors hover:text-white" href="#">Privacidad</a></li>
              <li><a className="transition-colors hover:text-white" href="#">Términos</a></li>
              <li><a className="transition-colors hover:text-white" href="#">Contactar</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 py-8 text-sm text-gray-500 sm:flex-row">
          <p>© {year} EMob. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
            <span className="chip">v1.0</span>
            <span className="chip">Beta</span>
            <span className="chip">Powered by Fans</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
