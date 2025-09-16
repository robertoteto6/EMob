"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Search from "./Search";
import ThemeToggle from "./ThemeToggle";

function HeaderContent() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  // Ocultar header en páginas de detalles de esports que tienen su propio header local
  const shouldHideHeader = pathname?.includes('/esports/') && pathname?.split('/').length > 2;

  useEffect(() => {
    setIsClient(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Establecer el estado inicial del scroll
    handleScroll();
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Partidos", href: "/esports" },
    { name: "Equipos", href: "/equipos" },
    { name: "Jugadores", href: "/jugadores" },
  ];

  // Early return for esports detail pages
  if (shouldHideHeader) {
    return null;
  }

  return (
    <header
      className={`group fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isClient && isScrolled
          ? "bg-black/80 backdrop-blur-xl shadow-[0_12px_40px_-20px_rgba(0,0,0,0.6)]"
          : "bg-transparent"
      }`}
      role="banner"
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-sky-500/5 to-purple-500/5" aria-hidden="true" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group/logo" aria-label="EMob inicio">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center font-black text-black group-hover/logo:scale-105 transition-transform duration-300 shadow-lg shadow-emerald-500/30">
              E
              </div>
              <span className="absolute inset-0 rounded-xl border border-white/20 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300" aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              EMob
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-300 rounded-full ${
                  pathname === item.href
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {item.name}
                {pathname === item.href && (
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-purple-500 opacity-20"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:block w-80">
            <Search globalSearch={true} placeholder="Buscar en todos los juegos..." />
          </div>

          {/* CTA Button + Theme */}
          <div className="hidden md:flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/30"
              aria-label="Ver notificaciones"
            >
              <BellIcon className="w-5 h-5" aria-hidden="true" />
              <span>Alertas</span>
            </button>
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-white/10 bg-white/5 text-white backdrop-blur-xl transition-colors duration-300"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-xl border-b border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
            <div className="p-4">
              <Search globalSearch={true} compact={true} placeholder="Buscar en todos los juegos..." />
            </div>
            <nav className="flex flex-col py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-300 hover:text-emerald-400 hover:bg-white/5 ${
                    pathname === item.href
                      ? "text-emerald-400 bg-white/5"
                      : "text-gray-300"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-6 py-3 flex items-center gap-3">
                <button
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30"
                  aria-label="Ver notificaciones"
                >
                  <BellIcon className="w-5 h-5" aria-hidden="true" />
                  Alertas
                </button>
                <ThemeToggle className="flex-0" />
              </div>
            </nav>
          </div>
        )}
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
