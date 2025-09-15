"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Countdown from "../components/Countdown";
import { MatchSkeleton, TournamentSkeleton } from "../components/Skeleton";
import LiveScoreTicker from "../components/LiveScoreTicker";
import ScrollToTop from "../components/ScrollToTop";
import { useNotifications } from "../hooks/useNotifications";
import { useDeferredClientRender } from "../hooks/useDeferredClientRender";

const NotificationSystem = dynamic(() => import("../components/NotificationSystem"), {
  ssr: false,
});

const ChatBot = dynamic(() => import("../components/ChatBot"), {
  ssr: false,
  loading: () => null,
});

// Icono de favorito (estrella)
function Star({ filled, ...props }: { filled: boolean; [key: string]: any }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill={filled ? "#FFD700" : "none"}
      stroke="#FFD700"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: filled ? "drop-shadow(0 0 4px #FFD700)" : "none" }}
      {...props}
    >
      <polygon points="11,2 13.59,8.36 20.51,8.63 15.97,13.61 17.45,20.37 11,16.13 4.55,20.37 6.03,13.61 1.49,8.63 8.41,8.36" />
    </svg>
  );
}

interface Match {
  id: number;
  radiant: string;
  dire: string;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  league: string;
  radiant_win: boolean | null;
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
}

const GAMES = [
  { id: "dota2", name: "Dota 2", icon: "/dota2.svg", color: "#A970FF", gradient: "from-purple-600 to-purple-800" },
  { id: "lol", name: "League of Legends", icon: "/leagueoflegends.svg", color: "#1E90FF", gradient: "from-blue-600 to-blue-800" },
  { id: "csgo", name: "Counter-Strike 2", icon: "/counterstrike.svg", color: "#FFD700", gradient: "from-yellow-600 to-yellow-800" },
  { id: "r6siege", name: "Rainbow Six Siege", icon: "/rainbow6siege.png", color: "#FF6600", gradient: "from-orange-600 to-orange-800" },
  { id: "overwatch", name: "Overwatch 2", icon: "/overwatch.svg", color: "#F99E1A", gradient: "from-orange-500 to-orange-700" },
];

const TIMEFRAMES = [
  { id: "today", label: "Hoy", offset: 0, emoji: "📅", description: "Partidos de hoy" },
  { id: "tomorrow", label: "Mañana", offset: 1, emoji: "⏩", description: "Partidos de mañana" },
  { id: "week", label: "Esta Semana", offset: 7, emoji: "🗓️", description: "Próximos 7 días" },
];

async function fetchMatches(game: string): Promise<Match[]> {
  const res = await fetch(`/api/esports/matches?game=${game}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Failed to fetch matches", await res.text());
    return [];
  }
  const data = await res.json();
  return data
    .map((m: any) => {
      const team1 = m.opponents?.[0]?.opponent;
      const team2 = m.opponents?.[1]?.opponent;
      // Validar fecha
      const dateStr = m.begin_at ?? m.scheduled_at;
      const date = dateStr ? new Date(dateStr) : null;
      const start_time = date && !isNaN(date.getTime()) ? date.getTime() / 1000 : null;
      // Validar resultados
      const radiant_score = Array.isArray(m.results) && m.results[0]?.score != null ? m.results[0].score : null;
      const dire_score = Array.isArray(m.results) && m.results[1]?.score != null ? m.results[1].score : null;
      return {
        id: m.id,
        radiant: team1?.name ?? "TBD",
        dire: team2?.name ?? "TBD",
        radiant_score,
        dire_score,
        start_time,
        league: m.league?.name ?? "",
        radiant_win:
          m.winner?.id !== undefined && team1?.id !== undefined
            ? m.winner.id === team1.id
            : null,
      } as Match;
    })
    .filter((m: Match) => m.start_time !== null); // Filtrar partidos sin fecha válida
}

async function fetchTournaments(game: string): Promise<Tournament[]> {
  const res = await fetch(`/api/esports/tournaments?game=${game}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Failed to fetch tournaments", await res.text());
    return [];
  }
  const data = await res.json();
  return data.map((t: any) => ({
    id: t.id,
    name: t.name ?? "",
    begin_at: t.begin_at ? new Date(t.begin_at).getTime() / 1000 : null,
    end_at: t.end_at ? new Date(t.end_at).getTime() / 1000 : null,
    league: t.league?.name ?? "",
    serie: t.serie?.full_name ?? "",
    prizepool: t.prizepool ?? null,
    tier: t.tier ?? null,
    region: t.region ?? null,
    live_supported: !!t.live_supported,
  })) as Tournament[];
}

// Componente de partido destacado
function FeaturedMatch({ match, onToggleFavorite, favoriteMatches }: { 
  match: Match; 
  onToggleFavorite: React.Dispatch<React.SetStateAction<number[]>>; 
  favoriteMatches: number[];
}) {
  const now = Date.now() / 1000;
  const isLive = match.start_time <= now && match.radiant_win === null;
  const isUpcoming = match.start_time > now;
  const isFinished = match.radiant_win !== null;
  const isFavorite = favoriteMatches.includes(match.id);
  
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
              <div>
                <span className="text-sm font-medium text-gray-300">{match.league}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón de favorito */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(prev => 
                    prev.includes(match.id) 
                      ? prev.filter(id => id !== match.id)
                      : [...prev, match.id]
                  );
                }}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-yellow-400 transition-all duration-300"
              >
                <Star filled={isFavorite} />
              </button>
              
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
          
          {/* Footer con fecha */}
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
                    const duration = Math.floor(now - match.start_time);
                    const minutes = Math.floor(duration / 60);
                    return `${minutes} min en curso`;
                  })()}
                </p>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-2 rounded-lg">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Efecto de hover en el fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </Link>
  );
}

// Componente de tarjeta de torneo
function TournamentCard({ tournament, game }: { tournament: Tournament; game?: typeof GAMES[0] }) {
  const now = Date.now() / 1000;
  const isLive = tournament.begin_at && tournament.begin_at <= now && (!tournament.end_at || tournament.end_at > now);
  const isUpcoming = tournament.begin_at && tournament.begin_at > now;
  const isFinished = tournament.end_at && tournament.end_at < now;
  
  return (
    <div className="animate-fadein">
      <Link href={`/esports/tournament/${tournament.id}`}>
        <div className="group relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-700 hover:border-purple-500/50">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Header del torneo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              {game && (
                <div className="relative">
                  <Image
                    src={game.icon}
                    alt={game.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )}
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-400 group-hover:text-purple-400 transition-colors duration-300">
                  {tournament.league}
                </span>
                {game && (
                  <p className="text-xs text-gray-500">{game.name}</p>
                )}
              </div>
              
              {/* Estado del torneo */}
              {isLive && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  EN CURSO
                </div>
              )}
              {isUpcoming && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  PRÓXIMO
                </div>
              )}
              {isFinished && (
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  FINALIZADO
                </div>
              )}
            </div>
            
            {/* Información del torneo */}
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
              {tournament.name}
            </h3>
            {tournament.serie && (
              <p className="text-sm text-gray-400 mb-4 line-clamp-1">
                {tournament.serie}
              </p>
            )}
            
            {/* Información de fechas */}
            {tournament.begin_at && (
              <div className="mb-4 text-sm">
                {isUpcoming ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Comienza:</span>
                    <Countdown targetTime={tournament.begin_at} />
                  </div>
                ) : isLive ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-semibold">En curso</span>
                  </div>
                ) : isFinished ? (
                  <div className="text-gray-500">
                    Finalizado el {new Date(tournament.end_at! * 1000).toLocaleDateString("es-ES")}
                  </div>
                ) : (
                  <div className="text-blue-400">
                    Comenzó el {new Date(tournament.begin_at * 1000).toLocaleDateString("es-ES")}
                  </div>
                )}
              </div>
            )}
            
            {/* Información adicional */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex flex-col gap-1">
                {tournament.region && (
                  <span className="text-gray-500">📍 {tournament.region}</span>
                )}
                {tournament.tier && (
                  <span className={`font-semibold ${
                    tournament.tier.toLowerCase() === 's' ? 'text-yellow-400' :
                    tournament.tier.toLowerCase() === 'a' ? 'text-orange-400' :
                    'text-gray-400'
                  }`}>
                    🏅 Tier {tournament.tier.toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Prize pool */}
              {tournament.prizepool ? (
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
                  <span className="text-yellow-200">💰</span>
                  {tournament.prizepool}
                </div>
              ) : (
                <div className="bg-gray-700/50 text-gray-400 px-3 py-1 rounded-lg text-xs">
                  Prize TBD
                </div>
              )}
            </div>
          </div>

          {/* Efecto de hover en el fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </Link>
    </div>
  );
}

function EsportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtener el juego de los parámetros de URL o usar dota2 por defecto
  const [game, setGame] = useState<string>(() => {
    return searchParams?.get('game') || GAMES[0].id;
  });
  // Función para cambiar el juego y actualizar la URL
  const handleGameChange = (newGame: string) => {
    setGame(newGame);
    // Actualizar la URL con el nuevo juego
    const params = new URLSearchParams(searchParams?.toString());
    params.set('game', newGame);
    router.push(`/esports?${params.toString()}`);
  };

  const [timeframe, setTimeframe] = useState<string>("today");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState<boolean>(true);
  
  // Sistemas nuevos
  const clientExtrasReady = useDeferredClientRender(400);
  const notificationSystem = useNotifications({ enabled: clientExtrasReady });
  
  // Favoritos: ids de partidos favoritos
  const [favoriteMatches, setFavoriteMatches] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("favoriteMatches") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });
  
  // Filtros adicionales
  const [filterLeague, setFilterLeague] = useState<string>("");
  const [filterTeam, setFilterTeam] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedView, setSelectedView] = useState<"matches" | "tournaments">("matches");
  
  // Paginación
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Resetear página a 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [filterLeague, filterTeam, timeframe, game]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMatches(game);
      setMatches(data);
      setLoading(false);
    }
    load();
  }, [game]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favoriteMatches", JSON.stringify(favoriteMatches));
    }
  }, [favoriteMatches]);

  useEffect(() => {
    async function load() {
      setLoadingTournaments(true);
      const data = await fetchTournaments(game);
      const now = Date.now() / 1000;
      
      // Para la vista de torneos, mostrar todos los torneos relevantes
      const relevantTournaments = data.filter((t) => {
        if (t.begin_at === null) return false;
        // Mostrar torneos que empezaron hace menos de 90 días o que empezarán en los próximos 90 días
        const timeDiff = Math.abs(t.begin_at - now);
        const maxTimeDiff = 90 * 24 * 60 * 60; // 90 días en segundos
        return timeDiff <= maxTimeDiff;
      });
      
      relevantTournaments.sort((a, b) => {
        // Primero torneos en vivo, luego próximos, luego recientes
        const aLive = a.begin_at! <= now && (!a.end_at || a.end_at > now);
        const bLive = b.begin_at! <= now && (!b.end_at || b.end_at > now);
        
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        
        return (b.begin_at ?? 0) - (a.begin_at ?? 0);
      });
      
      setTournaments(relevantTournaments.slice(0, 20)); // Mostrar hasta 20 torneos
      setLoadingTournaments(false);
    }
    load();
  }, [game]);

  function matchOnSelectedTimeframe(match: Match) {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const matchTime = match.start_time * 1000;
    
    switch (timeframe) {
      case "today":
        const todayEnd = new Date(startOfToday);
        todayEnd.setDate(todayEnd.getDate() + 1);
        return matchTime >= startOfToday.getTime() && matchTime < todayEnd.getTime();
      case "tomorrow":
        const tomorrowStart = new Date(startOfToday);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
        return matchTime >= tomorrowStart.getTime() && matchTime < tomorrowEnd.getTime();
      case "week":
        const weekEnd = new Date(startOfToday);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return matchTime >= startOfToday.getTime() && matchTime < weekEnd.getTime();
      default:
        return true;
    }
  }

  // Filtrado avanzado y favoritos
  const filtered = useMemo(() => {
    let res = matches.filter(matchOnSelectedTimeframe);
    if (filterLeague) {
      res = res.filter((m) => m.league.toLowerCase().includes(filterLeague.toLowerCase()));
    }
    if (filterTeam) {
      res = res.filter(
        (m) =>
          m.radiant.toLowerCase().includes(filterTeam.toLowerCase()) ||
          m.dire.toLowerCase().includes(filterTeam.toLowerCase())
      );
    }
    if (filterStatus) {
      res = res.filter((m) => {
        const now = Date.now() / 1000;
        if (filterStatus === "live") return m.start_time && m.start_time <= now && m.radiant_win === null;
        if (filterStatus === "upcoming") return m.radiant_win === null && m.start_time > now;
        if (filterStatus === "finished") return m.radiant_win !== null;
        return true;
      });
    }
    return res;
  }, [matches, timeframe, filterLeague, filterTeam, filterStatus]);

  // Paginación de partidos filtrados
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const favoriteList = useMemo(
    () => matches.filter((m) => favoriteMatches.includes(m.id)),
    [matches, favoriteMatches]
  );

  // Estadísticas rápidas
  const stats = useMemo(() => {
    return {
      total: filtered.length,
      favoritos: favoriteList.length,
      hoy: matches.filter(m => {
        if (!m.start_time) return false;
        const now = new Date();
        const ms = m.start_time * 1000;
        return new Date(ms).toDateString() === now.toDateString();
      }).length,
      equipos: Array.from(new Set(matches.flatMap(m => [m.radiant, m.dire]))).length,
      ligas: Array.from(new Set(matches.map(m => m.league))).length,
    };
  }, [filtered, favoriteList, matches]);

  // Monitoreo de partidos favoritos para notificaciones
  useEffect(() => {
    const checkFavoriteMatches = () => {
      const now = Date.now() / 1000;
      favoriteList.forEach(match => {
        // Notificar 15 minutos antes del inicio
        const notifyTime = match.start_time - (15 * 60);
        if (now >= notifyTime && now < match.start_time) {
          notificationSystem.addNotification({
            type: 'match_start',
            title: 'Partido favorito próximo',
            message: `${match.radiant} vs ${match.dire} comienza en 15 minutos`,
            priority: 'high',
            actionUrl: `/esports/${match.id}`
          });
        }
      });
    };

    const interval = setInterval(checkFavoriteMatches, 60000); // Cada minuto
    return () => clearInterval(interval);
  }, [favoriteList, notificationSystem]);

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <LiveScoreTicker currentGame={game} />
      
      <main className="min-h-screen pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                ⚡ Centro de Esports
              </h1>
              <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
                Explora partidos, sigue tus equipos favoritos y mantente al día con los mejores torneos
              </p>
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-green-400">{stats.total}</div>
                  <div className="text-sm text-gray-400">Partidos</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-yellow-400">{stats.favoritos}</div>
                  <div className="text-sm text-gray-400">Favoritos</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400">{stats.hoy}</div>
                  <div className="text-sm text-gray-400">Hoy</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-purple-400">{stats.equipos}</div>
                  <div className="text-sm text-gray-400">Equipos</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-cyan-400">{stats.ligas}</div>
                  <div className="text-sm text-gray-400">Ligas</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-8">
          {/* Navegación de contenido */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-2 border border-gray-700">
              <button
                onClick={() => setSelectedView("matches")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedView === "matches"
                    ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                🎯 Partidos
              </button>
              <button
                onClick={() => setSelectedView("tournaments")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedView === "tournaments"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}
              >
                🏆 Torneos
              </button>
            </div>
          </div>

          {/* Filtros de juegos */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Seleccionar Juego</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {GAMES.map((g, index) => (
                <button
                  key={g.id}
                  onClick={() => handleGameChange(g.id)}
                  className={`group relative overflow-hidden px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                    game === g.id
                      ? `bg-gradient-to-r ${g.gradient} text-white border-white/30 shadow-lg`
                      : "bg-gray-800/50 text-white border-gray-600 hover:border-green-500/50 hover:bg-gray-700/50"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  
                  <div className="relative z-10 text-center">
                    <div className="mb-3">
                      <Image
                        src={g.icon}
                        alt={g.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 mx-auto group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="font-bold text-sm">{g.name}</div>
                  </div>

                  {game === g.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-b-xl"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedView === "matches" && (
            <>
              {/* Filtros de tiempo */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Período de Tiempo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {TIMEFRAMES.map((t, index) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeframe(t.id)}
                      className={`group relative overflow-hidden px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                        timeframe === t.id
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25"
                          : "bg-gray-800/50 text-white border-gray-600 hover:border-blue-500/50 hover:bg-gray-700/50"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      
                      <div className="relative z-10 text-center">
                        <div className="text-2xl mb-2">{t.emoji}</div>
                        <div className="font-bold text-base mb-1">{t.label}</div>
                        <div className={`text-xs ${timeframe === t.id ? 'text-blue-100' : 'text-gray-400'}`}>
                          {t.description}
                        </div>
                      </div>

                      {timeframe === t.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-b-xl"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros adicionales */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700 max-w-4xl mx-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">Filtros Avanzados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Liga</label>
                      <input
                        type="text"
                        placeholder="Buscar liga..."
                        value={filterLeague}
                        onChange={e => setFilterLeague(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Equipo</label>
                      <input
                        type="text"
                        placeholder="Buscar equipo..."
                        value={filterTeam}
                        onChange={e => setFilterTeam(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Todos</option>
                        <option value="live">En Vivo</option>
                        <option value="upcoming">Próximos</option>
                        <option value="finished">Finalizados</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partidos favoritos */}
              {favoriteList.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                    <Star filled={true} /> Partidos Favoritos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    {favoriteList.slice(0, 4).map((match, index) => (
                      <FeaturedMatch key={match.id} match={match} onToggleFavorite={setFavoriteMatches} favoriteMatches={favoriteMatches} />
                    ))}
                  </div>
                  {favoriteList.length > 4 && (
                    <div className="text-center mt-6">
                      <p className="text-gray-400">
                        Y {favoriteList.length - 4} partidos favoritos más...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de partidos */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">
                    Partidos {timeframe === "today" ? "de Hoy" : timeframe === "tomorrow" ? "de Mañana" : "de Esta Semana"}
                  </h3>
                  <div className="text-sm text-gray-400">
                    {filtered.length} partidos encontrados
                  </div>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <MatchSkeleton key={i} />
                    ))}
                  </div>
                ) : paginated.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    {paginated.map((match, index) => (
                      <FeaturedMatch key={match.id} match={match} onToggleFavorite={setFavoriteMatches} favoriteMatches={favoriteMatches} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 max-w-md mx-auto">
                      <div className="text-6xl mb-4">🎮</div>
                      <h3 className="text-xl font-bold text-white mb-2">No hay partidos</h3>
                      <p className="text-gray-400 mb-6">
                        No hay partidos que coincidan con los filtros seleccionados.
                      </p>
                    </div>
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl bg-gray-800 text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                            page === pageNum 
                              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' 
                              : 'bg-gray-800 text-white hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl bg-gray-800 text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {selectedView === "tournaments" && (
            <>
              {/* Filtros específicos para torneos */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700 max-w-4xl mx-auto">
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">Filtros de Torneos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Liga/Torneo</label>
                      <input
                        type="text"
                        placeholder="Buscar torneo o liga..."
                        value={filterLeague}
                        onChange={e => setFilterLeague(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Todos los estados</option>
                        <option value="live">En curso</option>
                        <option value="upcoming">Próximos</option>
                        <option value="finished">Finalizados</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de torneos */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  🏆 Torneos de {GAMES.find(g => g.id === game)?.name}
                </h3>
                
                {loadingTournaments ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TournamentSkeleton key={i} />
                    ))}
                  </div>
                ) : tournaments.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                      {tournaments
                        .filter(tournament => {
                          if (filterLeague) {
                            return tournament.league.toLowerCase().includes(filterLeague.toLowerCase()) ||
                                   tournament.name.toLowerCase().includes(filterLeague.toLowerCase());
                          }
                          return true;
                        })
                        .filter(tournament => {
                          if (filterStatus) {
                            const now = Date.now() / 1000;
                            const isLive = tournament.begin_at && tournament.begin_at <= now && (!tournament.end_at || tournament.end_at > now);
                            const isUpcoming = tournament.begin_at && tournament.begin_at > now;
                            const isFinished = tournament.end_at && tournament.end_at < now;
                            
                            if (filterStatus === "live") return isLive;
                            if (filterStatus === "upcoming") return isUpcoming;
                            if (filterStatus === "finished") return isFinished;
                          }
                          return true;
                        })
                        .map((tournament, index) => (
                          <TournamentCard key={tournament.id} tournament={tournament} game={GAMES.find(g => g.id === game)} />
                        ))}
                    </div>
                    
                    {/* Información adicional de torneos */}
                    <div className="mt-12 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-8 border border-purple-500/30 max-w-4xl mx-auto">
                      <h4 className="text-xl font-bold text-white mb-6 text-center">📊 Estadísticas de Torneos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center bg-black/20 rounded-xl p-4">
                          <div className="text-2xl font-bold text-purple-400">{tournaments.length}</div>
                          <div className="text-sm text-gray-400">Total</div>
                        </div>
                        <div className="text-center bg-black/20 rounded-xl p-4">
                          <div className="text-2xl font-bold text-green-400">
                            {tournaments.filter(t => {
                              const now = Date.now() / 1000;
                              return t.begin_at && t.begin_at <= now && (!t.end_at || t.end_at > now);
                            }).length}
                          </div>
                          <div className="text-sm text-gray-400">En Curso</div>
                        </div>
                        <div className="text-center bg-black/20 rounded-xl p-4">
                          <div className="text-2xl font-bold text-blue-400">
                            {tournaments.filter(t => t.begin_at && t.begin_at > Date.now() / 1000).length}
                          </div>
                          <div className="text-sm text-gray-400">Próximos</div>
                        </div>
                        <div className="text-center bg-black/20 rounded-xl p-4">
                          <div className="text-2xl font-bold text-yellow-400">
                            {tournaments.filter(t => t.prizepool && t.prizepool.toLowerCase() !== 'tbd').length}
                          </div>
                          <div className="text-sm text-gray-400">Con Premio</div>
                        </div>
                      </div>
                      
                      {/* Acciones rápidas */}
                      <div className="flex flex-wrap justify-center gap-4">
                        <button
                          onClick={() => setSelectedView("matches")}
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                          🎯 Ver Partidos
                        </button>
                        <button
                          onClick={() => {
                            setFilterLeague("");
                            setFilterStatus("live");
                          }}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                          🔴 Solo En Vivo
                        </button>
                        <button
                          onClick={() => {
                            setFilterLeague("");
                            setFilterStatus("upcoming");
                          }}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                          ⏰ Próximos
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 max-w-md mx-auto">
                      <div className="text-6xl mb-4">🏆</div>
                      <h3 className="text-xl font-bold text-white mb-2">No hay torneos disponibles</h3>
                      <p className="text-gray-400 mb-6">
                        No hay torneos que coincidan con los filtros seleccionados para {GAMES.find(g => g.id === game)?.name}.
                      </p>
                      <button
                        onClick={() => {
                          setFilterLeague("");
                          setFilterStatus("");
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        Limpiar Filtros
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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
}

export default function EsportsPage() {
  return (
    <Suspense fallback={null}>
      <EsportsPageContent />
    </Suspense>
  );
}
