"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import Header from "./components/Header";
import Image from "next/image";
import ChatBot from "./components/ChatBot";
import LiveScoreTicker from "./components/LiveScoreTicker";
import NotificationSystem, { useNotifications } from "./components/NotificationSystem";
import ScrollToTop from "./components/ScrollToTop";
import { SUPPORTED_GAMES, type GameConfig } from "./lib/gameConfig";

// Custom hook to handle time consistently between server and client
function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState<number>(() => {
    // Initialize with a consistent value for SSR
    return typeof window !== 'undefined' ? Math.floor(Date.now() / 1000) : 0;
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(Math.floor(Date.now() / 1000));
    
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
    params: { game: game.id },
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
        .map((m: any) => {
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
  
  return allMatches.sort((a, b) => a.start_time - b.start_time);
}

// Función para obtener torneos de múltiples juegos
async function fetchAllTournaments(): Promise<Tournament[]> {
  const allTournaments: Tournament[] = [];
  
  // Usar consultas en lote optimizadas
  const batchConfigs = GAMES.map(game => ({
    endpoint: `/api/esports/tournaments`,
    params: { game: game.id },
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

// Componente de estadísticas del juego (memoizado)
const GameStatsCard = memo(function GameStatsCard({ game, stats }: { game: GameConfig, stats: GameStats }) {
  return (
    <Link href={`/esports/game/${game.id}`} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-white/10 cursor-pointer block`}>
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat"></div>
      </div>
      
      {/* Icono flotante */}
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity duration-500" aria-hidden="true">
  <Image src={game.icon} alt="" width={64} height={64} className="w-16 h-16 group-hover:scale-110 transition-transform duration-500" />
      </div>
      
      {/* Indicador de click */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
          <span>👆</span>
          <span>Explorar</span>
        </div>
      </div>
      
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Image src={game.icon} alt={`Icono de ${game.name}`} width={32} height={32} className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold group-hover:text-white transition-colors duration-300">
              {game.name}
            </h3>
            <p className="text-sm opacity-75">Estadísticas Live</p>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
              <p className="text-sm font-medium opacity-90">Total</p>
            </div>
            <p className="text-3xl font-bold group-hover:scale-105 transition-transform duration-300">
              {stats.totalMatches}
            </p>
          </div>
          
          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium opacity-90">En Vivo</p>
            </div>
            <p className="text-3xl font-bold text-red-300 group-hover:scale-105 transition-transform duration-300">
              {stats.liveMatches}
            </p>
          </div>
          
          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <p className="text-sm font-medium opacity-90">Próximos</p>
            </div>
            <p className="text-3xl font-bold text-blue-300 group-hover:scale-105 transition-transform duration-300">
              {stats.upcomingMatches}
            </p>
          </div>
          
          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <p className="text-sm font-medium opacity-90">Torneos</p>
            </div>
            <p className="text-3xl font-bold text-yellow-300 group-hover:scale-105 transition-transform duration-300">
              {stats.activeTournaments}
            </p>
          </div>
        </div>

        {/* Footer con indicador de actividad */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-75">Última actualización</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Ahora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Efecto de hover en el borde */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/30 transition-colors duration-500"></div>
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
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
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
              <div className="relative">
                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-2 rounded-full animate-pulse shadow-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  EN VIVO
                </span>
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
              </div>
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
  
  const { currentTime, isClient } = useCurrentTime();
  const notificationSystem = useNotifications();
  const addNotification = notificationSystem.addNotification;

  // Callbacks memoizados para evitar re-renders
  const handleGameChange = useCallback((game: string) => {
    setSelectedGame(game);
  }, []);

  const handleTimeframeChange = useCallback((timeframe: "today" | "week" | "all") => {
    setSelectedTimeframe(timeframe);
  }, []);

  // Función de carga de datos memoizada
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const matchesData = await fetchAllMatches();
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
      notificationSystem.addNotification({
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
      notificationSystem.addNotification({
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
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isClient) return;
    loadTournaments();
    const interval = setInterval(loadTournaments, 60000); // refresh cada 60s
    return () => clearInterval(interval);
  }, [isClient, loadTournaments]);

  // Estadísticas por juego
  const gameStats = useMemo(() => {
    const stats: Record<string, GameStats> = {};

    GAMES.forEach(game => {
      const gameMatches = matches.filter(m => m.game === game.id);
      const gameTournaments = tournaments.filter(t => t.game === game.id);
      
      stats[game.id] = {
        totalMatches: gameMatches.length,
        liveMatches: gameMatches.filter(m => m.start_time <= currentTime && m.radiant_win === null).length,
        upcomingMatches: gameMatches.filter(m => m.start_time > currentTime).length,
        completedMatches: gameMatches.filter(m => m.radiant_win !== null).length,
        activeTournaments: gameTournaments.length,
      };
    });

    return stats;
  }, [matches, tournaments, currentTime]);

  // Partidos filtrados por timeframe y juego
  const filteredMatches = useMemo(() => {
    if (!matches.length) return [];
    
    let filtered = matches;

    // Filtrar por juego
    if (selectedGame !== "all") {
      filtered = filtered.filter(m => m.game === selectedGame);
    }

    // Filtrar por tiempo
    const currentTimeMs = currentTime * 1000;
    switch (selectedTimeframe) {
      case "today":
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayStartMs = todayStart.getTime();
        const todayEndMs = todayEnd.getTime();
        filtered = filtered.filter(m => {
          const matchTime = m.start_time * 1000;
          return matchTime >= todayStartMs && matchTime <= todayEndMs;
        });
        break;
      case "week":
        const weekEnd = currentTimeMs + (7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(m => {
          const matchTime = m.start_time * 1000;
          return matchTime >= currentTimeMs && matchTime <= weekEnd;
        });
        break;
    }

    return filtered.sort((a, b) => {
      // Priorizar partidos en vivo
      const aIsLive = a.start_time <= currentTime && a.radiant_win === null;
      const bIsLive = b.start_time <= currentTime && b.radiant_win === null;
      
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      
      return a.start_time - b.start_time;
    });
  }, [matches, selectedTimeframe, selectedGame, currentTime]);

  // Partidos destacados (en vivo + próximos importantes)
  const featuredMatches = useMemo(() => {
    if (!filteredMatches.length) return [];
    
    const live = filteredMatches.filter(m => m.start_time <= currentTime && m.radiant_win === null);
    const upcoming = filteredMatches.filter(m => m.start_time > currentTime);
    
    return [...live.slice(0, 2), ...upcoming.slice(0, 3)].slice(0, 4);
  }, [filteredMatches, currentTime]);

  return (
    <>
      <Header />
      <LiveScoreTicker currentGame="all" />
      
      <main className="min-h-screen pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                EMob Esports
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Tu centro de comando para seguir los mejores torneos y partidos de esports en tiempo real
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/esports" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
                  Explorar Partidos
                </Link>
                <button className="border border-green-500 text-green-500 hover:bg-green-500 hover:text-black px-8 py-3 rounded-xl font-semibold transition-all duration-300">
                  Ver Torneos
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Estadísticas por Juego */}
        <section className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              📊 Estadísticas en Tiempo Real
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Métricas actualizadas de todos los esports más populares
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {GAMES.map((game, index) => (
              <div 
                key={game.id} 
                className="animate-fadein"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GameStatsCard 
                  game={game} 
                  stats={gameStats[game.id] || { totalMatches: 0, liveMatches: 0, upcomingMatches: 0, completedMatches: 0, activeTournaments: 0 }} 
                />
              </div>
            ))}
          </div>
        </section>

        {/* Filtros Avanzados */}
        <section className="container mx-auto px-6 mb-12">
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-3xl p-8 border border-gray-700 backdrop-blur-sm">
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
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "today", label: "Hoy", emoji: "📅", description: "Partidos de hoy", count: filteredMatches.filter(m => {
                    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                    const matchTime = m.start_time * 1000;
                    return matchTime >= todayStart.getTime() && matchTime <= todayEnd.getTime();
                  }).length },
                  { id: "week", label: "Esta Semana", emoji: "🗓️", description: "Próximos 7 días", count: filteredMatches.filter(m => {
                    const weekStart = currentTime * 1000;
                    const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
                    const matchTime = m.start_time * 1000;
                    return matchTime >= weekStart && matchTime <= weekEnd;
                  }).length },
                  { id: "all", label: "Todos", emoji: "🌐", description: "Sin filtro de tiempo", count: matches.length },
                ].map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedTimeframe(option.id as typeof selectedTimeframe)}
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
                        {selectedGame === "all" ? option.count : filteredMatches.length} partidos
                      </div>
                    </div>

                    {/* Indicador de selección */}
                    {selectedTimeframe === option.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-b-xl"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros de Juegos */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-green-400">🎮</span>
                Seleccionar Juegos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Opción "Todos los juegos" */}
                <button
                  onClick={() => setSelectedGame("all")}
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

                {/* Opciones de juegos individuales */}
                {GAMES.map((game, index) => {
                  const gameMatches = matches.filter(m => m.game === game.id);
                  return (
                    <button
                      key={game.id}
                      onClick={() => setSelectedGame(game.id)}
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
                  Actualización automática cada 30s
                </div>
                
                <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 px-4 py-2 rounded-xl text-sm text-white border border-blue-500/30">
                  <span className="font-bold">{filteredMatches.length}</span> partidos encontrados
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setSelectedTimeframe("today");
                    setSelectedGame("all");
                  }}
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
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                    aria-label="Filtrar solo partidos en vivo"
                  >
                    🔴 Solo En Vivo
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Torneos Activos */}
        <section className="container mx-auto px-6 py-16 relative">
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
                  return (
                    <div 
                      key={tournament.id} 
                      className="animate-fadein"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Link href={`/esports/tournament/${tournament.id}`}>
                        <div className="group relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-700 hover:border-green-500/50">
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
                              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">
                                ACTIVO
                              </div>
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

        {/* Call to Action */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl p-12 border border-green-500/30">
            <h2 className="text-4xl font-bold mb-6">¿Listo para sumergirte en el mundo de los esports?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Únete a miles de usuarios que ya siguen sus equipos favoritos y nunca se pierden un partido importante.
            </p>
            <Link href="/esports" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg">
              Comenzar Ahora
            </Link>
          </div>
        </section>
      </main>

      {/* Sistemas adicionales */}
      <NotificationSystem
        notifications={notificationSystem.notifications}
        onMarkAsRead={notificationSystem.markAsRead}
        onClearAll={notificationSystem.clearAll}
        onDeleteNotification={notificationSystem.deleteNotification}
      />
      
      <ChatBot />
      <ScrollToTop />
    </>
  );
});

export default Home;
