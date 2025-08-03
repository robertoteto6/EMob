"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LiveMatch {
  id: number;
  team1: string;
  team2: string;
  team1_score: number | null;
  team2_score: number | null;
  league: string;
  game: string;
  start_time?: number;
}

interface LiveScoreTickerProps {
  currentGame: string;
}

const GAME_ICONS: Record<string, string> = {
  dota2: "/dota2.svg",
  lol: "/leagueoflegends.svg",
  csgo: "/counterstrike.svg",
  r6siege: "/rainbow6siege.svg",
  overwatch: "/overwatch.svg",
};

const GAME_COLORS: Record<string, string> = {
  dota2: "from-purple-500/80 to-purple-600/80",
  lol: "from-blue-500/80 to-blue-600/80", 
  csgo: "from-yellow-500/80 to-yellow-600/80",
  r6siege: "from-orange-500/80 to-orange-600/80",
  overwatch: "from-orange-400/80 to-orange-500/80",
};

export default function LiveScoreTicker({ currentGame }: LiveScoreTickerProps) {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    async function fetchLiveMatches() {
      try {
        const games = currentGame === "all" ? ["dota2", "lol", "csgo", "r6siege", "overwatch"] : [currentGame];
        const allMatches: LiveMatch[] = [];

        for (const game of games) {
          try {
            const res = await fetch(`/api/esports/matches?game=${game}`, {
              cache: "no-store",
            });
            if (res.ok) {
              const data = await res.json();
              const now = Date.now() / 1000;
              const live = data
                .filter((m: any) => {
                  const dateStr = m.begin_at ?? m.scheduled_at;
                  const startTime = dateStr ? new Date(dateStr).getTime() / 1000 : null;
                  return startTime && startTime <= now && !m.winner && m.status !== "finished";
                })
                .map((m: any) => {
                  const dateStr = m.begin_at ?? m.scheduled_at;
                  return {
                    id: m.id,
                    team1: m.opponents?.[0]?.opponent?.name ?? "TBD",
                    team2: m.opponents?.[1]?.opponent?.name ?? "TBD",
                    team1_score: m.results?.[0]?.score ?? null,
                    team2_score: m.results?.[1]?.score ?? null,
                    league: m.league?.name ?? "",
                    game,
                    start_time: dateStr ? new Date(dateStr).getTime() / 1000 : undefined,
                  };
                })
                .slice(0, 5); // Reducir a 5 partidos máximo para menos carga visual

              allMatches.push(...live);
            } else {
              console.warn(`Error fetching matches for ${game}: ${res.status} ${res.statusText}`);
            }
          } catch (gameError) {
            console.error(`Error fetching matches for ${game}:`, gameError);
            // Continuar con el siguiente juego en caso de error
          }
        }
        
        // Ordenar por tiempo de inicio (más recientes primero)
        allMatches.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));
        setLiveMatches(allMatches);
      } catch (error) {
        console.error("Error fetching live matches:", error);
      }
    }

    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 45000); // Actualizar cada 45s en lugar de 30s
    return () => clearInterval(interval);
  }, [currentGame]);

  // Auto minimizar después de 8 segundos
  useEffect(() => {
    if (liveMatches.length > 0 && !isExpanded) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [liveMatches.length, isExpanded]);

  if (!isVisible) return null;

  if (liveMatches.length === 0) {
    return null; // No mostrar banner si no hay partidos en vivo
  }

  // Modo minimizado: solo un pequeño indicador
  if (isMinimized && !isExpanded) {
    return (
      <div className="fixed top-16 right-4 z-40 animate-slide-in-right">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-green-600/90 to-green-700/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 border border-green-500/30"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{liveMatches.length} en vivo</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-md border-b border-gray-600/20 shadow-sm animate-slide-down">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-sm">
                {liveMatches.length} En Vivo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-300 hover:text-white transition-colors text-xs bg-gray-700/50 hover:bg-gray-600/50 px-3 py-1 rounded-full flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Contraer
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Ver más
                  </>
                )}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white transition-colors text-xs bg-gray-700/50 hover:bg-gray-600/50 px-2 py-1 rounded-full"
                title="Minimizar"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors text-sm font-bold hover:bg-gray-700/50 rounded-full w-6 h-6 flex items-center justify-center"
            aria-label="Cerrar ticker"
          >
            ×
          </button>
        </div>

        {/* Ticker en modo normal - más compacto */}
        {!isExpanded && (
          <div className="overflow-hidden pb-2">
            <div className="animate-marquee flex gap-6 whitespace-nowrap">
              {liveMatches.map((match, index) => (
                <Link
                  key={`${match.id}-${index}`}
                  href={`/esports/${match.id}`}
                  className="flex-shrink-0 text-white hover:text-green-200 transition-all duration-300 hover:scale-105 group"
                >
                  <div className="flex items-center gap-2 bg-gray-800/30 hover:bg-gray-700/40 px-3 py-1.5 rounded-lg border border-gray-600/20 group-hover:border-green-500/30 transition-all duration-300">
                    <img 
                      src={GAME_ICONS[match.game]} 
                      alt={match.game} 
                      className="w-4 h-4 opacity-70 group-hover:opacity-100"
                    />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-200">{match.team1}</span>
                      <span className="text-green-400 font-semibold text-xs">
                        {match.team1_score !== null && match.team2_score !== null
                          ? `${match.team1_score}-${match.team2_score}`
                          : "vs"}
                      </span>
                      <span className="font-medium text-gray-200">{match.team2}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-1">• {match.league}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Vista expandida - diseño mejorado */}
        {isExpanded && (
          <div className="pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveMatches.map((match, index) => (
                <Link
                  key={`expanded-${match.id}-${index}`}
                  href={`/esports/${match.id}`}
                  className="block group"
                >
                  <div className={`bg-gradient-to-r ${GAME_COLORS[match.game]} p-3 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-white/10 group-hover:border-white/20`}>
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src={GAME_ICONS[match.game]} 
                        alt={match.game} 
                        className="w-5 h-5"
                      />
                      <span className="text-xs text-white/90 font-medium truncate flex-1">
                        {match.league}
                      </span>
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        LIVE
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-white">
                      <div className="text-center flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1 truncate" title={match.team1}>{match.team1}</p>
                        {match.team1_score !== null && (
                          <p className="text-xl font-bold text-green-200">{match.team1_score}</p>
                        )}
                      </div>
                      
                      <div className="text-center px-2">
                        <span className="text-white/80 font-bold text-sm">VS</span>
                      </div>
                      
                      <div className="text-center flex-1 min-w-0">
                        <p className="font-semibold text-sm mb-1 truncate" title={match.team2}>{match.team2}</p>
                        {match.team2_score !== null && (
                          <p className="text-xl font-bold text-green-200">{match.team2_score}</p>
                        )}
                      </div>
                    </div>

                    {/* Duración del partido */}
                    {match.start_time && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-white/70 bg-black/20 px-2 py-1 rounded-full">
                          {(() => {
                            const duration = Math.floor((Date.now() / 1000) - match.start_time);
                            const minutes = Math.floor(duration / 60);
                            return `${minutes} min`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
