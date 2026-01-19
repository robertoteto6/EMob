"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BellIcon, XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import SearchLazy from "./SearchLazy";
import ThemeToggle from "./ThemeToggle";
import { optimizeScroll } from "../lib/utils";

function HeaderContent() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isScrolledRef = useRef(false);
  const pathname = usePathname();

  // Ocultar header en páginas de detalles de esports que tienen su propio header local
  const shouldHideHeader = pathname?.includes('/esports/') && pathname?.split('/').length > 2;

  useEffect(() => {
    setIsClient(true);

    const handleScroll = optimizeScroll(() => {
      const nextScrolled = window.scrollY > 20;
      if (isScrolledRef.current !== nextScrolled) {
        isScrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }
    });

    // Establecer el estado inicial del scroll
    handleScroll();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Inicio", href: "/", icon: "🏠" },
    { name: "Partidos", href: "/esports", icon: "⚔️" },
    { name: "Equipos", href: "/equipos", icon: "👥" },
    { name: "Jugadores", href: "/jugadores", icon: "🎮" },
  ];

  // Early return for esports detail pages
  if (shouldHideHeader) {
    return null;
  }

  return (
    <header
      className={`group fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isClient && isScrolled
          ? "bg-black/85 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)]"
          : "bg-gradient-to-b from-black/50 to-transparent"
      }`}
      role="banner"
    >
      {/* Línea decorativa superior */}
      <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent transition-opacity duration-500 ${isClient && isScrolled ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
      
      {/* Línea decorativa inferior */}
      <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent transition-opacity duration-500 ${isClient && isScrolled ? 'opacity-100' : 'opacity-50'}`} aria-hidden="true" />
      
      {/* Efecto de hover en todo el header */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-sky-500/5 to-purple-500/5" aria-hidden="true" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          {/* Logo mejorado */}
          <Link href="/" className="flex items-center gap-3 group/logo" aria-label="EMob inicio">
            <div className="relative">
              {/* Anillo de glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover/logo:opacity-60 blur-md transition-all duration-500" aria-hidden="true" />
              
              <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-xl flex items-center justify-center font-black text-black text-lg group-hover/logo:scale-110 transition-all duration-300 shadow-lg shadow-emerald-500/40">
                <span className="drop-shadow-sm">E</span>
                {/* Brillo interno */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-xl" aria-hidden="true" />
              </div>
              
              {/* Borde animado */}
              <span className="absolute inset-0 rounded-xl border-2 border-white/0 group-hover/logo:border-white/30 transition-all duration-500 scale-100 group-hover/logo:scale-110" aria-hidden="true" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
                EMob
              </span>
              <span className="text-[10px] font-medium text-white/40 tracking-widest uppercase -mt-1 hidden sm:block">
                Esports Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Diseño mejorado */}
          <nav className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-inner shadow-black/20">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-5 py-2.5 text-sm font-semibold transition-all duration-300 rounded-xl group/nav overflow-hidden ${
                  pathname === item.href
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {/* Fondo activo/hover */}
                <span className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  pathname === item.href
                    ? "bg-gradient-to-r from-emerald-500/20 via-emerald-500/15 to-cyan-500/20 shadow-inner shadow-emerald-500/10"
                    : "bg-transparent group-hover/nav:bg-white/5"
                }`} />
                
                {/* Indicador activo */}
                {pathname === item.href && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
                )}
                
                <span className="relative flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* Search Bar mejorado */}
          <div className="hidden lg:block w-72 xl:w-80">
            <SearchLazy globalSearch={true} placeholder="Buscar equipos, jugadores..." />
          </div>

          {/* Actions mejoradas */}
          <div className="hidden md:flex items-center gap-2">
            {/* Botón de alertas con badge */}
            <button
              className="relative group/btn inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 hover:from-emerald-500 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 overflow-hidden"
              aria-label="Ver notificaciones"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" aria-hidden="true" />
              
              <BellIcon className="w-5 h-5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Alertas</span>
              
              {/* Badge de notificaciones */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                3
              </span>
            </button>
            
            {/* Botón Pro/Premium */}
            <button
              className="hidden xl:inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50"
              aria-label="Actualizar a Pro"
            >
              <SparklesIcon className="w-4 h-4" aria-hidden="true" />
              <span>Pro</span>
            </button>
            
            <ThemeToggle />
          </div>

          {/* Mobile menu button mejorado */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden inline-flex items-center justify-center p-2.5 rounded-xl border backdrop-blur-xl transition-all duration-300 ${
              isMobileMenuOpen 
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
            }`}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="sr-only">{isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}</span>
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6 transition-transform duration-300 rotate-90" aria-hidden="true" />
            ) : (
              <Bars3Icon className="w-6 h-6 transition-transform duration-300" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation mejorado */}
        <div className={`lg:hidden absolute top-full left-0 right-0 overflow-hidden transition-all duration-500 ease-out ${
          isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="bg-black/95 backdrop-blur-2xl border-b border-emerald-500/20 shadow-2xl shadow-black/50">
            {/* Barra de búsqueda móvil */}
            <div className="p-4 border-b border-white/5">
              <SearchLazy globalSearch={true} compact={true} placeholder="Buscar equipos, jugadores..." />
            </div>
            
            {/* Links de navegación */}
            <nav className="flex flex-col py-2">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group/mobile-nav flex items-center gap-4 px-6 py-4 text-base font-medium transition-all duration-300 hover:bg-white/5 ${
                    pathname === item.href
                      ? "text-emerald-400 bg-emerald-500/10 border-l-2 border-emerald-500"
                      : "text-gray-300 hover:text-white border-l-2 border-transparent"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                  {pathname === item.href && (
                    <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      Actual
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            
            {/* Acciones móviles */}
            <div className="p-4 border-t border-white/5 space-y-3">
              <button
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30"
                aria-label="Ver notificaciones"
              >
                <BellIcon className="w-5 h-5" aria-hidden="true" />
                <span>Ver Alertas</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
              </button>
              
              <div className="flex items-center justify-between gap-3">
                <button
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border border-purple-500/30"
                  aria-label="Actualizar a Pro"
                >
                  <SparklesIcon className="w-4 h-4" aria-hidden="true" />
                  <span>Ir a Pro</span>
                </button>
                <ThemeToggle className="flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderContent />
    </Suspense>
  );
}
