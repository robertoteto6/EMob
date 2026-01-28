"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import nextDynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { TeamSkeleton, PlayerSkeleton } from "../../../components/Skeleton";
import { useNotifications } from "../../../hooks/useNotifications";
import { useDeferredClientRender } from "../../../hooks/useDeferredClientRender";
import { getPlayerImageUrl, getTeamImageUrl } from "../../../lib/imageFallback";

const NotificationSystem = nextDynamic(() => import("../../../components/NotificationSystem"), {
  ssr: false,
});

const ChatBot = nextDynamic(() => import("../../../components/ChatBot"), {
  ssr: false,
  loading: () => null,
});

// Icono de favorito (estrella)
function Star({ filled, ...props }: { filled: boolean;[key: string]: any }) {
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

// Componente de ubicación
function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

// Componente de usuarios/miembros
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}

// Componente de gloria/puntuación
function GloryMeter({ score, maxScore = 50 }: { score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const level = score >= 30 ? "Leyenda" : score >= 20 ? "Élite" : score >= 10 ? "Veterano" : score >= 5 ? "Competitivo" : "Emergente";

  const getGloryColor = (score: number) => {
    if (score >= 30) return "from-yellow-400 to-orange-500";
    if (score >= 20) return "from-purple-400 to-pink-500";
    if (score >= 10) return "from-blue-400 to-cyan-500";
    if (score >= 5) return "from-green-400 to-emerald-500";
    return "from-gray-400 to-gray-500";
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white">Gloria del Equipo</span>
        <span className={`text-xs font-bold bg-gradient-to-r ${getGloryColor(score)} bg-clip-text text-transparent`}>
          {level}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${getGloryColor(score)} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-center">
        <span className="text-xs font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400"> pts</span>
      </div>
    </div>
  );
}

interface Player {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  image_url: string | null;
}

interface TeamDetail {
  id: number;
  name: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
  players: Player[];
  current_videogame?: {
    slug: string;
    name: string;
  };
}

// Interfaces extendidas para la nueva UI
interface Match {
  id: number;
  opponent: string;
  opponent_logo?: string;
  result?: string; // "W", "L", "D"
  score?: string; // "2-1"
  date: string; // ISO date
  tournament: string;
  status: "upcoming" | "live" | "finished";
}

interface Tournament {
  id: number;
  name: string;
  tier: string; // "S", "A", "B", "C"
  placement?: string; // "1st", "3rd-4th"
  date: string;
  prizepool?: string;
}

async function fetchTeam(id: string): Promise<TeamDetail | null> {
  const res = await fetch(`/api/esports/team/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as TeamDetail;
}

// Simulamos datos adicionales que la API actual podría no devolver
async function fetchTeamMatches(teamId: string): Promise<Match[]> {
  // Simulacion de delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Datos mockeados para demo
  const now = new Date();
  return [
    {
      id: 101,
      opponent: "FNATIC",
      date: new Date(now.getTime() + 86400000 * 2).toISOString(),
      tournament: "LEC Winter 2026",
      status: "upcoming"
    },
    {
      id: 102,
      opponent: "G2 Esports",
      date: new Date(now.getTime() - 86400000 * 3).toISOString(),
      tournament: "LEC Winter 2026",
      status: "finished",
      result: "L",
      score: "0-1"
    },
    {
      id: 103,
      opponent: "MAD Lions",
      date: new Date(now.getTime() - 86400000 * 5).toISOString(),
      tournament: "LEC Winter 2026",
      status: "finished",
      result: "W",
      score: "1-0"
    }
  ];
}

async function fetchTeamTournaments(teamId: string): Promise<Tournament[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    {
      id: 201,
      name: "LEC Winter 2026",
      tier: "S",
      date: "2026-01-10",
      prizepool: "$80,000"
    },
    {
      id: 202,
      name: "Worlds 2025",
      tier: "S",
      placement: "Top 8",
      date: "2025-10-01",
      prizepool: "$2,225,000"
    }
  ];
}

// Componente Hero del Equipo
function TeamHero({
  team,
  isFavorite,
  toggleFavorite,
  teamScore
}: {
  team: TeamDetail;
  isFavorite: boolean;
  toggleFavorite: () => void;
  teamScore: number;
}) {
  const [logoError, setLogoError] = useState(false);
  const teamLogoSrc = getTeamImageUrl(team);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
        <div className="w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 p-8 sm:p-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Logo Section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-500"></div>
            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gray-900 rounded-full flex items-center justify-center border-4 border-gray-800 overflow-hidden">
              {!logoError ? (
                <Image
                  src={teamLogoSrc}
                  alt={team.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <UsersIcon className="w-16 h-16 text-gray-600" />
              )}
            </div>
            {/* Rank Badge */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-gray-900 shadow-lg">
              #{Math.floor((team.id % 20) + 1)} World
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase transform -skew-x-6">
                  {team.name}
                </h1>
                {team.acronym && (
                  <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm font-mono text-gray-400">
                    [{team.acronym}]
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-400">
                {team.location && (
                  <div className="flex items-center gap-2">
                    <LocationIcon className="w-4 h-4 text-gray-500" />
                    <span>{team.location}</span>
                  </div>
                )}
                {team.current_videogame && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-gray-800 rounded">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-gray-300">{team.current_videogame.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all duration-300 ${isFavorite
                  ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 hover:bg-yellow-500/20'
                  : 'bg-white text-black hover:bg-gray-200'
                  }`}
              >
                <Star filled={isFavorite} className={isFavorite ? "text-yellow-500" : "text-black"} />
                {isFavorite ? 'Siguiendo' : 'Seguir Equipo'}
              </button>
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg px-4 py-2">
                <span className="block text-xs text-gray-500 uppercase font-bold">Win Rate</span>
                <span className="text-green-400 font-mono font-bold">{(50 + (team.id % 30)).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Glory Meter (Moved to right on desktop) */}
          <div className="w-full md:w-64">
            <GloryMeter score={teamScore} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamTabs({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const tabs = [
    { id: "overview", label: "Resumen" },
    { id: "matches", label: "Partidos" },
    { id: "tournaments", label: "Torneos" },
    { id: "roster", label: "Plantilla" },
  ];

  return (
    <div className="flex overflow-x-auto gap-2 mb-8 border-b border-gray-800 pb-1 scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all duration-300 whitespace-nowrap relative ${activeTab === tab.id
            ? "text-white bg-gray-800/50 border-b-2 border-green-500"
            : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
            }`}
        >
          {activeTab === tab.id && (
            <span className="absolute inset-x-0 bottom-0 h-px bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function MatchesTab({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return <div className="text-center py-12 text-gray-500">No hay partidos registrados.</div>;
  }

  return (
    <div className="space-y-4">
      {matches.map(match => (
        <div key={match.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between hover:border-gray-700 transition-colors group">
          {/* Date & Tournament */}
          <div className="flex flex-col md:w-48 mb-4 md:mb-0">
            <span className="text-sm font-bold text-gray-300">{match.tournament}</span>
            <span className="text-xs text-gray-500">
              {new Date(match.date).toLocaleDateString("es-ES", { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Matchup */}
          <div className="flex-1 flex items-center justify-center gap-6 md:gap-12">
            <div className="text-right flex-1">
              <span className="font-bold text-white md:text-lg">TU EQUIPO</span>
            </div>

            <div className="px-4 py-1 bg-gray-800 rounded text-sm font-mono font-bold text-gray-300 min-w-[80px] text-center border border-gray-700">
              {match.status === 'upcoming' ? 'VS' : match.score}
            </div>

            <div className="text-left flex-1">
              <span className="font-bold text-gray-400 group-hover:text-white transition-colors">{match.opponent}</span>
            </div>
          </div>

          {/* Status/Result */}
          <div className="md:w-32 flex justify-end mt-4 md:mt-0">
            {match.status === 'upcoming' ? (
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20">
                PRÓXIMO
              </span>
            ) : match.result === 'W' ? (
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                VICTORIA
              </span>
            ) : match.result === 'D' ? (
              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/20">
                EMPATE
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-full border border-red-500/20">
                DERROTA
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentsTab({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) {
    return <div className="text-center py-12 text-gray-500">No hay torneos registrados.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tournaments.map(tournament => (
        <div key={tournament.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-900/10 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${tournament.tier === 'S' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-700 text-gray-400'}`}>
                Tier {tournament.tier}
              </span>
              <h3 className="text-xl font-bold text-white mt-2 group-hover:text-purple-400 transition-colors">{tournament.name}</h3>
            </div>
            {tournament.placement && (
              <div className="text-right">
                <span className="block text-2xl font-black text-gray-200">{tournament.placement}</span>
                <span className="text-xs text-gray-500 uppercase">Posición</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-800">
            <span>{new Date(tournament.date).toLocaleDateString()}</span>
            <span className="text-green-400 font-mono">{tournament.prizepool}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamContent({ id }: { id: string }) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const clientExtrasReady = useDeferredClientRender(400);

  const {
    notifications,
    addNotification,
    markAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications({ enabled: clientExtrasReady });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Cargar todo en paralelo
        const [teamData, matchesData, tournamentsData] = await Promise.all([
          fetchTeam(id),
          fetchTeamMatches(id),
          fetchTeamTournaments(id)
        ]);

        setTeam(teamData);
        setMatches(matchesData);
        setTournaments(tournamentsData);

        // Verificar si está en favoritos
        const favorites = JSON.parse(localStorage.getItem('favoriteTeams') || '[]');
        setIsFavorite(favorites.includes(parseInt(id)));
      } catch (error) {
        console.error('Error loading team:', error);
        addNotification({
          title: "Error de carga",
          message: "Error al cargar los datos del equipo",
          type: "team_update",
          priority: "high"
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, addNotification]);

  const toggleFavorite = useCallback(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteTeams') || '[]');
    const teamId = parseInt(id);

    if (isFavorite) {
      const newFavorites = favorites.filter((fav: number) => fav !== teamId);
      localStorage.setItem('favoriteTeams', JSON.stringify(newFavorites));
      setIsFavorite(false);
      addNotification({
        title: "Equipo eliminado",
        message: `${team?.name} eliminado de favoritos`,
        type: "team_update",
        priority: "low"
      });
    } else {
      favorites.push(teamId);
      localStorage.setItem('favoriteTeams', JSON.stringify(favorites));
      setIsFavorite(true);
      addNotification({
        title: "Equipo añadido",
        message: `${team?.name} añadido a favoritos`,
        type: "team_update",
        priority: "low"
      });
    }
  }, [isFavorite, id, team?.name, addNotification]);

  const teamScore = useMemo(() => {
    if (!team) return 0;
    return Math.min(team.players.length * 3 + (team.id % 10), 50);
  }, [team]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 h-4 bg-gray-800 rounded w-20 animate-pulse"></div>
            <div className="bg-gray-800 rounded-2xl h-64 mb-8 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <PlayerSkeleton key={i} />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-12 bg-gray-800 rounded-2xl border border-gray-700">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Equipo no encontrado</h1>
          <Link href="/equipos" className="text-blue-400 hover:underline">Volver a equipos</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <main className="pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/equipos" className="hover:text-green-400 transition-colors">Equipos</Link>
            <span>/</span>
            <span className="text-white font-medium">{team.name}</span>
          </div>

          <TeamHero
            team={team}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
            teamScore={teamScore}
          />

          <TeamTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-12 animate-fadein">
                {/* Recent Matches Preview */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Resultados Recientes</h2>
                    <button onClick={() => setActiveTab('matches')} className="text-sm text-green-400 hover:text-green-300 font-bold">Ver todos →</button>
                  </div>
                  <MatchesTab matches={matches.slice(0, 3)} />
                </section>

                {/* Active Roster Preview */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Roster Activo</h2>
                    <button onClick={() => setActiveTab('roster')} className="text-sm text-green-400 hover:text-green-300 font-bold">Ver todos →</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {team.players.slice(0, 4).map((player, index) => (
                      <Link
                        key={player.id}
                        href={`/esports/player/${player.id}`}
                        className="group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-25 transition-opacity duration-500"></div>
                        <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-green-500/50 transition-all flex items-center gap-4">
                          <Image
                            src={getPlayerImageUrl({ id: player.id, name: player.name, image_url: player.image_url })}
                            alt={player.name}
                            width={56}
                            height={56}
                            className="w-14 h-14 object-cover rounded-full border-2 border-gray-700 group-hover:border-green-500 transition-colors"
                          />
                          <div>
                            <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">{player.name}</h3>
                            <p className="text-xs text-gray-500 uppercase font-bold">{player.role || 'Player'}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="animate-fadein">
                <MatchesTab matches={matches} />
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div className="animate-fadein">
                <TournamentsTab tournaments={tournaments} />
              </div>
            )}

            {activeTab === 'roster' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadein">
                {team.players.map((player) => (
                  <Link
                    key={player.id}
                    href={`/esports/player/${player.id}`}
                    className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-green-900/10 transition-all duration-500 hover:-translate-y-1"
                  >
                    <div className="h-24 bg-gradient-to-r from-gray-800 to-gray-900 relative">
                      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                    </div>
                    <div className="px-6 relative">
                      <div className="-mt-12 mb-4 relative inline-block">
                        <div className="absolute inset-0 bg-green-500 blur-md opacity-0 group-hover:opacity-50 transition-opacity rounded-full"></div>
                        <Image
                          src={getPlayerImageUrl({ id: player.id, name: player.name, image_url: player.image_url })}
                          alt={player.name}
                          width={96}
                          height={96}
                          className="w-24 h-24 object-cover rounded-full border-4 border-gray-900 relative z-10 bg-gray-800"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-green-400 transition-colors">{player.name}</h3>
                      <p className="text-sm text-gray-400 mb-6">
                        {[player.first_name, player.last_name].filter(Boolean).join(' ')}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {player.role && (
                          <span className="px-2 py-1 bg-gray-800 text-xs font-bold text-gray-300 rounded border border-gray-700">
                            {player.role}
                          </span>
                        )}
                        {player.nationality && (
                          <span className="px-2 py-1 bg-gray-800 text-xs font-bold text-gray-300 rounded border border-gray-700">
                            {player.nationality}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {clientExtrasReady && <ChatBot />}

      {clientExtrasReady && (
        <NotificationSystem
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onClearAll={clearAll}
          onDeleteNotification={deleteNotification}
        />
      )}
    </div>
  );
}

export default function TeamPage() {
  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return null;
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <main className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <TeamSkeleton />
          </div>
        </main>
      </div>
    }>
      <TeamContent id={id} />
    </Suspense>
  );
}
