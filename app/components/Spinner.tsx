"use client";

import { memo } from 'react';

// Props para el componente Spinner
interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  label?: string; // Para un texto sr-only más descriptivo
}

// Componente para mostrar un loading spinner mejorado, con accesibilidad mejorada
const Spinner = ({
  size = 24,
  color = "var(--accent, #00FF80)",
  className = "",
  label = "Cargando contenido..."
}: SpinnerProps) => {
  const spinnerStyle = {
    width: size,
    height: size,
    borderTopColor: color,
    borderRightColor: color,
    filter: `drop-shadow(0 0 4px ${color}33)` // Usar el color para el drop-shadow
  };

  const pingStyle = {
    width: size * 0.3,
    height: size * 0.3,
    backgroundColor: color,
    opacity: 0.4
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} role="status" aria-live="polite">
      <div className="animate-spin rounded-full border-2 border-transparent" style={spinnerStyle} />
      <div className="absolute animate-ping rounded-full" style={pingStyle} />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default memo(Spinner);
