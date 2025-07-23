"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import ChatBot from "../../components/ChatBot";
import { PlayerSkeleton } from "../../components/Skeleton";
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

interface Player {
  id: number;
  name: string;
  image_url: string | null;
}

const GAMES = [
  { id: "dota2", name: "Dota 2", icon: "/dota2.svg", color: "#A970FF", gradient: "from-purple-600 to-purple-800" },
  { id: "lol", name: "League of Legends", icon: "/leagueoflegends.svg", color: "#1E90FF", gradient: "from-blue-600 to-blue-800" },
  { id: "csgo", name: "Counter-Strike 2", icon: "/counterstrike.svg", color: "#FFD700", gradient: "from-yellow-600 to-yellow-800" },
  { id: "r6siege", name: "Rainbow Six Siege", icon: "/ubisoft.svg", color: "#00CFFF", gradient: "from-cyan-600 to-cyan-800" },
];

async function fetchPlayers(game: string, search?: string): Promise<Player[]> {
  try {
    const params = new URLSearchParams();
    params.set("game", game);
    if (search) params.set("q", search);
    
    console.log(`Fetching players for game: ${game}, search: ${search || 'none'}`);
    
    const res = await fetch(`/api/esports/players?${params.toString()}`, {
      cache: "no-store",
    });
    
    console.log(`API response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch players: ${res.status} - ${errorText}`);
      return [];
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} players for ${game}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error in fetchPlayers:", error);
    return [];
  }
}

// Componente de tarjeta de jugador
function PlayerCard({ player, onToggleFavorite, favoritePlayers }: { 
  player: Player; 
  onToggleFavorite: React.Dispatch<React.SetStateAction<number[]>>; 
  favoritePlayers: number[];
}) {
  const isFavorite = favoritePlayers.includes(player.id);
  
  return (
    <Link href={`/esports/player/${player.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Header del jugador */}
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar/Foto del jugador */}
              <div className="relative">
                {player.image_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                    <img 
                      src={player.image_url} 
                      alt={player.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform duration-300">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors duration-300 line-clamp-1">
                  {player.name}
                </h3>
                <p className="text-sm text-gray-400 font-medium">Jugador Profesional</p>
              </div>
            </div>
            
            {/* Botón de favorito */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(prev => 
                  prev.includes(player.id) 
                    ? prev.filter(id => id !== player.id)
                    : [...prev, player.id]
                );
              }}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-yellow-400 transition-all duration-300"
            >
              <Star filled={isFavorite} />
            </button>
          </div>
          
          {/* Información del jugador */}
          <div className="space-y-3">            
            {/* Estatus */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">
                Activo
              </span>
            </div>
            
            {/* Información básica */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400">
                  Pro Player
                </span>
              </div>
              
              {/* ID del jugador */}
              <div className="text-xs text-gray-500">
                ID: {player.id}
              </div>
            </div>
          </div>
          
          {/* Footer con acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
            <div className="text-left">
              <span className="text-xs text-gray-400">Ver Perfil</span>
            </div>
            
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-2 rounded-lg">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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

function PlayersPageContent() {
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
    router.push(`/esports/players?${params.toString()}`);
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  
  // Sistemas
  const notificationSystem = useNotifications();
  
  // Favoritos: ids de jugadores favoritos
  const [favoritePlayers, setFavoritePlayers] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("favoritePlayers") || "[]");
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

  // Cargar jugadores
  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchPlayers(game, debouncedSearch);
      setPlayers(data);
      setLoading(false);
    }
    load();
  }, [game, debouncedSearch]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favoritePlayers", JSON.stringify(favoritePlayers));
    }
  }, [favoritePlayers]);

  // Filtrado y paginación
  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return players.slice(start, start + PAGE_SIZE);
  }, [players, page]);

  const totalPages = Math.ceil(players.length / PAGE_SIZE);

  const favoriteList = useMemo(
    () => players.filter((p) => favoritePlayers.includes(p.id)),
    [players, favoritePlayers]
  );

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: players.length,
      favoritos: favoriteList.length,
      conFoto: players.filter(p => p.image_url).length,
      juego: GAMES.find(g => g.id === game)?.name || game,
    };
  }, [players, favoriteList, game]);

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
                👥 Jugadores Pro
              </h1>
              <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
                Descubre los mejores jugadores profesionales de esports del mundo
              </p>
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-green-400">{stats.total}</div>
                  <div className="text-sm text-gray-400">Jugadores</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-yellow-400">{stats.favoritos}</div>
                  <div className="text-sm text-gray-400">Favoritos</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400">{stats.conFoto}</div>
                  <div className="text-sm text-gray-400">Con Foto</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-purple-400">{stats.juego}</div>
                  <div className="text-sm text-gray-400">Juego</div>
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
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Buscar Jugadores</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre de jugador..."
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

          {/* Jugadores favoritos */}
          {favoriteList.length > 0 && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <Star filled={true} /> Jugadores Favoritos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {favoriteList.slice(0, 6).map((player) => (
                  <PlayerCard key={player.id} player={player} onToggleFavorite={setFavoritePlayers} favoritePlayers={favoritePlayers} />
                ))}
              </div>
              {favoriteList.length > 6 && (
                <div className="text-center mt-6">
                  <p className="text-gray-400">
                    Y {favoriteList.length - 6} jugadores favoritos más...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Lista de jugadores */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Jugadores de {GAMES.find(g => g.id === game)?.name}
              </h3>
              <div className="text-sm text-gray-400">
                {players.length} jugadores encontrados
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PlayerSkeleton key={i} />
                ))}
              </div>
            ) : paginatedPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {paginatedPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} onToggleFavorite={setFavoritePlayers} favoritePlayers={favoritePlayers} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 max-w-md mx-auto">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-white mb-2">No hay jugadores</h3>
                  <p className="text-gray-400 mb-6">
                    No se encontraron jugadores que coincidan con los criterios de búsqueda.
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
                href="/esports/teams"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
              >
                🏆 Ver Equipos
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

export default function PlayersPage() {
  return (
    <Suspense fallback={null}>
      <PlayersPageContent />
    </Suspense>
  );
}
