"use client";

import { useEffect, useState, use } from "react";
import nextDynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "../../../components/Header";
import { useNotifications } from "../../../hooks/useNotifications";
import { useDeferredClientRender } from "../../../hooks/useDeferredClientRender";

const NotificationSystem = nextDynamic(() => import("../../../components/NotificationSystem"), {
  ssr: false,
});

const ChatBot = nextDynamic(() => import("../../../components/ChatBot"), {
  ssr: false,
  loading: () => null,
});

// Interfaces
interface Match {
  id: number;
  team1: string;
  team2: string;
  team1_score: number;
  team2_score: number;
  start_time: number;
  league: string;
  team1_win: boolean | null;
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

interface Player {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  nationality: string | null;
  current_team: any;
  title_score?: number;
}

interface Team {
  id: number;
  name: string;
  acronym: string | null;
  slug: string;
  image_url: string | null;
  location: string | null;
  current_roster?: Player[];
}

const GAMES = [
  { id: "dota2", name: "Dota 2", icon: "/dota2.svg", color: "#A970FF", gradient: "from-purple-600 to-purple-800", description: "El MOBA más competitivo del mundo" },
  { id: "lol", name: "League of Legends", icon: "/leagueoflegends.svg", color: "#1E90FF", gradient: "from-blue-600 to-blue-800", description: "El juego más popular de esports" },
  { id: "csgo", name: "Counter-Strike 2", icon: "/counterstrike.svg", color: "#FFD700", gradient: "from-yellow-600 to-yellow-800", description: "El FPS táctico por excelencia" },
  { id: "r6siege", name: "Rainbow Six Siege", icon: "/rainbow6siege.png", color: "#FF6B35", gradient: "from-orange-600 to-orange-800", description: "Combate táctico intenso" },
  { id: "overwatch", name: "Overwatch 2", icon: "/overwatch.svg", color: "#FF9500", gradient: "from-orange-500 to-orange-700", description: "Acción de héroes en equipo" },
];

// Componente de estadísticas principales
function GameOverview({ game, matches, tournaments, teams, players }: {
  game: typeof GAMES[0];
  matches: Match[];
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
}) {
  const now = Date.now() / 1000;
  const liveMatches = matches.filter(m => m.start_time <= now && m.team1_win === null);
  const upcomingMatches = matches.filter(m => m.start_time > now);
  const activeTournaments = tournaments.filter(t => {
    if (!t.begin_at) return false;
    const started = t.begin_at <= now;
    const ended = t.end_at && t.end_at < now;
    return started && !ended;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {/* Partidos en vivo */}
      <div className="bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-white">En Vivo</h3>
        </div>
        <p className="text-4xl font-bold text-red-400 mb-2">{liveMatches.length}</p>
        <p className="text-sm text-red-300">Partidos activos</p>
      </div>

      {/* Próximos partidos */}
      <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-2xl p-6 border border-blue-500/30">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-bold text-white">Próximos</h3>
        </div>
        <p className="text-4xl font-bold text-blue-400 mb-2">{upcomingMatches.length}</p>
        <p className="text-sm text-blue-300">En las próximas horas</p>
      </div>

      {/* Torneos activos */}
      <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-2xl p-6 border border-yellow-500/30">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-bold text-white">Torneos</h3>
        </div>
        <p className="text-4xl font-bold text-yellow-400 mb-2">{activeTournaments.length}</p>
        <p className="text-sm text-yellow-300">Activos ahora</p>
      </div>

      {/* Total de equipos */}
      <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-2xl p-6 border border-green-500/30">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <h3 className="text-lg font-bold text-white">Equipos</h3>
        </div>
        <p className="text-4xl font-bold text-green-400 mb-2">{teams.length}+</p>
        <p className="text-sm text-green-300">Equipos profesionales</p>
      </div>
    </div>
  );
}

// Componente de partido compacto
function CompactMatch({ match }: { match: Match }) {
  const now = Date.now() / 1000;
  const isLive = match.start_time <= now && match.team1_win === null;
  const isUpcoming = match.start_time > now;

  return (
    <Link href={`/esports/${match.id}`}>
      <div className="group bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02]">
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">{match.league}</span>
          {isLive && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              🔴 VIVO
            </span>
          )}
          {isUpcoming && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              📅 {new Date(match.start_time * 1000).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="font-semibold text-white group-hover:text-green-400 transition-colors duration-300 truncate">
              {match.team1}
            </p>
            {typeof match.team1_score === "number" && (
              <p className="text-2xl font-bold text-green-400 mt-1">{match.team1_score}</p>
            )}
          </div>
          
          <div className="px-3">
            <span className="text-gray-400 font-bold">VS</span>
          </div>
          
          <div className="flex-1 text-center">
            <p className="font-semibold text-white group-hover:text-green-400 transition-colors duration-300 truncate">
              {match.team2}
            </p>
            {typeof match.team2_score === "number" && (
              <p className="text-2xl font-bold text-green-400 mt-1">{match.team2_score}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Componente de torneo compacto
function CompactTournament({ tournament }: { tournament: Tournament }) {
  return (
    <Link href={`/esports/tournament/${tournament.id}`}>
      <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">{tournament.league}</span>
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            ACTIVO
          </span>
        </div>
        
        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors duration-300 mb-2 line-clamp-2">
          {tournament.name}
        </h4>
        
        {tournament.prizepool && (
          <div className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-1 rounded-lg inline-block">
            💰 {tournament.prizepool}
          </div>
        )}
      </div>
    </Link>
  );
}

// Componente de equipo compacto
function CompactTeam({ team }: { team: Team }) {
  return (
    <Link href={`/esports/team/${team.id}`}>
      <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center gap-3 mb-3">
          {team.image_url ? (
            <Image
              src={team.image_url}
              alt={team.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-cover bg-gray-600"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-gray-300">
                {team.acronym || team.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors duration-300 truncate">
              {team.name}
            </h4>
            {team.location && (
              <p className="text-xs text-gray-400">{team.location}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Componente de jugador compacto
function CompactPlayer({ player }: { player: Player }) {
  return (
    <Link href={`/esports/player/${player.id}`}>
      <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-center gap-3">
          {player.image_url ? (
            <Image
              src={player.image_url}
              alt={player.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover bg-gray-600"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-gray-300">
                {player.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-bold text-white group-hover:text-green-400 transition-colors duration-300 truncate">
              {player.name}
            </h4>
            <p className="text-xs text-gray-400">
              {player.current_team?.name || player.role || "Jugador"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Componente principal de la página del juego
function GamePageContent({ gameId }: { gameId: string }) {
  const [data, setData] = useState<{
    matches: Match[];
    tournaments: Tournament[];
    teams: Team[];
    players: Player[];
  }>({ matches: [], tournaments: [], teams: [], players: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clientExtrasReady = useDeferredClientRender(400);
  const notificationSystem = useNotifications({ enabled: clientExtrasReady });
  const router = useRouter();

  const game = GAMES.find(g => g.id === gameId);

  useEffect(() => {
    if (!game) {
      router.push('/esports');
      return;
    }

    let isMounted = true;

    async function loadData() {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Usar datos de fallback si hay problemas con la API
        const fallbackData = {
          matches: [],
          tournaments: [],
          teams: [
            { id: 1, name: "Team Liquid", acronym: "TL", slug: "team-liquid", image_url: null, location: "Netherlands" },
            { id: 2, name: "Evil Geniuses", acronym: "EG", slug: "evil-geniuses", image_url: null, location: "United States" },
            { id: 3, name: "OG", acronym: "OG", slug: "og", image_url: null, location: "Europe" },
          ],
          players: [
            { id: 1, name: "Miracle-", slug: "miracle", image_url: null, first_name: "Amer", last_name: "Al-Barkawi", role: "Core", nationality: "JO", current_team: { name: "Team Liquid" } },
            { id: 2, name: "Arteezy", slug: "arteezy", image_url: null, first_name: "Artour", last_name: "Babaev", role: "Core", nationality: "CA", current_team: { name: "Evil Geniuses" } },
          ]
        };

        // Intentar cargar datos reales con rate limiting
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Cargar matches
        try {
          await delay(200);
          const matchesRes = await fetch(`/api/esports/matches?game=${gameId}`, { 
            cache: "force-cache",
            next: { revalidate: 300 }
          });
          if (matchesRes.ok) {
            const matchesData = await matchesRes.json();
            if (isMounted) {
              fallbackData.matches = matchesData.slice(0, 10).map((m: any) => {
                const team1 = m.opponents?.[0]?.opponent;
                const team2 = m.opponents?.[1]?.opponent;
                const dateStr = m.begin_at ?? m.scheduled_at;
                const date = dateStr ? new Date(dateStr) : null;
                const start_time = date && !isNaN(date.getTime()) ? date.getTime() / 1000 : Date.now() / 1000;
                
                return {
                  id: m.id,
                  team1: team1?.name ?? "TBD",
                  team2: team2?.name ?? "TBD",
                  team1_score: m.results?.[0]?.score ?? null,
                  team2_score: m.results?.[1]?.score ?? null,
                  start_time,
                  league: m.league?.name ?? "",
                  team1_win: m.winner?.id === team1?.id ? true : m.winner?.id === team2?.id ? false : null,
                  game: gameId,
                };
              });
            }
          }
        } catch (err) {
          console.error('Error loading matches:', err);
        }

        // Cargar tournaments
        try {
          await delay(200);
          const tournamentsRes = await fetch(`/api/esports/tournaments?game=${gameId}`, { 
            cache: "force-cache",
            next: { revalidate: 300 }
          });
          if (tournamentsRes.ok) {
            const tournamentsData = await tournamentsRes.json();
            if (isMounted) {
              fallbackData.tournaments = tournamentsData.slice(0, 8).map((t: any) => ({
                id: t.id,
                name: t.name ?? "Torneo",
                begin_at: t.begin_at ? new Date(t.begin_at).getTime() / 1000 : null,
                end_at: t.end_at ? new Date(t.end_at).getTime() / 1000 : null,
                league: t.league?.name ?? "",
                serie: t.serie?.full_name ?? "",
                prizepool: t.prizepool ?? null,
                tier: t.tier ?? null,
                region: t.region ?? null,
                live_supported: !!t.live_supported,
                game: gameId,
              }));
            }
          }
        } catch (err) {
          console.error('Error loading tournaments:', err);
        }

        if (isMounted) {
          setData(fallbackData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar los datos');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [gameId, game, router]);

  if (!game) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-64 mb-4"></div>
              <div className="h-32 bg-gray-700 rounded mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-4">Error al cargar</h2>
              <p className="text-gray-400 mb-8">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen pt-20">
        {/* Hero Section del Juego */}
        <section className={`relative overflow-hidden bg-gradient-to-br ${game.gradient} py-20`}>
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            {/* Breadcrumb */}
            <nav className="mb-8">
              <div className="flex items-center gap-2 text-sm">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">
                  Inicio
                </Link>
                <span className="text-gray-500">→</span>
                <Link href="/esports" className="text-gray-300 hover:text-white transition-colors duration-300">
                  Esports
                </Link>
                <span className="text-gray-500">→</span>
                <span className="text-white font-medium">{game.name}</span>
              </div>
            </nav>

            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <Image
                  src={game.icon}
                  alt={game.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-50"></div>
              </div>
              
              <div>
                <h1 className="text-5xl font-bold mb-3 text-white">
                  {game.name}
                </h1>
                <p className="text-xl text-white/80 mb-4">
                  {game.description}
                </p>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    🎮 Competitivo
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    🌍 Global
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                    💰 Profesional
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vista general */}
        <section className="container mx-auto px-6 py-12">
          <GameOverview 
            game={game}
            matches={data.matches}
            tournaments={data.tournaments}
            teams={data.teams}
            players={data.players}
          />
        </section>

        {/* Contenido principal */}
        <section className="container mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Partidos recientes y próximos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🏆 Partidos
                </h2>
                <Link 
                  href={`/esports?game=${game.id}`}
                  className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-300"
                >
                  Ver todos →
                </Link>
              </div>
              
              <div className="space-y-4">
                {data.matches.slice(0, 6).map((match, index) => (
                  <div 
                    key={match.id}
                    className="animate-fadein"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CompactMatch match={match} />
                  </div>
                ))}
                
                {data.matches.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📅</div>
                    <p>No hay partidos disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Torneos activos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  🏆 Torneos
                </h2>
                <Link 
                  href={`/esports?view=tournaments&game=${game.id}`}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300"
                >
                  Ver todos →
                </Link>
              </div>
              
              <div className="space-y-4">
                {data.tournaments.slice(0, 6).map((tournament, index) => (
                  <div 
                    key={tournament.id}
                    className="animate-fadein"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CompactTournament tournament={tournament} />
                  </div>
                ))}
                
                {data.tournaments.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">🏆</div>
                    <p>No hay torneos activos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Equipos y Jugadores */}
        <section className="container mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Equipos destacados */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  👥 Equipos
                </h2>
                <Link 
                  href={`/esports/teams?game=${game.id}`}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors duration-300"
                >
                  Ver todos →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.teams.slice(0, 6).map((team, index) => (
                  <div 
                    key={team.id}
                    className="animate-fadein"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CompactTeam team={team} />
                  </div>
                ))}
                
                {data.teams.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No hay equipos disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Jugadores destacados */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  ⭐ Jugadores
                </h2>
                <Link 
                  href={`/esports/players?game=${game.id}`}
                  className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-300"
                >
                  Ver todos →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.players.slice(0, 6).map((player, index) => (
                  <div 
                    key={player.id}
                    className="animate-fadein"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CompactPlayer player={player} />
                  </div>
                ))}
                
                {data.players.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">⭐</div>
                    <p>No hay jugadores disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-6 pb-16">
          <div className={`bg-gradient-to-r ${game.gradient} rounded-2xl p-8 text-center`}>
            <h2 className="text-3xl font-bold mb-4">¿Quieres saber más sobre {game.name}?</h2>
            <p className="text-lg mb-6 opacity-90">
              Explora todos los partidos, equipos, jugadores y estadísticas detalladas
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href={`/esports?game=${game.id}`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Ver Todos los Partidos
              </Link>
              <Link 
                href={`/esports/teams?game=${game.id}`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Explorar Equipos
              </Link>
              <Link 
                href={`/esports/players?game=${game.id}`}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Ver Jugadores
              </Link>
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
    </>
  );
}

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  
  return <GamePageContent gameId={gameId} />;
}
