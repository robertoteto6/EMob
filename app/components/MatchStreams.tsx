"use client";

import { memo, useMemo } from 'react';
import { LangFlag } from './LangFlag'; // Asegúrate de que la ruta sea correcta

// Interfaz para la información de un stream
interface StreamInfo {
  embed_url: string | null;
  raw_url: string;
  language: string;
}

// Props para el componente MatchStreams
interface MatchStreamsProps {
  streams: StreamInfo[];
}

// Componente para el stream embebido de Twitch
const TwitchStreamEmbed = ({ stream }: { stream: StreamInfo }) => (
  <div className="relative group mb-8">
    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" aria-hidden="true" />
    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-2xl backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 flex items-center gap-3">
        <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>
        Stream en vivo - Twitch
      </h2>
      <div className="aspect-video rounded-xl overflow-hidden bg-gray-800 border border-gray-600">
        <iframe
          src={stream.embed_url!}
          width="100%"
          height="100%"
          allowFullScreen
          className="w-full h-full"
          title="Stream de Twitch"
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-sm text-gray-400">En vivo</span></div>
        <a href={stream.raw_url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
          Ver en Twitch <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
        </a>
      </div>
    </div>
  </div>
);

// Componente para la lista de otros streams disponibles
const OtherStreamsList = ({ streams }: { streams: StreamInfo[] }) => (
  <div className="relative group mb-8">
    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" aria-hidden="true" />
    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-6 flex items-center gap-3">
        <div className="p-2 rounded-full bg-gradient-to-r from-red-600 to-pink-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>
        Otros streams disponibles
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {streams.map((s, idx) => (
          <a
            key={idx}
            href={s.raw_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 hover:border-[var(--accent,#00FF80)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent,#00FF80)]/20"
            title={`Ver stream en ${(s.language || 'idioma desconocido').toUpperCase()}`}
          >
            <LangFlag code={s.language} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white group-hover:text-[var(--accent,#00FF80)] transition-colors">{(s.language || 'desconocido').toUpperCase()} Stream</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-[var(--accent,#00FF80)] transition-colors"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
              </div>
              <p className="text-xs text-gray-400 mt-1">{s.raw_url.includes('twitch.tv') ? 'Twitch' : 'Stream externo'}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </a>
        ))}
      </div>
    </div>
  </div>
);

// Componente principal para mostrar los streams de un partido
const MatchStreams = ({ streams }: MatchStreamsProps) => {
  const twitchStream = useMemo(() =>
    streams.find(s => s.embed_url && s.embed_url.includes('twitch.tv')),
    [streams]
  );

  const otherStreams = useMemo(() =>
    streams.filter(s => s.raw_url && s.raw_url.trim() !== '' && s.embed_url !== twitchStream?.embed_url),
    [streams, twitchStream]
  );

  if (!twitchStream && otherStreams.length === 0) {
    return null; // No renderizar nada si no hay streams
  }

  return (
    <>
      {twitchStream && <TwitchStreamEmbed stream={twitchStream} />}
      {otherStreams.length > 0 && <OtherStreamsList streams={otherStreams} />}
    </>
  );
};

export default memo(MatchStreams);
