"use client";

import { memo, useMemo } from "react";

// Props para el componente LangFlag
interface LangFlagProps {
  code: string;
}

// Datos de las banderas para evitar re-crearlos en cada render
const flagData = {
  "es-ES": { src: "/file.svg", alt: "Español", emoji: "🇪🇸" },
  "en-US": { src: "/globe.svg", alt: "English", emoji: "🇺🇸" },
  "es": { src: "/file.svg", alt: "Español", emoji: "🇪🇸" },
  "en": { src: "/globe.svg", alt: "English", emoji: "🇺🇸" },
  "fr": { src: "/globe.svg", alt: "Français", emoji: "🇫🇷" },
  "de": { src: "/globe.svg", alt: "Deutsch", emoji: "🇩🇪" },
  "pt": { src: "/globe.svg", alt: "Português", emoji: "🇵🇹" },
  "ru": { src: "/globe.svg", alt: "Русский", emoji: "🇷🇺" },
  "zh": { src: "/globe.svg", alt: "中文", emoji: "🇨🇳" },
  "ja": { src: "/globe.svg", alt: "日本語", emoji: "🇯🇵" },
  "ko": { src: "/globe.svg", alt: "한국어", emoji: "🇰🇷" },
  default: { src: "/globe.svg", alt: "Idioma desconocido", emoji: "🌍" }
};

// Componente para mostrar banderas de idioma con un diseño mejorado y optimizado
export const LangFlag = memo(({ code }: LangFlagProps) => {
  const flag = useMemo(() => {
    // Se verifica si el código es válido, si no, se usa el por defecto
    if (!code || typeof code !== 'string') {
      return { ...flagData.default, alt: "Código inválido" };
    }
    return flagData[code as keyof typeof flagData] || { ...flagData.default, alt: `Idioma: ${code}` };
  }, [code]);

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors group" title={flag.alt}>
      <span className="text-lg group-hover:scale-110 transition-transform duration-200" aria-hidden="true">{flag.emoji}</span>
      <img
        src={flag.src}
        alt={flag.alt}
        className="w-4 h-4 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity duration-200"
        loading="lazy"
        width="16"
        height="16"
      />
      <span className="sr-only">{flag.alt}</span>
    </div>
  );
});

LangFlag.displayName = 'LangFlag';
