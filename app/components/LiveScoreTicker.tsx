"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiCache } from "../lib/utils";
import { useGameContext } from "../contexts/GameContext";
import { getGameConfig } from "../lib/gameConfig";

interface PandaScoreMatch {
  id: number;
  begin_at: string | null;
  scheduled_at: string | null;
  winner: any;
  status: string;
  opponents?: Array<{
    opponent: {
      name: string;
    };
  }>;
  results?: Array<{
    score: number;
  }>;
  league?: {
    name: string;
  };
}

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

const FALLBACK_GAME_VISUALS = {
  icon: "/file.svg",
  gradient: "from-slate-700 to-slate-800",
  name: "Esports",
};

function getGameVisuals(gameId: string) {
  const config = getGameConfig(gameId);
  return {
    icon: config?.icon ?? FALLBACK_GAME_VISUALS.icon,
    gradient: config?.gradient ?? FALLBACK_GAME_VISUALS.gradient,
    name: config?.name ?? FALLBACK_GAME_VISUALS.name,
  };
}

const LiveScoreTicker = memo(function LiveScoreTicker({ currentGame }: LiveScoreTickerProps) {
  const { selectedGames, hasAnyGame } = useGameContext();
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Función optimizada para obtener partidos en vivo
  const fetchLiveMatches = useCallback(async () => {
    // Determinar juegos a buscar: priorizar currentGame si es "all" o múltiples, sino usar selectedGames
    let gamesToFetch: string[];
    if (currentGame && currentGame !== "all") {
      // Si currentGame es una lista separada por comas, usarla
      gamesToFetch = currentGame.includes(',') ? currentGame.split(',') : [currentGame];
    } else if (hasAnyGame) {
      gamesToFetch = selectedGames;
    } else {
      // Fallback a todos los juegos si no hay selección
      gamesToFetch = ["dota2", "lol", "csgo", "r6siege", "overwatch"];
    }

    if (gamesToFetch.length === 0) {
      setLiveMatches([]);
      return;
    }

    const cacheKey = `live-matches-${gamesToFetch.join(',')}`;
    const cached = apiCache.get(cacheKey);

    if (cached) {
      setLiveMatches(cached);
      return;
    }

    setIsLoading(true);
    try {
      const games = gamesToFetch;
      const allMatches: LiveMatch[] = [];

      // Procesar juegos en paralelo para mejor rendimiento
      const promises = games.map(async (game) => {
        try {
          const res = await fetch(`/api/esports/matches?game=${game}`, {
            headers: {
              'Accept': 'application/json',
            },
          });

          if (res.ok) {
            const data = await res.json();
            const now = Date.now() / 1000;
            return data
              .filter((m: PandaScoreMatch) => {
                const dateStr = m.begin_at ?? m.scheduled_at;
                const startTime = dateStr ? new Date(dateStr).getTime() / 1000 : null;
                return startTime && startTime <= now && !m.winner && m.status !== "finished";
              })
              .map((m: PandaScoreMatch) => {
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
              .slice(0, 3); // Reducir a 3 partidos por juego para mejor rendimiento
          }
          return [];
        } catch (gameError) {
          console.error(`Error fetching matches for ${game}:`, gameError);
          return [];
        }
      });

      const results = await Promise.all(promises);
      results.forEach(matches => allMatches.push(...matches));

      // Ordenar por tiempo de inicio y limitar resultados
      allMatches.sort((a, b) => (b.start_time || 0) - (a.start_time || 0));
      const limitedMatches = allMatches.slice(0, 8); // Máximo 8 partidos totales

      setLiveMatches(limitedMatches);
      apiCache.set(cacheKey, limitedMatches);
    } catch (error) {
      console.error("Error fetching live matches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentGame, selectedGames, hasAnyGame]);

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 60000); // Actualizar cada 60s para reducir carga
    return () => clearInterval(interval);
  }, [fetchLiveMatches]);

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

  if (liveMatches.length === 0 && !isLoading) {
    return null; // No mostrar banner si no hay partidos en vivo
  }

  // Modo minimizado: solo un pequeño indicador
  if (isMinimized && !isExpanded) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-40 md:top-[72px] md:bottom-auto animate-slide-in-right">
        <button
          onClick={() => setIsMinimized(false)}
          className="group relative touch-target touch-feedback flex items-center gap-2.5 bg-black/80 backdrop-blur-xl text-white px-4 py-3 md:py-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-green-500/10 transition-all duration-300 hover:scale-105 border border-white/10 hover:border-green-500/30 overflow-hidden w-full md:w-auto justify-center md:justify-start"
        >
          {/* Brillo interno */}
          <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative w-2 h-2 bg-green-500 rounded-full">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
          </div>
          <span className="relative text-xs font-bold tracking-wider uppercase">{liveMatches.length} En Vivo</span>
          <svg className="relative w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:top-[72px] md:bottom-auto md:max-w-7xl md:mx-auto md:px-6 safe-bottom">
      <div className="w-full">
        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-down md:animate-slide-in-left">
          <div className="flex items-center justify-between py-3 px-4 md:py-2 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 bg-green-500/15 px-3 py-1.5 md:py-1 rounded-full border border-green-500/20">
                <div className="relative w-1.5 h-1.5 bg-green-500 rounded-full">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-green-400 font-bold text-[10px] tracking-widest uppercase">
                  {liveMatches.length} <span className="hidden sm:inline">Partidos en directo</span><span className="sm:hidden">En Vivo</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-gray-300 hover:text-white transition-colors text-xs bg-gray-700/50 hover:bg-gray-600/50 px-3 py-1.5 md:py-1 rounded-full flex items-center gap-1 touch-target-sm"
                >
                  {isExpanded ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="hidden sm:inline">Contraer</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="hidden sm:inline">Ver más</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-gray-400 hover:text-white transition-colors text-xs bg-gray-700/50 hover:bg-gray-600/50 px-2.5 py-1.5 md:py-1 rounded-full touch-target-sm"
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
              className="text-gray-400 hover:text-white transition-colors text-sm font-bold hover:bg-gray-700/50 rounded-full w-8 h-8 md:w-6 md:h-6 flex items-center justify-center touch-target-sm"
              aria-label="Cerrar ticker"
            >
              ×
            </button>
          </div>

          {/* Ticker en modo normal - más compacto */}
          {!isExpanded && (
            <div className="overflow-hidden pb-2">
              <div className="animate-marquee flex gap-6 whitespace-nowrap">
                {liveMatches.map((match, index) => {
                  const visuals = getGameVisuals(match.game);
                  return (
                  <Link
                    key={`${match.id}-${index}`}
                    href={`/esports/${match.id}`}
                    className="flex-shrink-0 text-white hover:text-green-200 transition-all duration-300 hover:scale-105 group"
                  >
                    <div className="flex items-center gap-2 bg-gray-800/30 hover:bg-gray-700/40 px-3 py-1.5 rounded-lg border border-gray-600/20 group-hover:border-green-500/30 transition-all duration-300">
                      <Image
                        src={visuals.icon}
                        alt={visuals.name}
                        width={16}
                        height={16}
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
                );
                })}
              </div>
            </div>
          )}

          {/* Vista expandida - diseño mejorado */}
          {isExpanded && (
            <div className="pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {liveMatches.map((match, index) => {
                  const visuals = getGameVisuals(match.game);
                  return (
                  <Link
                    key={`expanded-${match.id}-${index}`}
                    href={`/esports/${match.id}`}
                    className="block group"
                  >
                    <div className={`bg-gradient-to-r ${visuals.gradient} p-3 rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-white/10 group-hover:border-white/20`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Image
                          src={visuals.icon}
                          alt={visuals.name}
                          width={20}
                          height={20}
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default LiveScoreTicker;
