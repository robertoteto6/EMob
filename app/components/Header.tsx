"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Search from "./Search";
import ThemeToggle from "./ThemeToggle";

function HeaderContent() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  // Ocultar header en páginas de detalles de esports que tienen su propio header local
  const shouldHideHeader = pathname?.includes('/esports/') && pathname?.split('/').length > 2;  useEffect(() => {
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isClient && isScrolled
          ? "bg-black/95 backdrop-blur-md shadow-lg border-b border-green-500/20"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center font-bold text-black group-hover:scale-110 transition-transform duration-300">
              E
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              EMob
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative py-2 px-1 text-sm font-medium transition-colors duration-300 hover:text-green-400 ${
                  pathname === item.href 
                    ? "text-green-400" 
                    : "text-gray-300"
                }`}
              >
                {item.name}
                {pathname === item.href && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:block w-80">
            <Search globalSearch={true} placeholder="Buscar en todos los juegos..." />
          </div>

          {/* CTA Button + Theme */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              aria-label="Ver notificaciones"
            >
              🔔 Notificaciones
            </button>
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-300"
            aria-label="Toggle mobile menu"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-green-500/20 shadow-lg">
            <div className="p-4">
              <Search globalSearch={true} compact={true} placeholder="Buscar en todos los juegos..." />
            </div>
            <nav className="flex flex-col py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-300 hover:text-green-400 hover:bg-gray-800/50 ${
                    pathname === item.href 
                      ? "text-green-400 bg-gray-800/30" 
                      : "text-gray-300"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-6 py-3 flex items-center gap-3">
                <button 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg"
                  aria-label="Ver notificaciones"
                >
                  🔔 Notificaciones
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
