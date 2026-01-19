"use client";

import Link from "next/link";
import { memo } from "react";
import SearchLazy from "./SearchLazy";
import { LangFlag } from "./LangFlag";

// Tipos para las props del componente
interface MatchHeaderProps {
  matchName: string;
  lang: string;
  langs: { code: string; label: string }[];
  onLangChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Componente de cabecera del partido memoizado para optimizar el rendimiento
const MatchHeader = ({ matchName, lang, langs, onLangChange, showNotification }: MatchHeaderProps) => {
  // Manejador para el botón de compartir
  const handleShare = () => {
    const shareData = {
      title: matchName,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => showNotification('¡Enlace compartido exitosamente!', 'success'))
        .catch(() => {
          // Fallback a copiar al portapapeles si el usuario cancela el diálogo de compartir
          navigator.clipboard.writeText(window.location.href)
            .then(() => showNotification('Enlace copiado al portapapeles', 'success'));
        });
    } else {
      // Fallback para navegadores que no soportan la Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => showNotification('Enlace copiado al portapapeles', 'success'));
    }
  };

  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4 lg:gap-6">
      {/* Navegación y título */}
      <div className="flex items-center gap-4 min-w-0">
        <Link
          href="/esports"
          className="group inline-flex items-center gap-2 text-[var(--accent,#00FF80)] hover:text-green-400 text-sm font-semibold transition-all duration-300 hover:scale-105 flex-shrink-0"
          aria-label="Volver a la lista de partidos"
        >
          <div className="p-2 rounded-full bg-gray-800/80 group-hover:bg-gray-700 transition-all duration-300 backdrop-blur-sm border border-gray-700 group-hover:border-gray-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <span className="hidden sm:inline">Volver a partidos</span>
        </Link>
      </div>

      {/* Barra de búsqueda centrada */}
      <div className="flex-1 w-full lg:max-w-2xl lg:mx-6">
        <SearchLazy />
      </div>

      {/* Controles del lado derecho */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Botón de compartir mejorado */}
        <button
          onClick={handleShare}
          aria-label="Compartir partido"
          className="group flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600 hover:border-gray-500 transition-all duration-300 text-xs font-semibold backdrop-blur-sm hover:shadow-lg hover:shadow-gray-900/20"
          title="Compartir por enlace"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform duration-300">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16,6 12,2 8,6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          <span className="hidden sm:inline">Compartir</span>
        </button>

        {/* Selector de idioma mejorado */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-800/80 border border-gray-600 hover:border-gray-500 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-900/20 group">
          <select
            value={lang}
            onChange={onLangChange}
            aria-label="Seleccionar idioma"
            className="bg-transparent text-gray-300 text-xs font-semibold focus:outline-none cursor-pointer group-hover:text-white transition-colors duration-300"
          >
            {langs.map(l => (
              <option key={l.code} value={l.code} className="bg-gray-800 text-gray-300">
                {l.label}
              </option>
            ))}
          </select>
          <div className="group-hover:scale-110 transition-transform duration-300">
            <LangFlag code={lang} />
          </div>
        </div>
      </div>
    </header>
  );
};

// Se utiliza memo para evitar re-renderizados innecesarios si las props no cambian
export default memo(MatchHeader);
