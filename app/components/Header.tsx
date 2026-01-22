"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import SearchLazy from "./SearchLazy";
import ThemeToggle from "./ThemeToggle";
import { optimizeScroll } from "../lib/utils";

function HeaderContent() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isScrolledRef = useRef(false);

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

  const navigation = [
    { name: "Inicio", href: "/" },
    { name: "Partidos", href: "/esports" },
    { name: "Equipos", href: "/equipos" },
    { name: "Jugadores", href: "/jugadores" },
  ];

  return (
    <header
      className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
        isClient && isScrolled
          ? "bg-black/90 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }\`}
      role="banner"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo minimalista */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="EMob inicio">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center font-semibold text-black text-base group-hover:scale-105 transition-transform duration-300">
              E
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white tracking-tight">
                EMob
              </span>
              <span className="text-[9px] font-medium text-white/40 tracking-widest uppercase hidden sm:block">
                Esports
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={\`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg \${
                  pathname === item.href
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }\`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:block w-56 xl:w-64">
            <SearchLazy globalSearch={true} placeholder="Buscar..." />
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="relative inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-white/90"
              aria-label="Ver notificaciones"
            >
              <BellIcon className="w-4 h-4" aria-hidden="true" />
              <span>Alertas</span>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-medium flex items-center justify-center text-white">
                3
              </span>
            </button>
            
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={\`lg:hidden p-2 rounded-lg transition-all duration-200 \${
              isMobileMenuOpen 
                ? "bg-white/10 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/5"
            }\`}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Bars3Icon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={\`lg:hidden absolute top-full left-0 right-0 overflow-hidden transition-all duration-500 ease-out \${
          isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }\`}>
          {/* Backdrop blur mejorado */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" aria-hidden="true" />
          <div className="relative bg-black/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50">
            <div className="p-4 border-b border-white/5">
              <SearchLazy globalSearch={true} compact={true} placeholder="Buscar..." />
            </div>
            
            <nav className="py-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={\`block px-6 py-3 text-sm font-medium transition-colors duration-200 \${
                    pathname === item.href
                      ? "text-white bg-white/5"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }\`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="p-4 border-t border-white/5">
              <button
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg font-medium text-sm"
                aria-label="Ver notificaciones"
              >
                <BellIcon className="w-4 h-4" aria-hidden="true" />
                <span>Ver Alertas</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">3</span>
              </button>
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
