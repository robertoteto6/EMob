"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-20">
      {/* Accent top divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
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
              <a href="#" aria-label="X/Twitter" className="p-2 rounded-lg border border-border/60 hover:border-accent/50 transition-colors">
                <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.77 3H17.7l-4.61 6.18L9.5 6.1 3 14.96h3.08l3.83-5.13 2.59 3.08L21 3.67 20.77 3z"/></svg>
              </a>
              <a href="#" aria-label="YouTube" className="p-2 rounded-lg border border-border/60 hover:border-accent/50 transition-colors">
                <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 15l5.19-3L10 9v6zm11.5-6.5s-.2-1.43-.82-2.05c-.78-.82-1.65-.82-2.05-.87C16.68 5.3 12 5.3 12 5.3h-.01s-4.68 0-6.62.28c-.4.05-1.27.05-2.05.87C2.7 7.07 2.5 8.5 2.5 8.5S2.3 10.2 2.3 12v.01c0 1.8.2 3.49.2 3.49s.2 1.43.82 2.05c.78.82 1.8.79 2.26.87 1.64.16 6.42.27 6.42.27s4.68 0 6.62-.28c.4-.05 1.27-.05 2.05-.87.62-.62.82-2.05.82-2.05s.2-1.8.2-3.6v-.01c0-1.8-.2-3.49-.2-3.49z"/></svg>
              </a>
              <a href="#" aria-label="Discord" className="p-2 rounded-lg border border-border/60 hover:border-accent/50 transition-colors">
                <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 24l-4.7-3.6.5 1.8h-14L2 24l2.3-7.9c-.7-1.2-1.1-2.6-1.1-4 0-5.5 4.5-10 10-10s10 4.5 10 10c0 1.4-.4 2.8-1.1 4L22 24zM8.3 10.7c-.8 0-1.5.8-1.5 1.8s.7 1.8 1.5 1.8 1.5-.8 1.5-1.8-.6-1.8-1.5-1.8zm7.4 0c-.8 0-1.5.8-1.5 1.8s.7 1.8 1.5 1.8 1.5-.8 1.5-1.8-.6-1.8-1.5-1.8z"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Explorar</h3>
            <ul className="mt-4 space-y-2 text-gray-400">
              <li><Link className="hover:text-white transition-colors" href="/">Inicio</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/esports">Partidos</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/equipos">Equipos</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/jugadores">Jugadores</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Juegos</h3>
            <ul className="mt-4 space-y-2 text-gray-400">
              <li><Link className="hover:text-white transition-colors" href="/esports/game/dota2">Dota 2</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/esports/game/leagueoflegends">LoL</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/esports/game/counterstrike">CS2</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/esports/game/overwatch">Overwatch</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/esports/game/rainbow6siege">R6</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-2 text-gray-400">
              <li><a className="hover:text-white transition-colors" href="#">Privacidad</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Términos</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Contactar</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {year} EMob. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2">
            <span className="chip">v1.0</span>
            <span className="chip">Beta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

