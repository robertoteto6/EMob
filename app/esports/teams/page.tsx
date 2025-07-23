"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import ChatBot from "../../components/ChatBot";
import { TeamSkeleton } from "../../components/Skeleton";
import LiveScoreTicker from "../../components/LiveScoreTicker";
import NotificationSystem, { useNotifications } from "../../components/NotificationSystem";

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

interface Team {
  id: number;
  name: string;
  acronym: string;
  image_url: string | null;
  current_videogame: {
    id: number;
    name: string;
    slug: string;
  } | null;
  players: number;
  modified_at: string;
}

const GAMES = [
  { id: "dota2", name: "Dota 2", icon: "/dota2.svg", color: "#A970FF", gradient: "from-purple-600 to-purple-800" },
  { id: "lol", name: "League of Legends", icon: "/leagueoflegends.svg", color: "#1E90FF", gradient: "from-blue-600 to-blue-800" },
  { id: "csgo", name: "Counter-Strike 2", icon: "/counterstrike.svg", color: "#FFD700", gradient: "from-yellow-600 to-yellow-800" },
  { id: "r6siege", name: "Rainbow Six Siege", icon: "/ubisoft.svg", color: "#00CFFF", gradient: "from-cyan-600 to-cyan-800" },
];

async function fetchTeams(game: string, search?: string): Promise<Team[]> {
  try {
    const params = new URLSearchParams();
    params.set("game", game);
    if (search) params.set("search", search);
    
    console.log(`Fetching teams for game: ${game}, search: ${search || 'none'}`);
    
    const res = await fetch(`/api/esports/teams?${params.toString()}`, {
      cache: "no-store",
    });
    
    console.log(`API response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch teams: ${res.status} - ${errorText}`);
      return [];
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} teams for ${game}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error in fetchTeams:", error);
    return [];
  }
}

// Componente de tarjeta de equipo
function TeamCard({ team, onToggleFavorite, favoriteTeams }: { 
  team: Team; 
  onToggleFavorite: React.Dispatch<React.SetStateAction<number[]>>; 
  favoriteTeams: number[];
}) {
  const isFavorite = favoriteTeams.includes(team.id);
  
  return (
    <Link href={`/esports/team/${team.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Header del equipo */}
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Logo del equipo */}
              <div className="relative">
                {team.image_url ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                    <img 
                      src={team.image_url} 
                      alt={team.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {team.acronym || team.name.charAt(0)}
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                    {team.acronym || team.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors duration-300 line-clamp-1">
                  {team.name}
                </h3>
                {team.acronym && (
                  <p className="text-sm text-gray-400 font-medium">{team.acronym}</p>
                )}
              </div>
            </div>
            
            {/* Botón de favorito */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(prev => 
                  prev.includes(team.id) 
                    ? prev.filter(id => id !== team.id)
                    : [...prev, team.id]
                );
              }}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-yellow-400 transition-all duration-300"
            >
              <Star filled={isFavorite} />
            </button>
          </div>
          
          {/* Información del equipo */}
          <div className="space-y-3">
            {/* Juego actual */}
            {team.current_videogame && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400 font-medium">
                  {team.current_videogame.name}
                </span>
              </div>
            )}
            
            {/* Información de jugadores */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
                <span className="text-gray-400">
                  {team.players > 0 ? `${team.players} jugadores` : 'Jugadores N/A'}
                </span>
              </div>
              
              {/* Última actualización */}
              <div className="text-xs text-gray-500">
                {new Date(team.modified_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short"
                })}
              </div>
            </div>
          </div>
          
          {/* Footer con acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
            <div className="text-left">
              <span className="text-xs text-gray-400">ID: {team.id}</span>
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

function TeamsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Obtener el juego de los parámetros de URL o usar dota2 por defecto
  const [game, setGame] = useState<string>(() => {
    return searchParams?.get('game') || GAMES[0].id;
  });
  
  // Función para cambiar el juego y actualizar la URL
  const handleGameChange = (newGame: string) => {
    setGame(newGame);
    const params = new URLSearchParams(searchParams?.toString());
    params.set('game', newGame);
    router.push(`/esports/teams?${params.toString()}`);
  };

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  
  // Sistemas
  const notificationSystem = useNotifications();
  
  // Favoritos: ids de equipos favoritos
  const [favoriteTeams, setFavoriteTeams] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("favoriteTeams") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });
  
  // Paginación
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [game, debouncedSearch]);

  // Cargar equipos
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchTeams(game, debouncedSearch);
      setTeams(data);
      setLoading(false);
    }
    load();
  }, [game, debouncedSearch]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favoriteTeams", JSON.stringify(favoriteTeams));
    }
  }, [favoriteTeams]);

  // Filtrado y paginación
  const paginatedTeams = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return teams.slice(start, start + PAGE_SIZE);
  }, [teams, page]);

  const totalPages = Math.ceil(teams.length / PAGE_SIZE);

  const favoriteList = useMemo(
    () => teams.filter((t) => favoriteTeams.includes(t.id)),
    [teams, favoriteTeams]
  );

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: teams.length,
      favoritos: favoriteList.length,
      conJugadores: teams.filter(t => t.players > 0).length,
      juegos: Array.from(new Set(teams.map(t => t.current_videogame?.name).filter(Boolean))).length,
    };
  }, [teams, favoriteList]);

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <LiveScoreTicker currentGame={game} />
      
      <main className="min-h-screen bg-black text-white pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                🏆 Equipos de Esports
              </h1>
              <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
                Descubre los mejores equipos, sigue a tus favoritos y explora el mundo competitivo
              </p>
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-green-400">{stats.total}</div>
                  <div className="text-sm text-gray-400">Equipos</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-yellow-400">{stats.favoritos}</div>
                  <div className="text-sm text-gray-400">Favoritos</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400">{stats.conJugadores}</div>
                  <div className="text-sm text-gray-400">Con Jugadores</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-purple-400">{stats.juegos}</div>
                  <div className="text-sm text-gray-400">Juegos</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-8">
          {/* Filtros de juegos */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Seleccionar Juego</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
                      <img 
                        src={g.icon} 
                        alt={g.name} 
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

          {/* Barra de búsqueda */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Buscar Equipos</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre de equipo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-12 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Equipos favoritos */}
          {favoriteList.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Star filled={true} /> Equipos Favoritos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {favoriteList.slice(0, 6).map((team) => (
                  <TeamCard key={team.id} team={team} onToggleFavorite={setFavoriteTeams} favoriteTeams={favoriteTeams} />
                ))}
              </div>
              {favoriteList.length > 6 && (
                <div className="text-center mt-6">
                  <p className="text-gray-400">
                    Y {favoriteList.length - 6} equipos favoritos más...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista de equipos */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Equipos de {GAMES.find(g => g.id === game)?.name}
              </h3>
              <div className="text-sm text-gray-400">
                {teams.length} equipos encontrados
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TeamSkeleton key={i} />
                ))}
              </div>
            ) : paginatedTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {paginatedTeams.map((team) => (
                  <TeamCard key={team.id} team={team} onToggleFavorite={setFavoriteTeams} favoriteTeams={favoriteTeams} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 max-w-md mx-auto">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold text-white mb-2">No hay equipos</h3>
                  <p className="text-gray-400 mb-6">
                    No se encontraron equipos que coincidan con los criterios de búsqueda.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setDebouncedSearch("");
                    }}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Limpiar Búsqueda
                  </button>
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

          {/* Información adicional */}
          <div className="mt-12 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-2xl p-8 border border-green-500/30 max-w-4xl mx-auto">
            <h4 className="text-xl font-bold text-white mb-6 text-center">🎮 Explora Más</h4>
            
            {/* Acciones rápidas */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/esports"
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
              >
                🎯 Ver Partidos
              </Link>
              <Link
                href="/esports/players"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
              >
                👥 Ver Jugadores
              </Link>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setGame(GAMES[0].id);
                  setPage(1);
                }}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
              >
                🔄 Reiniciar Filtros
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Sistemas adicionales */}
      <NotificationSystem
        notifications={notificationSystem.notifications}
        onMarkAsRead={notificationSystem.markAsRead}
        onClearAll={notificationSystem.clearAll}
        onDeleteNotification={notificationSystem.deleteNotification}
      />
      
      <ChatBot />
    </>
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={null}>
      <TeamsPageContent />
    </Suspense>
  );
}
