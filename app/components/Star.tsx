"use client";

import { memo } from 'react';

// Props para el componente Star
interface StarProps {
  filled: boolean;
  onClick?: () => void;
  [key: string]: any; // Permite pasar otros props como `aria-label`, etc.
}

// Icono de favorito (estrella) reutilizable con tooltip y animación mejorada
const Star = ({ filled, onClick, ...props }: StarProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div className="relative group" title={filled ? "Quitar de favoritos" : "Añadir a favoritos"}>
      <div
        className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"
        aria-hidden="true"
      />
      <div
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={filled}
        aria-label={filled ? "Quitar de favoritos" : "Añadir a favoritos"}
        className="relative block p-2 rounded-full hover:bg-yellow-500/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
        {...props}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill={filled ? "#FFD700" : "none"}
          stroke="#FFD700"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-all duration-300 transform hover:scale-110 active:scale-95 ${filled ? 'filter drop-shadow-lg' : 'hover:fill-yellow-400/50'}`}
          aria-hidden="true"
        >
          <polygon points="12,2 15.11,8.83 22.22,9.27 17,14.02 18.54,21.02 12,17.27 5.46,21.02 7,14.02 1.78,9.27 8.89,8.83" />
        </svg>
      </div>
    </div>
  );
};

export default memo(Star);
