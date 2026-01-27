"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative mt-24 text-sm text-white/50">
      {/* Fondo sutil */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent" aria-hidden="true" />
      </div>
      
      {/* Línea decorativa superior */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden="true" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 safe-bottom">
        {/* CTA Newsletter - Diseño Minimalista */}
        <div className="relative -mt-16 mb-16">
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl">
            <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-lg">
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40 mb-3">
                  Newsletter
                </span>
                
                <h2 className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                  Mantente informado
                </h2>
                <p className="mt-2 text-sm text-white/40 leading-relaxed max-w-md">
                  Recibe notificaciones de partidos y estadísticas exclusivas.
                </p>
              </div>
              
              {/* Formulario */}
              <div className="w-full lg:w-auto lg:min-w-[320px]">
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        aria-label="Correo electrónico"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none transition-all duration-200"
                        required
                      />
                      {subscribed && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                          ✓
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="touch-target touch-ripple inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-white/90"
                    >
                      <span>{subscribed ? "¡Listo!" : "Suscribirme"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/30">
                    Sin spam. Cancela cuando quieras.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Grid principal del footer */}
        <div className="grid grid-cols-1 gap-8 border-t border-white/5 pt-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center font-semibold text-black group-hover:scale-105 transition-transform duration-300">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">
                  EMob
                </span>
                <span className="text-[9px] font-medium text-white/40 tracking-widest uppercase">
                  Esports
                </span>
              </div>
            </Link>
            <p className="text-white/40 mt-4 leading-relaxed max-w-sm text-sm">
              Tu plataforma para seguir esports en vivo, estadísticas y torneos.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-2 mt-5">
              {[
                { name: "Twitter", icon: "𝕏", href: "#" },
                { name: "YouTube", icon: "▶", href: "#" },
                { name: "Discord", icon: "💬", href: "#" },
                { name: "Twitch", icon: "📺", href: "#" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="touch-target touch-ripple w-9 h-9 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/40 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-white"
                >
                  <span className="text-sm">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links - Explorar */}
          <div>
            <h3 className="text-xs font-medium text-white/60 tracking-wider uppercase mb-4">Explorar</h3>
            <ul className="space-y-2.5">
              {[
                { name: "Inicio", href: "/" },
                { name: "Partidos", href: "/esports" },
                { name: "Equipos", href: "/equipos" },
                { name: "Jugadores", href: "/jugadores" },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-white/40 transition-colors duration-200 hover:text-white text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links - Juegos */}
          <div>
            <h3 className="text-xs font-medium text-white/60 tracking-wider uppercase mb-4">Juegos</h3>
            <ul className="space-y-2.5">
              {[
                { name: "Dota 2", href: "/esports/game/dota2" },
                { name: "League of Legends", href: "/esports/game/lol" },
                { name: "Counter-Strike 2", href: "/esports/game/csgo" },
                { name: "Overwatch 2", href: "/esports/game/overwatch" },
                { name: "Rainbow Six", href: "/esports/game/r6siege" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/40 transition-colors duration-200 hover:text-white text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links - Legal */}
          <div>
            <h3 className="text-xs font-medium text-white/60 tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-2.5">
              {[
                { name: "Privacidad", href: "#" },
                { name: "Términos de uso", href: "#" },
                { name: "Cookies", href: "#" },
                { name: "Contactar", href: "#" },
              ].map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-white/40 transition-colors duration-200 hover:text-white text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 py-6 border-t border-white/5 sm:flex-row">
          <p className="text-white/30 text-xs">
            © {year} EMob. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium text-white/40 bg-white/5">
              v2.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
