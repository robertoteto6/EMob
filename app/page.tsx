"use client";

import { useEffect, useState, useMemo, useCallback, useRef, memo } from "react";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import LiveScoreTicker from "./components/LiveScoreTicker";
import ScrollToTop from "./components/ScrollToTop";
import Tooltip from "./components/Tooltip";
import Spinner from "./components/Spinner";
import LiveBadge from "./components/LiveBadge";
import { SUPPORTED_GAMES, type GameConfig } from "./lib/gameConfig";
import { useNotifications } from "./hooks/useNotifications";
import { useDeferredClientRender } from "./hooks/useDeferredClientRender";

interface PandaScoreMatch {
  id: number;
  begin_at: string | null;
  scheduled_at: string | null;
  opponents?: Array<{
    opponent: {
      id: number;
      name: string;
    };
  }>;
  results?: Array<{
    score: number;
  }>;
  league?: {
    name: string;
  };
  winner?: {
    id: number;
  };
  status: string;
}

const NotificationSystem = nextDynamic(() => import("./components/NotificationSystem"), {
  ssr: false,
});

const ChatBot = nextDynamic(() => import("./components/ChatBot"), {
  ssr: false,
  loading: () => null,
});

const TIME_UPDATE_INTERVAL = 15_000;
const MATCH_REFRESH_INTERVAL = 30_000;
const TOURNAMENT_REFRESH_INTERVAL = 60_000;
const TOURNAMENT_REFRESH_STEPS = Math.max(1, Math.round(TOURNAMENT_REFRESH_INTERVAL / MATCH_REFRESH_INTERVAL));

// Custom hook to handle time consistently between server and client
function useCurrentTime(updateInterval = TIME_UPDATE_INTERVAL) {
  const [currentTime, setCurrentTime] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsClient(true);

    const syncTime = () => {
      const now = Math.floor(Date.now() / 1000);
      setCurrentTime((prev) => (prev === now ? prev : now));
    };

    syncTime();

    if (updateInterval <= 0) {
      return;
    }

    const interval = window.setInterval(syncTime, updateInterval);
    return () => window.clearInterval(interval);
  }, [updateInterval]);

  return { currentTime, isClient };
}

// Interfaces
interface Match {
  id: number;
  radiant: string;
  dire: string;
  radiant_score: number | null;
  dire_score: number | null;
  start_time: number;
  league: string;
  radiant_win: boolean | null;
  game: string;
}

interface Tournament {
  id: number;
  name: string;
  begin_at: number | null;
  end_at: number | null;
  league: string;
  serie: string;
  prizepool: string | null;
  tier: string | null;
  region: string | null;
  live_supported: boolean;
  game: string;
}

interface GameStats {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  activeTournaments: number;
}

const GAMES = SUPPORTED_GAMES;

// Función para obtener partidos de múltiples juegos
async function fetchAllMatches(): Promise<Match[]> {
  const allMatches: Match[] = [];
  
  // Usar consultas en lote para mejor rendimiento
  const batchConfigs = GAMES.map(game => ({
    endpoint: `/api/esports/matches`,
    params: { game: game.id, per_page: 30 },
    cacheTTL: 2 * 60 * 1000, // 2 minutos
    priority: 'high' as const,
  }));
  
  try {
    const { batchQuery } = await import('./lib/queryOptimizer');
    const results = await batchQuery(batchConfigs);
    
    for (let i = 0; i < GAMES.length; i++) {
      const game = GAMES[i];
      const result = results[i];
      
      if (result.error) {
        console.warn(`Failed to fetch matches for ${game.id}:`, result.error);
        continue;
      }
      
      const data = result.data;
      
      // Validar que data es un array
      if (!Array.isArray(data)) {
        console.warn(`Invalid data format for ${game.id}:`, data);
        continue;
      }
      
      const gameMatches = data
        .map((m: PandaScoreMatch) => {
          // Validar datos requeridos
          if (!m || typeof m.id !== 'number') {
            return null;
          }
          
          const team1 = m.opponents?.[0]?.opponent;
          const team2 = m.opponents?.[1]?.opponent;
          const dateStr = m.begin_at ?? m.scheduled_at;
          const date = dateStr ? new Date(dateStr) : null;
          const start_time = date && !isNaN(date.getTime()) ? date.getTime() / 1000 : null;
          
          // Validar que tenemos un tiempo válido
          if (start_time === null) {
            return null;
          }
          
          const radiant_score = Array.isArray(m.results) && m.results[0]?.score != null ? Number(m.results[0].score) : null;
          const dire_score = Array.isArray(m.results) && m.results[1]?.score != null ? Number(m.results[1].score) : null;
          
          return {
            id: m.id,
            radiant: team1?.name ?? "TBD",
            dire: team2?.name ?? "TBD",
            radiant_score,
            dire_score,
            start_time,
            league: m.league?.name ?? "",
            radiant_win: m.winner?.id !== undefined && team1?.id !== undefined ? m.winner.id === team1.id : null,
            game: game.id,
          } as Match;
        })
        .filter((m: Match | null): m is Match => m !== null);
        
      allMatches.push(...gameMatches);
    }
  } catch (error) {
    console.error('Error fetching matches:', error);
  }
  
  // Sort once before returning to avoid allocating a new array unnecessarily
  allMatches.sort((a, b) => a.start_time - b.start_time);
  return allMatches;
}

// Función para obtener torneos de múltiples juegos
async function fetchAllTournaments(): Promise<Tournament[]> {
  const allTournaments: Tournament[] = [];
  
  // Usar consultas en lote optimizadas
  const batchConfigs = GAMES.map(game => ({
    endpoint: `/api/esports/tournaments`,
    params: { game: game.id, per_page: 20 },
    cacheTTL: 5 * 60 * 1000, // 5 minutos (los torneos cambian menos frecuentemente)
    priority: 'medium' as const,
  }));
  
  try {
    const { batchQuery } = await import('./lib/queryOptimizer');
    const results = await batchQuery(batchConfigs);
    
    for (let i = 0; i < GAMES.length; i++) {
      const game = GAMES[i];
      const result = results[i];
      
      if (result.error) {
        console.warn(`Failed to fetch tournaments for ${game.id}:`, result.error);
        continue;
      }
      
      const data = result.data;
      
      // Validar que data es un array
      if (!Array.isArray(data)) {
        console.warn(`Invalid tournament data format for ${game.id}:`, data);
        continue;
      }
      
      const gameTournaments = data
        .map((t: any) => {
          // Validar datos requeridos
          if (!t || typeof t.id !== 'number') {
            return null;
          }
          
          const beginAt = t.begin_at ? new Date(t.begin_at) : null;
          const endAt = t.end_at ? new Date(t.end_at) : null;
          
          return {
            id: t.id,
            name: t.name ?? "",
            begin_at: beginAt && !isNaN(beginAt.getTime()) ? beginAt.getTime() / 1000 : null,
            end_at: endAt && !isNaN(endAt.getTime()) ? endAt.getTime() / 1000 : null,
            league: t.league?.name ?? "",
            serie: t.serie?.full_name ?? "",
            prizepool: t.prizepool ?? null,
            tier: t.tier ?? null,
            region: t.region ?? null,
            live_supported: !!t.live_supported,
            game: game.id,
          } as Tournament;
        })
        .filter((t: Tournament | null): t is Tournament => t !== null);
      
      allTournaments.push(...gameTournaments);
    }
  } catch (error) {
    console.error('Error fetching tournaments:', error);
  }
  
  return allTournaments;
}

// Componente de estadísticas del juego (memoizado) - Diseño Premium
const GameStatsCard = memo(function GameStatsCard({ game, stats }: { game: GameConfig, stats: GameStats }) {
  return (
    <Link href={`/esports/game/${game.id}`} className="group block h-full">
      <div className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} p-1 shadow-xl transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl`}>
        {/* Marco con gradiente */}
        <div className="relative h-full overflow-hidden rounded-xl bg-black/80 backdrop-blur-sm">
          {/* Patrón de fondo sutil */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }} />
          </div>
          
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" aria-hidden="true" />
          
          {/* Icono flotante decorativo */}
          <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity duration-500" aria-hidden="true">
            <Image src={game.icon} alt="" width={64} height={64} className="w-14 h-14 group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          {/* Badge "Explorar" en hover */}
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] font-bold flex items-center gap-1.5 text-white/90">
              <span>👆</span>
              <span>Explorar</span>
            </div>
          </div>
          
          <div className="relative z-10 p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="absolute -inset-1 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                <Image src={game.icon} alt={`Icono de ${game.name}`} width={36} height={36} className="relative w-9 h-9 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-white transition-colors duration-300 leading-tight">
                  {game.name}
                </h3>
                <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Live Stats</p>
              </div>
            </div>
            
            {/* Estadísticas en grid 2x2 */}
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              <Tooltip content={`Total de partidas registradas para ${game.name}`} className="block">
                <div className="bg-white/5 rounded-xl p-3 group-hover:bg-white/10 transition-colors duration-300 border border-white/5 group-hover:border-white/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                    <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">Total</p>
                  </div>
                  <p className="text-2xl font-black text-white tabular-nums">
                    {stats.totalMatches}
                  </p>
                </div>
              </Tooltip>
              
              <Tooltip content={`Partidas en curso de ${game.name}`} className="block">
                <div className="bg-red-500/10 rounded-xl p-3 group-hover:bg-red-500/20 transition-colors duration-300 border border-red-500/20 group-hover:border-red-500/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    <p className="text-[10px] font-semibold text-red-300/80 uppercase tracking-wide">En Vivo</p>
                  </div>
                  <p className="text-2xl font-black text-red-300 tabular-nums">
                    {stats.liveMatches}
                  </p>
                </div>
              </Tooltip>
              
              <Tooltip content={`Partidas programadas de ${game.name}`} className="block">
                <div className="bg-blue-500/10 rounded-xl p-3 group-hover:bg-blue-500/20 transition-colors duration-300 border border-blue-500/20 group-hover:border-blue-500/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <p className="text-[10px] font-semibold text-blue-300/80 uppercase tracking-wide">Próximos</p>
                  </div>
                  <p className="text-2xl font-black text-blue-300 tabular-nums">
                    {stats.upcomingMatches}
                  </p>
                </div>
              </Tooltip>
              
              <Tooltip content={`Torneos activos de ${game.name}`} className="block">
                <div className="bg-yellow-500/10 rounded-xl p-3 group-hover:bg-yellow-500/20 transition-colors duration-300 border border-yellow-500/20 group-hover:border-yellow-500/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    <p className="text-[10px] font-semibold text-yellow-300/80 uppercase tracking-wide">Torneos</p>
                  </div>
                  <p className="text-2xl font-black text-yellow-300 tabular-nums">
                    {stats.activeTournaments}
                  </p>
                </div>
              </Tooltip>
            </div>

            {/* Footer con indicador de actualización */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">Actualizado</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-400">Ahora</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

// Componente de partido destacado (memoizado)
const FeaturedMatch = memo(function FeaturedMatch({ match, currentTime }: { match: Match; currentTime: number }) {
  const game = GAMES.find(g => g.id === match.game);
  const isLive = match.start_time <= currentTime && match.radiant_win === null;
  const isUpcoming = match.start_time > currentTime;
  const isFinished = match.radiant_win !== null;
  
  return (
    <Link href={`/esports/${match.id}`}>
      <div
        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
          isLive ? "ring-2 ring-red-500/40 shadow-[0_0_35px_rgba(239,68,68,0.45)]" : ""
        }`}
      >
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Indicador de estado */}
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 animate-pulse"></div>
          </div>
        )}
        
        {/* Header del partido */}
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {game && (
                <div className="relative">
                  <Image
                    src={game.icon}
                    alt={`Icono de ${game.name}`}
                    width={32}
                    height={32}
                    className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-green-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-300">{match.league}</span>
                {game && (
                  <p className="text-xs text-gray-500">{game.name}</p>
                )}
              </div>
            </div>
            
            {/* Estado del partido */}
            {isLive && (
              <LiveBadge className="pointer-events-none" />
            )}
            
            {isUpcoming && (
              <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                PRÓXIMO
              </span>
            )}

            {isFinished && (
              <span className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                FINALIZADO
              </span>
            )}
          </div>
          
          {/* Equipos y marcador */}
          <div className="flex items-center justify-between mb-6">
            {/* Equipo 1 */}
            <div className="text-center flex-1 group/team">
              <div className="bg-gray-800/50 rounded-xl p-4 group-hover/team:bg-gray-700/50 transition-colors duration-300">
                <p className="font-bold text-lg text-white mb-2 group-hover/team:text-green-400 transition-colors duration-300">
                  {match.radiant}
                </p>
                {typeof match.radiant_score === "number" ? (
                  <p className="text-4xl font-bold text-green-400 group-hover/team:scale-110 transition-transform duration-300">
                    {match.radiant_score}
                  </p>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <div className="w-8 h-8 bg-gray-700 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-xs font-bold">?</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* VS y tiempo */}
            <div className="text-center px-6">
              <div className="relative">
                <span className="text-gray-400 font-bold text-xl group-hover:text-white transition-colors duration-300">
                  VS
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              {typeof match.radiant_score !== "number" && (
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {new Date(match.start_time * 1000).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              )}
            </div>
            
            {/* Equipo 2 */}
            <div className="text-center flex-1 group/team">
              <div className="bg-gray-800/50 rounded-xl p-4 group-hover/team:bg-gray-700/50 transition-colors duration-300">
                <p className="font-bold text-lg text-white mb-2 group-hover/team:text-green-400 transition-colors duration-300">
                  {match.dire}
                </p>
                {typeof match.dire_score === "number" ? (
                  <p className="text-4xl font-bold text-green-400 group-hover/team:scale-110 transition-transform duration-300">
                    {match.dire_score}
                  </p>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <div className="w-8 h-8 bg-gray-700 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-xs font-bold">?</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer con fecha y acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="text-left">
              <p className="text-sm text-gray-400 font-medium">
                {new Date(match.start_time * 1000).toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
              </p>
              {isLive && (
                <p className="text-xs text-red-400 font-semibold mt-1">
                  {(() => {
                    const duration = Math.floor(currentTime - match.start_time);
                    const minutes = Math.floor(duration / 60);
                    return `${minutes} min en curso`;
                  })()}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-all duration-300 group/btn"
                aria-label="Agregar a favoritos"
              >
                <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button 
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-all duration-300 group/btn"
                aria-label="Compartir partido"
              >
                <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-2 rounded-lg">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Efecto de hover en el fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </Link>
  );
});

const Home = memo(function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"today" | "week" | "all">("today");
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const filterAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const triggerFilterFeedback = useCallback(() => {
    if (filterAnimationTimeoutRef.current) {
      clearTimeout(filterAnimationTimeoutRef.current);
    }
    setIsFiltering(true);
    filterAnimationTimeoutRef.current = setTimeout(() => {
      setIsFiltering(false);
      filterAnimationTimeoutRef.current = null;
    }, 360);
  }, []);

  const handleTimeframeChange = useCallback((timeframe: "today" | "week" | "all") => {
    if (selectedTimeframe === timeframe) {
      return false;
    }
    triggerFilterFeedback();
    setSelectedTimeframe(timeframe);
    return true;
  }, [selectedTimeframe, triggerFilterFeedback]);

  const handleGameChange = useCallback((gameId: string) => {
    if (selectedGame === gameId) {
      return false;
    }
    triggerFilterFeedback();
    setSelectedGame(gameId);
    return true;
  }, [selectedGame, triggerFilterFeedback]);

  const handleLiveOnlyToggle = useCallback(() => {
    triggerFilterFeedback();
    setShowLiveOnly((prev) => !prev);
  }, [triggerFilterFeedback]);

  const handleResetFilters = useCallback(() => {
    const defaultTimeframe = "today";
    const defaultGame = "all";
    const timeframeChanged = selectedTimeframe !== defaultTimeframe;
    const gameChanged = selectedGame !== defaultGame;

    if (timeframeChanged) {
      setSelectedTimeframe(defaultTimeframe);
    }
    if (gameChanged) {
      setSelectedGame(defaultGame);
    }
    if (showLiveOnly) {
      setShowLiveOnly(false);
    }

    triggerFilterFeedback();
  }, [selectedTimeframe, selectedGame, showLiveOnly, triggerFilterFeedback]);

  useEffect(() => {
    return () => {
      if (filterAnimationTimeoutRef.current) {
        clearTimeout(filterAnimationTimeoutRef.current);
      }
    };
  }, []);
  
  const { currentTime, isClient } = useCurrentTime();
  const clientExtrasReady = useDeferredClientRender(400);
  const notificationSystem = useNotifications({ enabled: clientExtrasReady });
  const addNotification = notificationSystem.addNotification;

  const matchesByGame = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    for (const match of matches) {
      (grouped[match.game] ||= []).push(match);
    }
    return grouped;
  }, [matches]);

  const tournamentsByGame = useMemo(() => {
    const grouped: Record<string, Tournament[]> = {};
    for (const tournament of tournaments) {
      (grouped[tournament.game] ||= []).push(tournament);
    }
    return grouped;
  }, [tournaments]);

  // Función de carga de datos memoizada
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const matchesData = await fetchAllMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
      // Use the stable callback reference to avoid unnecessary re-creations
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar partidos',
        priority: 'medium'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const loadTournaments = useCallback(async () => {
    try {
      setLoadingTournaments(true);
      const tournamentsData = await fetchAllTournaments();
      const now = Math.floor(Date.now() / 1000);
      const activeTournaments = tournamentsData.filter(t => {
        if (!t.begin_at) return false;
        const started = t.begin_at <= now;
        const ended = t.end_at && t.end_at < now;
        return started && !ended;
      });
      setTournaments(activeTournaments.slice(0, 6));
    } catch (error) {
      console.error('Error loading tournaments:', error);
      // Use the stable callback reference to avoid unnecessary re-creations
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar torneos',
        priority: 'medium'
      });
    } finally {
      setLoadingTournaments(false);
    }
  }, [addNotification]);

  // Cargar datos
  useEffect(() => {
    if (!isClient) return;
    let refreshTick = 0;
    const runRefresh = () => {
      loadData();
      // Refresh tournaments every few match refreshes.
      if (refreshTick % TOURNAMENT_REFRESH_STEPS === 0) {
        loadTournaments();
      }
      refreshTick += 1;
    };

    runRefresh();
    const interval = window.setInterval(runRefresh, MATCH_REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [isClient, loadData, loadTournaments]);

  // Estadísticas por juego
  const gameStats = useMemo(() => {
    const stats: Record<string, GameStats> = {};

    GAMES.forEach((game) => {
      const gameMatches = matchesByGame[game.id] ?? [];
      const gameTournaments = tournamentsByGame[game.id] ?? [];
      let liveMatches = 0;
      let upcomingMatches = 0;
      let completedMatches = 0;

      for (const match of gameMatches) {
        if (match.start_time <= currentTime && match.radiant_win === null) {
          liveMatches += 1;
        } else if (match.start_time > currentTime) {
          upcomingMatches += 1;
        } else if (match.radiant_win !== null) {
          completedMatches += 1;
        }
      }

      stats[game.id] = {
        totalMatches: gameMatches.length,
        liveMatches,
        upcomingMatches,
        completedMatches,
        activeTournaments: gameTournaments.length,
      };
    });

    return stats;
  }, [currentTime, matchesByGame, tournamentsByGame]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat("es-ES"), []);
  const matchRefreshSeconds = useMemo(
    () => Math.round(MATCH_REFRESH_INTERVAL / 1000),
    []
  );

  const aggregatedStats = useMemo(() => {
    return Object.values(gameStats).reduce(
      (acc, stats) => {
        if (!stats) {
          return acc;
        }

        acc.totalMatches += stats.totalMatches;
        acc.liveMatches += stats.liveMatches;
        acc.upcomingMatches += stats.upcomingMatches;
        acc.tournaments += stats.activeTournaments;
        return acc;
      },
      { totalMatches: 0, liveMatches: 0, upcomingMatches: 0, tournaments: 0 }
    );
  }, [gameStats]);

  const heroHighlights = [
    {
      label: "Partidos activos",
      value: aggregatedStats.liveMatches,
      helper: "actualizados al minuto",
    },
    {
      label: "Programados",
      value: aggregatedStats.upcomingMatches,
      helper: "para los próximos 7 días",
    },
    {
      label: "Torneos activos",
      value: aggregatedStats.tournaments,
      helper: "de las ligas top",
    },
  ];

  // Partidos filtrados por timeframe y juego + métricas para los filtros
  const { filteredMatches, timeframeCounts } = useMemo(() => {
    const baseMatches = selectedGame === "all" ? matches : matchesByGame[selectedGame] ?? [];

    if (!baseMatches.length) {
      return {
        filteredMatches: [] as Match[],
        timeframeCounts: {
          today: 0,
          week: 0,
          all: 0,
        },
      };
    }

    const filtered: Match[] = [];
    const nowSeconds = currentTime || Math.floor(Date.now() / 1000);
    const nowMs = nowSeconds * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(nowMs);
    startOfToday.setHours(0, 0, 0, 0);
    const todayStartMs = startOfToday.getTime();
    const todayEndMs = todayStartMs + dayMs;
    const weekEndMs = nowMs + 7 * dayMs;
    const isLiveMatch = (match: Match) =>
      match.start_time <= nowSeconds && match.radiant_win === null;
    const matchesForFiltering = showLiveOnly
      ? baseMatches.filter(isLiveMatch)
      : baseMatches;
    const allCount = matchesForFiltering.length;

    let todayCount = 0;
    let weekCount = 0;

    for (const match of matchesForFiltering) {
      const matchMs = match.start_time * 1000;
      const isToday = matchMs >= todayStartMs && matchMs < todayEndMs;
      if (isToday) {
        todayCount += 1;
      }

      const isWithinWeek = matchMs >= nowMs && matchMs <= weekEndMs;
      if (isWithinWeek) {
        weekCount += 1;
      }

      let include = true;
      if (selectedTimeframe === "today") {
        include = isToday;
      } else if (selectedTimeframe === "week") {
        include = isWithinWeek;
      }

      if (include) {
        filtered.push(match);
      }
    }

    filtered.sort((a, b) => {
      const aIsLive = isLiveMatch(a);
      const bIsLive = isLiveMatch(b);

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      return a.start_time - b.start_time;
    });

    return {
      filteredMatches: filtered,
      timeframeCounts: {
        today: todayCount,
        week: weekCount,
        all: allCount,
      },
    };
  }, [matches, matchesByGame, selectedGame, selectedTimeframe, currentTime, showLiveOnly]);

  const timeframeOptions = useMemo(
    () => ([
      { id: "today" as const, label: "Hoy", emoji: "📅", description: "Partidos de hoy", count: timeframeCounts.today },
      { id: "week" as const, label: "Esta Semana", emoji: "🗓️", description: "Próximos 7 días", count: timeframeCounts.week },
      { id: "all" as const, label: "Todos", emoji: "🌐", description: "Sin filtro de tiempo", count: timeframeCounts.all },
    ]),
    [timeframeCounts]
  );

  // Partidos destacados (en vivo + próximos importantes)
  const featuredMatches = useMemo(() => {
    if (!filteredMatches.length) return [];

    const live: Match[] = [];
    const upcoming: Match[] = [];

    for (const match of filteredMatches) {
      if (match.start_time <= currentTime && match.radiant_win === null) {
        if (live.length < 2) {
          live.push(match);
        }
      } else if (match.start_time > currentTime) {
        if (upcoming.length < 3) {
          upcoming.push(match);
        }
      }

      if (live.length >= 2 && upcoming.length >= 3) {
        break;
      }
    }

    return [...live, ...upcoming].slice(0, 4);
  }, [filteredMatches, currentTime]);

  const heroFeaturedMatch = featuredMatches[0];
  const heroMatchIsLive = heroFeaturedMatch ? heroFeaturedMatch.start_time <= currentTime && heroFeaturedMatch.radiant_win === null : false;
  const heroMatchIsUpcoming = heroFeaturedMatch ? heroFeaturedMatch.start_time > currentTime : false;
  const heroMatchIsFinished = heroFeaturedMatch ? heroFeaturedMatch.radiant_win !== null : false;
  const heroMatchDate = heroFeaturedMatch ? new Date(heroFeaturedMatch.start_time * 1000) : null;
  const heroRadiantWinner = heroMatchIsFinished && heroFeaturedMatch ? heroFeaturedMatch.radiant_win === true : false;
  const heroDireWinner = heroMatchIsFinished && heroFeaturedMatch ? heroFeaturedMatch.radiant_win === false : false;

  return (
    <>
      <LiveScoreTicker currentGame="all" />
      
      <main className="min-h-screen pt-20">
        {/* Hero Section - Diseño Premium */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          {/* Fondos decorativos mejorados */}
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-950 via-[#0a0f1a] to-slate-900" aria-hidden="true" />
          
          {/* Patrón de grid sutil */}
          <div className="absolute inset-0 -z-15 opacity-20" aria-hidden="true">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,255,128,0.15) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          {/* Orbes de luz animados */}
          <div className="absolute -left-40 top-10 -z-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/0 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} aria-hidden="true" />
          <div className="absolute -right-40 top-40 -z-10 h-[400px] w-[400px] rounded-full bg-gradient-to-bl from-blue-500/25 to-blue-500/0 blur-[80px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} aria-hidden="true" />
          <div className="absolute left-1/3 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-t from-purple-500/20 to-purple-500/0 blur-[60px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} aria-hidden="true" />

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="grid grid-cols-1 gap-12 lg:gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center">
                {/* Contenido principal */}
                <div className="flex flex-col gap-6 lg:gap-8">
                  {/* Badge de temporada */}
                  <div className="inline-flex w-fit items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm">
                    <span className="flex h-2 w-2">
                      <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                      Temporada 2025 · En directo
                    </span>
                  </div>
                  
                  {/* Título principal */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight">
                    <span className="text-white">Toda la escena</span>
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      esports
                    </span>
                    <span className="text-white"> en </span>
                    <span className="relative inline-block">
                      <span className="relative z-10 text-white">vivo</span>
                      <span className="absolute -inset-1 -z-10 rounded-lg bg-gradient-to-r from-emerald-500/30 to-blue-500/30 blur-sm" aria-hidden="true"></span>
                    </span>
                  </h1>
                  
                  {/* Descripción */}
                  <p className="max-w-xl text-base sm:text-lg text-white/70 leading-relaxed">
                    Monitoriza resultados en tiempo real, consulta horarios de las mejores ligas y recibe alertas instantáneas de 
                    <span className="text-emerald-400 font-semibold"> Dota 2</span>, 
                    <span className="text-blue-400 font-semibold"> League of Legends</span>, 
                    <span className="text-orange-400 font-semibold"> CS2</span> y más.
                  </p>
                  
                  {/* Botones de acción */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Link
                      href="/esports"
                      className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02] overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                      <span className="relative z-10 flex items-center gap-2">
                        <span>🎮</span>
                        Explorar partidos
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    </Link>
                    
                    <Link
                      href="#torneos"
                      className="group inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-white/15 bg-white/5 px-8 py-4 text-base font-bold text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/50 hover:bg-white/10 hover:text-white"
                    >
                      <span>🏆</span>
                      Ver torneos activos
                      <span className="text-emerald-400 transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>
                  </div>

                  {/* Métricas destacadas */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                    {heroHighlights.map((metric, index) => (
                      <div
                        key={metric.label}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.1]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Acento decorativo */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 via-transparent to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                        
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                          {metric.label}
                        </span>
                        <p className="mt-2 text-3xl sm:text-4xl font-black text-white tabular-nums">
                          {numberFormatter.format(Math.max(metric.value, 0))}
                        </p>
                        <p className="mt-1 text-xs text-white/50">{metric.helper}</p>
                      </div>
                    ))}
                  </div>

                  {/* Features badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { icon: "⚡", text: "Alertas en vivo", color: "emerald" },
                      { icon: "🎯", text: "Cobertura multijuego", color: "blue" },
                      { icon: "📊", text: "Estadísticas avanzadas", color: "purple" }
                    ].map((feature, index) => (
                      <span
                        key={feature.text}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                          feature.color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' :
                          feature.color === 'blue' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' :
                          'border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                        }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span>{feature.icon}</span>
                        {feature.text}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tarjeta de partido destacado */}
                <div className="relative lg:mt-0">
                  {/* Glows decorativos */}
                  <div className="absolute -right-20 top-0 h-60 w-60 rounded-full bg-emerald-500/20 blur-[80px]" aria-hidden="true" />
                  <div className="absolute -left-20 bottom-10 h-48 w-48 rounded-full bg-blue-500/15 blur-[60px]" aria-hidden="true" />
                  
                  {/* Tarjeta principal */}
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/80 via-black/60 to-black/80 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]">
                    {/* Borde superior brillante */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" aria-hidden="true" />
                    
                    {/* Efecto de reflejo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" aria-hidden="true" />
                    
                    <div className="relative flex flex-col gap-6 p-6 sm:p-8">
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                            Partido destacado
                          </p>
                          <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white leading-tight">
                            {heroFeaturedMatch ? (
                              <>
                                {heroFeaturedMatch.radiant}
                                <span className="mx-2 text-emerald-400">vs</span>
                                {heroFeaturedMatch.dire}
                              </>
                            ) : (
                              "Personaliza tu feed"
                            )}
                          </h3>
                          <p className="mt-1 text-sm text-white/50">
                            {heroFeaturedMatch ? heroFeaturedMatch.league || "Liga profesional" : "Sigue tus juegos favoritos"}
                          </p>
                        </div>
                        
                        {/* Badge de estado */}
                        {heroFeaturedMatch ? (
                          heroMatchIsLive ? (
                            <LiveBadge className="scale-90" />
                          ) : heroMatchIsUpcoming ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 border border-blue-500/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              Próximo
                            </span>
                          ) : heroMatchIsFinished ? (
                            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60">Finalizado</span>
                          ) : null
                        ) : (
                          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60">Explorar</span>
                        )}
                      </div>

                      {heroFeaturedMatch ? (
                        <>
                          {/* Marcador */}
                          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                              {/* Equipo 1 */}
                              <div className="text-center space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/40 truncate">{heroFeaturedMatch.radiant}</p>
                                <p className={`text-4xl sm:text-5xl font-black tabular-nums ${heroRadiantWinner ? "text-emerald-400" : "text-white"}`}>
                                  {typeof heroFeaturedMatch.radiant_score === "number" ? heroFeaturedMatch.radiant_score : "—"}
                                </p>
                              </div>
                              
                              {/* VS */}
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-lg font-bold text-white/30">VS</span>
                                <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" aria-hidden="true" />
                              </div>
                              
                              {/* Equipo 2 */}
                              <div className="text-center space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/40 truncate">{heroFeaturedMatch.dire}</p>
                                <p className={`text-4xl sm:text-5xl font-black tabular-nums ${heroDireWinner ? "text-emerald-400" : "text-white"}`}>
                                  {typeof heroFeaturedMatch.dire_score === "number" ? heroFeaturedMatch.dire_score : "—"}
                                </p>
                              </div>
                            </div>
                            
                            {/* Info de fecha/hora */}
                            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/40">
                              <span className="flex items-center gap-2">
                                <span>📅</span>
                                {heroMatchDate?.toLocaleDateString("es-ES", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                              <span className="flex items-center gap-2">
                                <span>🕐</span>
                                {heroMatchDate?.toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Botón de acción */}
                          <Link
                            href={`/esports/${heroFeaturedMatch.id}`}
                            className="group inline-flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                          >
                            <span>Ver detalles del partido</span>
                            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                          </Link>
                        </>
                      ) : (
                        /* Estado vacío */
                        <div className="space-y-4 text-white/60">
                          <p className="text-sm leading-relaxed">
                            Configura notificaciones y selecciona tus títulos favoritos para recibir recomendaciones personalizadas.
                          </p>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                              href="/equipos"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02]"
                            >
                              👥 Descubrir equipos
                            </Link>
                            <Link
                              href="/esports"
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 transition-all duration-300 hover:border-emerald-400/50 hover:bg-white/10 hover:text-white"
                            >
                              📅 Ver calendario
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isFiltering && !loading && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2.5rem] bg-black/50 backdrop-blur-md text-white animate-fadein">
                  <Spinner size={30} label="Aplicando filtros" />
                  <span className="text-sm font-medium tracking-wide">Actualizando resultados…</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Estadísticas por Juego - Diseño Premium */}
        <section className="relative py-20 overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" aria-hidden="true" />
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header de sección mejorado */}
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Métricas en directo
                </span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Estadísticas en{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  tiempo real
                </span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
                Descubre qué escena está más activa ahora mismo y encuentra nuevas ligas para seguir
              </p>
            </div>
            
            {/* Grid de juegos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-6">
              {GAMES.map((game, index) => (
                <div
                  key={game.id}
                  className="animate-fadein"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <GameStatsCard
                    game={game}
                    stats={gameStats[game.id] || { totalMatches: 0, liveMatches: 0, upcomingMatches: 0, completedMatches: 0, activeTournaments: 0 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filtros Avanzados */}
        <section className="relative py-16">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-white/5 to-transparent" aria-hidden="true" />
          <div className="container mx-auto px-6">
            <div
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl shadow-[0_20px_70px_-45px_rgba(16,185,129,0.6)] sm:p-10"
              aria-busy={isFiltering}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10" aria-hidden="true" />
              <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
              <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
              <div className={`relative transition-opacity duration-300 ${isFiltering ? "opacity-60" : "opacity-100"}`}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    🎛️ Filtros Avanzados
                  </h3>
                  <p className="text-gray-400 text-sm">Personaliza tu experiencia seleccionando período de tiempo y juegos</p>
                </div>

            {/* Filtros de Tiempo */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-blue-400">⏰</span>
                Período de Tiempo
                <Tooltip
                  content={`Selecciona el rango temporal que mejor se adapte a tu análisis.
Incluye partidos en vivo y próximos para ese período.`}
                  className="ml-2 inline-flex"
                >
                  <span
                    tabIndex={0}
                    aria-label="Ayuda sobre el período de tiempo"
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/60 bg-blue-500/10 text-xs font-bold text-blue-200 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                  >
                    i
                  </span>
                </Tooltip>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {timeframeOptions.map((option, index) => (
                  <Tooltip
                    key={option.id}
                    content={`${option.emoji} ${option.label}
${option.description}. Coincidencias actuales: ${option.count}.`}
                    className="block h-full"
                  >
                    <button
                      onClick={() => handleTimeframeChange(option.id)}
                      className={`group relative overflow-hidden px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                        selectedTimeframe === option.id
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25"
                          : "bg-gray-800/50 text-white border-gray-600 hover:border-blue-500/50 hover:bg-gray-700/50"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Efecto de brillo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      
                      <div className="relative z-10 text-center">
                        <div className="text-2xl mb-2">{option.emoji}</div>
                        <div className="font-bold text-base mb-1">{option.label}</div>
                        <div className={`text-xs mb-2 ${selectedTimeframe === option.id ? 'text-blue-100' : 'text-gray-400'}`}>
                          {option.description}
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                          selectedTimeframe === option.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {option.count} partidos
                        </div>
                      </div>

                      {/* Indicador de selección */}
                      {selectedTimeframe === option.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-b-xl"></div>
                      )}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Filtros de Juegos */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-green-400">🎮</span>
                Seleccionar Juegos
                <Tooltip
                  content={`Filtra la lista por juego específico para centrarte en tus ligas favoritas.
Los partidos mostrados y las estadísticas se ajustan automáticamente.`}
                  className="ml-2 inline-flex"
                >
                  <span
                    tabIndex={0}
                    aria-label="Ayuda sobre el filtro de juegos"
                    className="flex h-5 w-5 items-center justify-center rounded-full border border-green-400/60 bg-green-500/10 text-xs font-bold text-green-200 hover:bg-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-400/60"
                  >
                    i
                  </span>
                </Tooltip>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Opción "Todos los juegos" */}
                <Tooltip
                  content={`Todos los juegos
Reúne enfrentamientos de cada título disponible. Coincidencias actuales: ${matches.length}.`}
                  className="block h-full"
                >
                  <button
                    onClick={() => handleGameChange("all")}
                    className={`group relative overflow-hidden px-4 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                      selectedGame === "all"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-lg shadow-green-500/25"
                        : "bg-gray-800/50 text-white border-gray-600 hover:border-green-500/50 hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    <div className="relative z-10 text-center">
                      <div className="text-3xl mb-3">🌟</div>
                      <div className="font-bold text-sm mb-2">Todos</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        selectedGame === "all" 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {matches.length} partidos
                      </div>
                    </div>

                    {selectedGame === "all" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-b-xl"></div>
                    )}
                  </button>
                </Tooltip>

                {/* Opciones de juegos individuales */}
                {GAMES.map((game, index) => {
                  const gameMatches = matchesByGame[game.id] ?? [];
                  return (
                    <Tooltip
                      key={game.id}
                      content={`${game.name}
${game.description ?? "Información del título"}. Coincidencias actuales: ${gameMatches.length}.`}
                      className="block h-full"
                    >
                      <button
                        onClick={() => handleGameChange(game.id)}
                        className={`group relative overflow-hidden px-4 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                          selectedGame === game.id
                            ? `bg-gradient-to-r ${game.gradient} text-white border-white/30 shadow-lg`
                            : "bg-gray-800/50 text-white border-gray-600 hover:border-green-500/50 hover:bg-gray-700/50"
                        }`}
                        style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        
                        <div className="relative z-10 text-center">
                          <div className="mb-3">
                            <Image
                              src={game.icon}
                              alt={`Icono de ${game.name}`}
                              width={32}
                              height={32}
                              className="w-8 h-8 mx-auto group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <div className="font-bold text-sm mb-2 line-clamp-1" title={game.name}>
                            {game.name}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            selectedGame === game.id 
                              ? 'bg-white/20 text-white' 
                              : 'bg-gray-700 text-gray-300'
                          }`}>
                            {gameMatches.length} partidos
                          </div>
                        </div>

                        {selectedGame === game.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-b-xl"></div>
                        )}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

              {/* Información de resultados y acciones */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-xl text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Actualización automática cada {matchRefreshSeconds}s
                </div>
                <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 px-4 py-2 rounded-xl text-sm text-white border border-blue-500/30">
                  <span className="font-bold">{filteredMatches.length}</span> partidos encontrados
                </div>
                {showLiveOnly && (
                  <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-xl text-sm text-red-200 border border-red-500/30">
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                    Solo en vivo activo
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLiveOnlyToggle}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    showLiveOnly
                      ? "bg-red-500/20 text-red-100 border border-red-400/60"
                      : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white"
                  }`}
                  aria-label={showLiveOnly ? "Desactivar filtro de partidos en vivo" : "Filtrar solo partidos en vivo"}
                  aria-pressed={showLiveOnly}
                >
                  {showLiveOnly ? "🔴 En vivo" : "🔴 Solo en vivo"}
                </button>
                <button 
                  onClick={handleResetFilters}
                  className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
                  aria-label="Restablecer filtros a valores por defecto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restablecer
                </button>
                
                {featuredMatches.length > 0 && (
                  <Link 
                    href="/esports"
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Ver Todos
                  </Link>
                )}
              </div>
            </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partidos Destacados */}
        <section className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              ⚡ Partidos Destacados
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Los enfrentamientos más emocionantes en vivo y próximos a comenzar
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="relative" aria-busy={loading || isFiltering}>
            <div className={`transition-opacity duration-300 ${isFiltering && !loading ? "opacity-60" : "opacity-100"}`}>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-2xl p-8 animate-pulse border border-gray-700">
                      <div className="flex justify-between items-center mb-6">
                        <div className="h-4 bg-gray-700 rounded w-32"></div>
                        <div className="h-6 bg-gray-700 rounded-full w-20"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <div className="h-6 bg-gray-700 rounded mb-2"></div>
                          <div className="h-10 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                        <div className="text-center px-6">
                          <div className="h-6 bg-gray-700 rounded w-8 mx-auto"></div>
                        </div>
                        <div className="text-center flex-1">
                          <div className="h-6 bg-gray-700 rounded mb-2"></div>
                          <div className="h-10 bg-gray-700 rounded w-16 mx-auto"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : featuredMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featuredMatches.map((match, index) => (
                    <div 
                      key={match.id} 
                      className="animate-fadein"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <FeaturedMatch match={match} currentTime={currentTime} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 max-w-md mx-auto">
                    <div className="text-6xl mb-4">🎮</div>
                    <h3 className="text-xl font-bold text-white mb-2">No hay partidos destacados</h3>
                    <p className="text-gray-400 mb-6">
                      No hay partidos en vivo o próximos en este momento.
                    </p>
                    <Link 
                      href="/esports"
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg inline-block"
                    >
                      Ver Todos los Partidos
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {isFiltering && !loading && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm text-white animate-fadein">
                <Spinner size={34} label="Actualizando partidos destacados" />
                <span className="text-sm font-medium">Filtrando partidos…</span>
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          {featuredMatches.length > 0 && (
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link 
                    href="/esports"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    🎯 Ver Todos los Partidos
                  </Link>
                  <button 
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                    aria-label="Ver mis equipos favoritos"
                  >
                    ⭐ Mis Favoritos
                  </button>
                  <button 
                    onClick={handleLiveOnlyToggle}
                    className={`text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 ${
                      showLiveOnly
                        ? "bg-gradient-to-r from-red-500 to-red-600 ring-2 ring-red-300/60"
                        : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    }`}
                    aria-label={showLiveOnly ? "Desactivar filtro de partidos en vivo" : "Filtrar solo partidos en vivo"}
                    aria-pressed={showLiveOnly}
                  >
                    {showLiveOnly ? "🔴 En vivo activo" : "🔴 Solo En Vivo"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Torneos Activos */}
        <section id="torneos" className="container mx-auto px-6 py-16 relative">
          {/* Fondo con gradiente */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black/30 to-gray-900/50 rounded-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                🏆 Torneos Activos
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Los torneos más importantes que están en curso en este momento
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-4 rounded-full"></div>
            </div>

            {loadingTournaments ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-2xl p-8 animate-pulse border border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 bg-gray-700 rounded mb-6 w-2/3"></div>
                    <div className="h-8 bg-gray-700 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : tournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tournaments.map((tournament, index) => {
                  const game = GAMES.find(g => g.id === tournament.game);
                  const isLive =
                    tournament.begin_at !== null &&
                    tournament.begin_at <= currentTime &&
                    (!tournament.end_at || tournament.end_at > currentTime);
                  return (
                    <div 
                      key={tournament.id} 
                      className="animate-fadein"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Link href={`/esports/tournament/${tournament.id}`}>
                        <div
                          className={`group relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-700 hover:border-green-500/50 ${
                            isLive ? "ring-2 ring-emerald-400/50 shadow-[0_0_32px_rgba(16,185,129,0.35)]" : ""
                          }`}
                        >
                          {/* Efecto de brillo */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          {/* Header del torneo */}
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                              {game && (
                                <div className="relative">
                                  <Image
                                    src={game.icon}
                                    alt={`Icono de ${game.name}`}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-green-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                                </div>
                              )}
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-400 group-hover:text-green-400 transition-colors duration-300">
                                  {tournament.league}
                                </span>
                                {game && (
                                  <p className="text-xs text-gray-500">{game.name}</p>
                                )}
                              </div>
                              
                              {/* Estado activo */}
                              {isLive && (
                                <LiveBadge label="EN CURSO" tone="emerald" className="pointer-events-none" />
                              )}
                            </div>
                            
                            {/* Información del torneo */}
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors duration-300 line-clamp-2">
                              {tournament.name}
                            </h3>
                            <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                              {tournament.serie}
                            </p>
                            
                            {/* Footer */}
                            <div className="flex items-center justify-between">
                              {tournament.prizepool ? (
                                <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
                                  <span className="text-yellow-200">💰</span>
                                  {tournament.prizepool}
                                </div>
                              ) : (
                                <div className="bg-gray-700/50 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium">
                                  Prize Pool TBD
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-gray-400">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Efecto de hover en el fondo */}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 max-w-md mx-auto">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold text-white mb-2">No hay torneos activos</h3>
                  <p className="text-gray-400 mb-6">
                    No hay torneos en curso en este momento.
                  </p>
                  <Link 
                    href="/esports"
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg inline-block"
                  >
                    Ver Todos los Torneos
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action - Diseño Premium */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="relative overflow-hidden rounded-3xl">
            {/* Fondo con gradiente y efectos */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/15 to-purple-500/20" aria-hidden="true" />
            <div className="absolute inset-0 backdrop-blur-3xl" aria-hidden="true" />
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/30 rounded-full blur-[100px]" aria-hidden="true" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-[100px]" aria-hidden="true" />
            
            {/* Borde decorativo */}
            <div className="absolute inset-0 rounded-3xl border border-white/10" aria-hidden="true" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" aria-hidden="true" />
            
            <div className="relative text-center px-6 py-16 sm:py-20 lg:py-24">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-6">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Únete ahora
              </span>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 max-w-3xl mx-auto leading-tight">
                ¿Listo para sumergirte en el{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  mundo esports
                </span>
                ?
              </h2>
              
              <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                Únete a miles de usuarios que ya siguen sus equipos favoritos y nunca se pierden un partido importante.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/esports" 
                  className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-10 py-4 text-lg font-bold text-white shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02] overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                  <span className="relative z-10 flex items-center gap-2">
                    🚀 Comenzar Ahora
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                
                <Link 
                  href="/equipos"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/15 bg-white/5 px-8 py-4 text-lg font-bold text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/50 hover:bg-white/10 hover:text-white"
                >
                  👥 Explorar Equipos
                </Link>
              </div>
              
              {/* Stats mini */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
                {[
                  { value: "50K+", label: "Usuarios activos" },
                  { value: "1000+", label: "Partidos diarios" },
                  { value: "5", label: "Juegos soportados" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-white/50 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Sistemas adicionales */}
      {clientExtrasReady && (
        <>
          <NotificationSystem
            notifications={notificationSystem.notifications}
            onMarkAsRead={notificationSystem.markAsRead}
            onClearAll={notificationSystem.clearAll}
            onDeleteNotification={notificationSystem.deleteNotification}
          />
          <ChatBot />
        </>
      )}
      <ScrollToTop />
    </>
  );
});

export default Home;
