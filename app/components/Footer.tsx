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
    <footer className="relative mt-32 text-sm text-gray-400">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px]" aria-hidden="true" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-[120px]" aria-hidden="true" />
      </div>
      
      {/* Línea decorativa superior */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" aria-hidden="true" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* CTA Newsletter - Diseño Premium */}
        <div className="relative -mt-20 mb-20">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(16,185,129,0.3)]">
            {/* Efectos decorativos */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/15 rounded-full blur-[80px]" aria-hidden="true" />
            
            {/* Borde superior brillante */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" aria-hidden="true" />
            
            <div className="relative flex flex-col gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                {/* Badge */}
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Comunidad EMob
                </span>
                
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                  Mantente al día con{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    alertas inteligentes
                  </span>
                </h2>
                <p className="mt-4 text-base text-white/60 leading-relaxed max-w-lg">
                  Únete a más de 50K fans que ya reciben notificaciones de partidos, estadísticas exclusivas y contenido premium de esports.
                </p>
              </div>
              
              {/* Formulario */}
              <div className="w-full lg:w-auto lg:min-w-[360px]">
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        aria-label="Correo electrónico"
                        className="w-full rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                        required
                      />
                      {subscribed && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                          ✓
                        </span>
                      )}
                    </div>
                    <button 
                      type="submit"
                      className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02] overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                      <span className="relative z-10">
                        {subscribed ? "¡Suscrito!" : "Suscribirme"}
                      </span>
                      <span className="relative z-10">→</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/40 flex items-center gap-2">
                    <span>🔒</span>
                    Sin spam. Cancela cuando quieras.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Grid principal del footer */}
        <div className="grid grid-cols-1 gap-10 rounded-3xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 backdrop-blur-xl md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-50 blur transition-opacity duration-500" aria-hidden="true" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-black text-black group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-emerald-500/30">
                  E
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  EMob
                </span>
                <span className="text-[10px] font-medium text-white/40 tracking-widest uppercase">
                  Esports Hub
                </span>
              </div>
            </Link>
            <p className="text-gray-400 mt-5 leading-relaxed max-w-sm">
              Tu plataforma definitiva para seguir esports en vivo, estadísticas detalladas y los mejores torneos del mundo.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-2 mt-6">
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
                  className="group/social relative w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 transition-all duration-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-white hover:scale-110"
                >
                  <span className="text-base">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links - Explorar */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase mb-5">Explorar</h3>
            <ul className="space-y-3">
              {[
                { name: "Inicio", href: "/" },
                { name: "Partidos", href: "/esports" },
                { name: "Equipos", href: "/equipos" },
                { name: "Jugadores", href: "/jugadores" },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="group/link inline-flex items-center gap-2 text-gray-400 transition-all duration-300 hover:text-white"
                  >
                    <span className="w-0 h-px bg-emerald-400 group-hover/link:w-3 transition-all duration-300" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links - Juegos */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase mb-5">Juegos</h3>
            <ul className="space-y-3">
              {[
                { name: "Dota 2", href: "/esports/game/dota2", icon: "⚔️" },
                { name: "League of Legends", href: "/esports/game/leagueoflegends", icon: "🏆" },
                { name: "Counter-Strike 2", href: "/esports/game/counterstrike", icon: "🎯" },
                { name: "Overwatch 2", href: "/esports/game/overwatch", icon: "🦸" },
                { name: "Rainbow Six", href: "/esports/game/rainbow6siege", icon: "🛡️" },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="group/link inline-flex items-center gap-2 text-gray-400 transition-all duration-300 hover:text-white"
                  >
                    <span className="text-xs">{link.icon}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links - Legal */}
          <div>
            <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase mb-5">Legal</h3>
            <ul className="space-y-3">
              {[
                { name: "Privacidad", href: "#" },
                { name: "Términos de uso", href: "#" },
                { name: "Cookies", href: "#" },
                { name: "Contactar", href: "#" },
              ].map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-gray-400 transition-colors duration-300 hover:text-white"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 py-8 border-t border-white/5 sm:flex-row">
          <p className="text-gray-500 text-xs">
            © {year} EMob. Todos los derechos reservados. Hecho con 💚 para la comunidad esports.
          </p>
          <div className="flex items-center gap-3">
            {[
              { label: "v2.0", color: "emerald" },
              { label: "Beta", color: "blue" },
              { label: "Powered by Fans", color: "purple" },
            ].map((badge) => (
              <span 
                key={badge.label}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  badge.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  badge.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                }`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
