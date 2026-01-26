"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BellIcon, XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";
import SearchLazy from "./SearchLazy";
import ThemeToggle from "./ThemeToggle";
import { useSwipeToClose } from "../hooks/useSwipeGesture";
import { optimizeScroll } from "../lib/utils";
import { useUX } from "./UXEnhancer";

const NAVIGATION = [
  { name: "Inicio", href: "/", icon: "🏠" },
  { name: "Partidos", href: "/esports", icon: "⚔️" },
  { name: "Equipos", href: "/equipos", icon: "👥" },
  { name: "Jugadores", href: "/jugadores", icon: "🎮" },
];

function HeaderContent() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isScrolledRef = useRef(false);
  const { addNotification } = useUX();

  // Hook para swipe gestures en menú móvil
  const swipeToCloseRef = useSwipeToClose(setIsMobileMenuOpen);

  useEffect(() => {
    setIsClient(true);

    const handleScroll = optimizeScroll(() => {
      const nextScrolled = window.scrollY > 20;
      if (isScrolledRef.current !== nextScrolled) {
        isScrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }
    });

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAlertsClick = useCallback(() => {
    addNotification({
      type: "info",
      title: "Alertas",
      message: "Estamos preparando un centro de alertas más completo. Próximamente.",
      duration: 3500,
    });
  }, [addNotification]);

  const handleProClick = useCallback(() => {
    addNotification({
      type: "info",
      title: "EMob Pro",
      message: "La suscripción Pro estará disponible pronto.",
      duration: 3500,
    });
  }, [addNotification]);

  return (
    <header
      className={`group fixed top-0 left-0 right-0 z-50 transition-[background,box-shadow,border-color] duration-300 safe-top ${isClient && isScrolled
        ? "bg-black/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
        : "bg-transparent"
        }`}
      role="banner"
    >
      {/* Línea decorativa superior */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent transition-opacity duration-500 ${isClient && isScrolled ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />

      {/* Línea decorativa inferior */}
      <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent transition-opacity duration-500 ${isClient && isScrolled ? 'opacity-100' : 'opacity-60'}`} aria-hidden="true" />

      {/* Efecto de hover en todo el header */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-amber-400/10" aria-hidden="true" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 safe-top">
        <div
          className={`flex justify-between items-center gap-4 h-16 py-2.5 px-3 sm:px-4 lg:px-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isClient && isScrolled
            ? "bg-black/60 border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            : "bg-black/25 border-white/5"
            }`}
        >
          {/* Logo mejorado */}
          <Link href="/" className="flex items-center gap-3 group/logo" aria-label="EMob inicio">
            <div className="relative">
              {/* Anillo de glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 rounded-2xl opacity-0 group-hover/logo:opacity-60 blur-md transition-all duration-500" aria-hidden="true" />

              <div className="relative w-11 h-11 bg-gradient-to-br from-emerald-300 via-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center font-black text-black text-lg group-hover/logo:scale-110 transition-all duration-300 shadow-lg shadow-emerald-500/30">
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

          {/* Desktop Navigation - Rediseño más premium */}
          <nav
            className="hidden lg:flex items-center gap-0.5 px-1 py-1 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-3xl shadow-lg"
            aria-label="Principal"
          >
            <ul className="flex items-center gap-0.5">
              {NAVIGATION.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`relative px-5 py-2.5 text-sm font-bold tracking-tight transition-all duration-400 rounded-[14px] group/nav overflow-hidden flex items-center gap-2.5 ${pathname === item.href
                      ? "text-white"
                      : "text-white/40 hover:text-white/90"
                      }`}
                  >
                    {/* Fondo para estado activo o hover */}
                    <span className={`absolute inset-0 rounded-[14px] transition-all duration-300 ${pathname === item.href
                      ? "bg-gradient-to-br from-white/[0.08] to-transparent shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                      : "bg-transparent group-hover/nav:bg-white/[0.04]"
                      }`} />

                    {/* Resplandor sutil para item activo */}
                    {pathname === item.href && (
                      <div className="absolute inset-0 bg-emerald-500/5 blur-xl pointer-events-none" aria-hidden="true" />
                    )}

                    {/* Icono con efecto */}
                    <span className={`text-base transition-transform duration-300 group-hover/nav:scale-110 ${pathname === item.href ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "grayscale opacity-70 group-hover/nav:grayscale-0 group-hover/nav:opacity-100"}`}>
                      {item.icon}
                    </span>

                    <span className="relative">
                      {item.name}
                      {/* Línea decorativa inferior muy sutil para el activo */}
                      {pathname === item.href && (
                        <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Search Bar mejorado */}
          <div className="hidden lg:block w-72 xl:w-80">
            <SearchLazy globalSearch={true} placeholder="Buscar equipos, jugadores..." />
          </div>

          {/* Actions mejoradas */}
          <div className="hidden md:flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-inner shadow-black/20 px-2 py-1.5">
            {/* Botón de alertas con badge */}
            <button
              type="button"
              onClick={handleAlertsClick}
              className="group relative touch-target touch-ripple inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 hover:from-emerald-500 hover:to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 overflow-hidden"
              aria-label="Ver notificaciones"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />

              <BellIcon className="w-5 h-5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Alertas</span>

              {/* Badge de notificaciones - más pequeño y elegante */}
              <span className="absolute top-1 right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse text-white shadow-sm">
                3
              </span>
            </button>

            {/* Botón Pro/Premium - Armonizado con Alertas */}
            <button
              type="button"
              onClick={handleProClick}
              className="group relative hidden xl:inline-flex touch-target touch-ripple items-center gap-2 bg-gradient-to-r from-amber-400/80 to-orange-500/80 hover:from-amber-400 hover:to-orange-500 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 overflow-hidden border border-white/10"
              aria-label="Actualizar a Pro"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />

              <SparklesIcon className="w-4 h-4 relative z-10" aria-hidden="true" />
              <span className="relative z-10">Pro</span>
            </button>

            <ThemeToggle />
          </div>

          {/* Mobile menu button mejorado */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden flex items-center justify-center w-11 h-11 rounded-xl border backdrop-blur-xl transition-all duration-300 ${isMobileMenuOpen
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

        {/* Mobile Navigation mejorada con swipe y animaciones fluidas */}
        <div
          ref={swipeToCloseRef}
          className={`lg:hidden absolute top-full left-0 right-0 overflow-hidden mobile-transition ${isMobileMenuOpen
            ? "max-h-[85vh] opacity-100 pointer-events-auto"
            : "max-h-0 opacity-0 pointer-events-none"
            }`}
          style={{
            transitionProperty: 'max-height, opacity',
            transitionDuration: isMobileMenuOpen ? '0.35s' : '0.25s',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {/* Backdrop blur mejorado */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl touch-none" aria-hidden="true" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative bg-black/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50 mobile-scroll-y max-h-[85vh] overflow-y-auto overscroll-contain">
            {/* Handle indicator para swipe */}
            <div className="flex justify-center py-2 border-b border-white/5">
              <div className="w-10 h-1 bg-white/20 rounded-full" aria-hidden="true" />
            </div>

            {/* Barra de búsqueda móvil */}
            <div className="p-4 border-b border-white/5">
              <SearchLazy globalSearch={true} compact={true} placeholder="Buscar equipos, jugadores..." />
            </div>

            {/* Links de navegación con animación escalonada */}
            <nav className="flex flex-col py-2 touch-spacing" aria-label="Principal">
              <ul className="flex flex-col">
                {NAVIGATION.map((item, index) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group/mobile-nav touch-target touch-feedback flex items-center gap-4 px-6 py-4 text-base font-medium hover:bg-white/5 ${pathname === item.href
                        ? "text-emerald-400 bg-emerald-500/10 border-l-2 border-emerald-500"
                        : "text-gray-300 hover:text-white border-l-2 border-transparent"
                        }`}
                      style={{
                        opacity: isMobileMenuOpen ? 1 : 0,
                        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-10px)',
                        transition: `opacity 0.3s ease ${index * 0.05}s, transform 0.3s ease ${index * 0.05}s`
                      }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.name}</span>
                      {pathname === item.href && (
                        <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          Actual
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Acciones móviles con padding para safe area */}
            <div className="p-4 border-t border-white/5 space-y-3 safe-bottom">
              <button
                type="button"
                onClick={handleAlertsClick}
                className="w-full touch-target touch-feedback inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 gpu-accelerated"
                aria-label="Ver notificaciones"
                style={{
                  transition: 'transform 0.1s ease-out, background 0.2s ease'
                }}
              >
                <BellIcon className="w-5 h-5" aria-hidden="true" />
                <span>Ver Alertas</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
              </button>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleProClick}
                  className="flex-1 touch-target touch-feedback inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400/15 to-orange-400/20 text-amber-200 px-4 py-3 rounded-xl font-semibold text-sm border border-amber-400/30 gpu-accelerated"
                  aria-label="Actualizar a Pro"
                  style={{
                    transition: 'transform 0.1s ease-out, background 0.2s ease'
                  }}
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
