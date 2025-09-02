"use client";

import { useState, memo } from 'react';
import Image from 'next/image';
import Spinner from './Spinner'; // Asegúrate de que la ruta sea correcta

// Props para el componente TeamLogo
interface TeamLogoProps {
  id: number | null;
  name: string;
  size?: number;
}

// Icono de fallback para cuando no hay logo
const FallbackLogo = ({ name, size }: { name: string; size: number }) => (
  <div
    className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-gray-300 border-2 border-gray-500 shadow-lg hover:scale-105 transition-transform duration-300"
    style={{ width: size, height: size }}
    title={name}
  >
    <svg
      width={size * 0.5}
      height={size * 0.5}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-label="Logo de equipo por defecto"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  </div>
);

// Helper para logo de equipo con fallback mejorado y optimizado
const TeamLogo = ({ id, name, size = 48 }: TeamLogoProps) => {
  const [error, setError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Si no hay ID o si ocurre un error, muestra el logo de fallback
  if (!id || error) {
    return <FallbackLogo name={name} size={size} />;
  }

  return (
    <div className="relative group" style={{ width: size, height: size }}>
      {imageLoading && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center animate-pulse"
        >
          <Spinner size={size * 0.4} />
        </div>
      )}
      <Image
        src={`/api/esports/team/${id}/logo`}
        alt={`Logo de ${name}`}
        width={size}
        height={size}
        className={`rounded-full border-2 border-gray-500 group-hover:border-[var(--accent,#00FF80)] bg-white shadow-lg hover:shadow-xl hover:shadow-[var(--accent,#00FF80)]/20 transition-all duration-300 hover:scale-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
        title={name}
        onError={() => setError(true)}
        onLoad={() => setImageLoading(false)}
        unoptimized // Necesario si la fuente de la imagen no está configurada en next.config.js
      />
    </div>
  );
};

export default memo(TeamLogo);
