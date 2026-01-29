"use client";

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '../lib/utils';

interface GameIconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Componente GameIcon - Renderiza iconos de juegos con manejo de errores
 * 
 * Características:
 * - Fallback automático si el icono no carga
 * - Tamaño configurable
 * - Optimizado para SVG de juegos
 * - Consistente con el diseño visual de EMob
 */
export default function GameIcon({
  src,
  alt,
  size = 36,
  className,
  priority = false,
}: GameIconProps) {
  const [hasError, setHasError] = useState(false);

  // Fallback: Mostrar iniciales del juego si falla la carga
  if (hasError) {
    const initials = alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg text-white font-bold',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setHasError(true)}
        priority={priority}
      />
    </div>
  );
}

/**
 * Versión simplificada para uso en listas y menús
 */
export function GameIconSmall({ gameId, className }: { gameId: string; className?: string }) {
  // Mapeo de IDs a iniciales para fallback
  const gameInitials: Record<string, string> = {
    dota2: 'D2',
    lol: 'LoL',
    csgo: 'CS',
    r6siege: 'R6',
    overwatch: 'OW',
    valorant: 'VAL',
    fortnite: 'FN',
    pubg: 'PUBG',
    apex: 'APEX',
    cod: 'COD',
    rl: 'RL',
    sf: 'SF',
    ssb: 'SSB',
    sc2: 'SC2',
    kog: 'KOG',
    wr: 'WR',
    wow: 'WoW',
  };

  const initials = gameInitials[gameId] || gameId.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg text-white text-xs font-bold',
        className
      )}
      title={gameId}
    >
      {initials}
    </div>
  );
}
