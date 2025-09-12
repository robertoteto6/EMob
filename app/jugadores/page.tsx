"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import ChatBot from "../components/ChatBot";
import { PlayerSkeleton } from "../components/Skeleton";
import LiveScoreTicker from "../components/LiveScoreTicker";
import NotificationSystem, { useNotifications } from "../components/NotificationSystem";
import "./animations.css";

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
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  current_team: string | null;
  current_team_id: number | null;
  current_team_image: string | null;
  title_score: number;
  professional_status: string;
  tournaments_played: number;
  instagram_followers: number;
  instagram_handle: string | null;
}

const GAMES = [
  { id: "dota2", name: "Dota 2", icon: "/dota2.svg", color: "#A970FF", gradient: "from-purple-600 to-purple-800" },
  { id: "lol", name: "League of Legends", icon: "/leagueoflegends.svg", color: "#1E90FF", gradient: "from-blue-600 to-blue-800" },
  { id: "csgo", name: "Counter-Strike 2", icon: "/counterstrike.svg", color: "#FFD700", gradient: "from-yellow-600 to-yellow-800" },
  { id: "r6siege", name: "Rainbow Six Siege", icon: "/rainbow6siege.png", color: "#FF6600", gradient: "from-orange-600 to-orange-800" },
  { id: "overwatch", name: "Overwatch 2", icon: "/overwatch.svg", color: "#F99E1A", gradient: "from-orange-500 to-orange-700" },
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

// Componente de tarjeta de jugador mejorado
function PlayerCard({ player, onToggleFavorite, favoritePlayers }: { 
  player: Player; 
  onToggleFavorite: React.Dispatch<React.SetStateAction<number[]>>; 
  favoritePlayers: number[];
}) {
  const isFavorite = favoritePlayers.includes(player.id);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    // initialize with best guess; can be updated onError
    if (player.image_url) return player.image_url;
    if (player.current_team_image) return player.current_team_image;
    return `/api/esports/player/${player.id}/image`;
  });
  
  // Función para obtener la imagen del jugador con fallbacks mejorados
  const getPlayerImage = () => {
    if (player.image_url) {
      return player.image_url;
    }
    if (player.current_team_image) {
      return player.current_team_image;
    }
    // Usar nuestra API personalizada como fallback
    return `/api/esports/player/${player.id}/image`;
  };

  // Función para obtener el indicador de nivel de títulos
  const getTitleLevel = () => {
    if (player.title_score >= 150) return { level: "Leyenda", color: "from-yellow-400 to-orange-500", icon: "👑" };
    if (player.title_score >= 100) return { level: "Veterano", color: "from-purple-400 to-pink-500", icon: "⭐" };
    if (player.title_score >= 70) return { level: "Profesional", color: "from-blue-400 to-cyan-500", icon: "🏆" };
    if (player.title_score >= 40) return { level: "Emergente", color: "from-green-400 to-blue-500", icon: "🎯" };
    return { level: "Novato", color: "from-gray-400 to-gray-600", icon: "⚡" };
  };

  // Función para formatear seguidores de Instagram
  const formatInstagramFollowers = (followers: number) => {
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`;
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`;
    }
    return followers.toString();
  };

  const titleInfo = getTitleLevel();
  const playerImage = getPlayerImage();
  
  return (
    <Link href={`/jugadores/${player.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Indicador de nivel en la esquina superior */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full bg-gradient-to-r ${titleInfo.color} text-white text-xs font-bold z-20 flex items-center gap-1`}>
          <span>{titleInfo.icon}</span>
          <span>{titleInfo.level}</span>
        </div>
        
        {/* Header del jugador */}
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Avatar/Foto del jugador mejorado */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center border-2 border-gray-600 group-hover:border-green-400 transition-colors duration-300">
                  <Image
                    src={imgSrc}
                    alt={player.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={() => {
                      if (!imgSrc.includes('/api/esports/player/')) {
                        setImgSrc(`/api/esports/player/${player.id}/image`);
                      }
                    }}
                  />
                </div>
                
                {/* Indicador de equipo si tiene */}
                {player.current_team && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-gray-800">
                    T
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors duration-300 line-clamp-1">
                  {player.name}
                </h3>
                <div className="space-y-1">
                  {player.role && (
                    <p className="text-sm text-blue-400 font-medium">{player.role}</p>
                  )}
                  {player.current_team && (
                    <p className="text-xs text-gray-400">{player.current_team}</p>
                  )}
                  {player.nationality && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      🌍 {player.nationality}
                    </p>
                  )}
                </div>
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
            {/* Estatus profesional */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                player.professional_status === "Activo" ? "bg-green-400" : "bg-yellow-400"
              }`}></div>
              <span className={`text-sm font-medium ${
                player.professional_status === "Activo" ? "text-green-400" : "text-yellow-400"
              }`}>
                {player.professional_status}
              </span>
            </div>
            
            {/* Estadísticas mejoradas */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50">
                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-purple-400 font-bold">{player.title_score}</div>
                  <div className="text-xs text-gray-400">Puntos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-blue-400 font-bold">{player.tournaments_played}</div>
                  <div className="text-xs text-gray-400">Torneos</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50">
                <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <div>
                  <div className="text-pink-400 font-bold">{formatInstagramFollowers(player.instagram_followers)}</div>
                  <div className="text-xs text-gray-400">IG</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer con acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
            <div className="text-left">
              <span className="text-xs text-gray-400">Ver Perfil Completo</span>
            </div>
            
            <div className={`bg-gradient-to-r ${titleInfo.color} p-2 rounded-lg opacity-80`}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
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
  
  // Función para cambiar el juego y actualizar la URL sin recargar
  const handleGameChange = (newGame: string) => {
    if (newGame === game) return; // Evitar cambios innecesarios
    
    setIsTransitioning(true);
    setGame(newGame);
    
    const params = new URLSearchParams(searchParams?.toString());
    params.set('game', newGame);
    // Usar replace en lugar de push para evitar agregar al historial
    router.replace(`/esports/players?${params.toString()}`, { scroll: false });
    
    // Reset del estado de transición después de un breve delay
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("titles"); // Nuevo estado para ordenación
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false); // Estado para transiciones
  
  // Sistemas
  const notificationSystem = useNotifications();
  
  // Cache simple para evitar recargas innecesarias
  const [playersCache, setPlayersCache] = useState<Map<string, Player[]>>(new Map());
  
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

  // Resetear página cuando cambian los filtros (pero mantener scroll)
  useEffect(() => {
    setPage(1);
  }, [game, debouncedSearch]);

  // Cargar jugadores con mejor manejo de estados y caché
  useEffect(() => {
    async function load() {
      const cacheKey = `${game}-${debouncedSearch}`;
      
      // Verificar si ya tenemos estos datos en caché
      if (playersCache.has(cacheKey)) {
        setPlayers(playersCache.get(cacheKey) || []);
        return;
      }
      
      setLoading(true);
      setIsTransitioning(true);
      
      try {
        const data = await fetchPlayers(game, debouncedSearch);
        setPlayers(data);
        
        // Guardar en caché
        setPlayersCache(prev => new Map(prev).set(cacheKey, data));
      } catch (error) {
        console.error("Error loading players:", error);
        setPlayers([]);
      } finally {
        setLoading(false);
        // Delay adicional para suavizar la transición
        setTimeout(() => setIsTransitioning(false), 200);
      }
    }
    load();
  }, [game, debouncedSearch, playersCache]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favoritePlayers", JSON.stringify(favoritePlayers));
    }
  }, [favoritePlayers]);

  // Filtrado, ordenación y paginación
  const sortedAndPaginatedPlayers = useMemo(() => {
    const sortedPlayers = [...players];
    
    // Aplicar ordenación
    switch (sortBy) {
      case "titles":
        sortedPlayers.sort((a, b) => b.title_score - a.title_score);
        break;
      case "name":
        sortedPlayers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "team":
        sortedPlayers.sort((a, b) => {
          const teamA = a.current_team || "zzz"; // Sin equipo al final
          const teamB = b.current_team || "zzz";
          return teamA.localeCompare(teamB);
        });
        break;
      case "status":
        sortedPlayers.sort((a, b) => {
          if (a.professional_status === "Activo" && b.professional_status !== "Activo") return -1;
          if (a.professional_status !== "Activo" && b.professional_status === "Activo") return 1;
          return 0;
        });
        break;
      case "instagram":
        sortedPlayers.sort((a, b) => b.instagram_followers - a.instagram_followers);
        break;
      default:
        // Mantener orden por títulos como predeterminado
        sortedPlayers.sort((a, b) => b.title_score - a.title_score);
    }
    
    // Aplicar paginación
    const start = (page - 1) * PAGE_SIZE;
    return sortedPlayers.slice(start, start + PAGE_SIZE);
  }, [players, page, sortBy]);

  const totalPages = Math.ceil(players.length / PAGE_SIZE);

  const favoriteList = useMemo(
    () => players.filter((p) => favoritePlayers.includes(p.id)),
    [players, favoritePlayers]
  );

  // Estadísticas mejoradas
  const stats = useMemo(() => {
    const totalTitulos = players.reduce((sum, p) => sum + p.title_score, 0);
    const jugadoresActivos = players.filter(p => p.professional_status === "Activo").length;
    const conEquipo = players.filter(p => p.current_team).length;
    
    return {
      total: players.length,
      favoritos: favoriteList.length,
      conFoto: players.filter(p => p.image_url).length,
      activos: jugadoresActivos,
      conEquipo: conEquipo,
      totalTitulos: totalTitulos,
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
              
              {/* Estadísticas rápidas mejoradas */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-green-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <div className="text-2xl font-bold text-green-400">{stats.total}</div>
                  </div>
                  <div className="text-sm text-gray-400">Jugadores</div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="text-2xl font-bold text-yellow-400">{stats.favoritos}</div>
                  </div>
                  <div className="text-sm text-gray-400">Favoritos</div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <div className="text-2xl font-bold text-blue-400">{stats.conFoto}</div>
                  </div>
                  <div className="text-sm text-gray-400">Con Foto</div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm6-1a1 1 0 00-1-1h-2a1 1 0 00-1 1v1h4V5z" clipRule="evenodd" />
                    </svg>
                    <div className="text-2xl font-bold text-purple-400">{stats.activos}</div>
                  </div>
                  <div className="text-sm text-gray-400">Activos</div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                    </svg>
                    <div className="text-2xl font-bold text-cyan-400">{stats.conEquipo}</div>
                  </div>
                  <div className="text-sm text-gray-400">En Equipo</div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 hover:border-orange-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <div className="text-2xl font-bold text-orange-400">{stats.totalTitulos}</div>
                  </div>
                  <div className="text-sm text-gray-400">Pts. Títulos</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-8">
          {/* Filtros de juegos */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Seleccionar Juego</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {GAMES.map((g, index) => (
                <button
                  key={g.id}
                  onClick={() => handleGameChange(g.id)}
                  disabled={isTransitioning}
                  className={`group relative overflow-hidden px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
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
                        className={`w-8 h-8 mx-auto group-hover:scale-110 transition-transform duration-300 ${isTransitioning && game === g.id ? 'animate-pulse' : ''}`}
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

          {/* Opciones de ordenación */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700 max-w-5xl mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4 text-center">Ordenar por</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                  onClick={() => setSortBy("titles")}
                  disabled={isTransitioning}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 disabled:opacity-50 ${
                    sortBy === "titles"
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-400 shadow-lg"
                      : "bg-gray-800/50 text-white border-gray-600 hover:border-orange-500/50 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-sm">Títulos</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setSortBy("instagram")}
                  disabled={isTransitioning}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 disabled:opacity-50 ${
                    sortBy === "instagram"
                      ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-400 shadow-lg"
                      : "bg-gray-800/50 text-white border-gray-600 hover:border-pink-500/50 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-sm">Instagram</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setSortBy("name")}
                  disabled={isTransitioning}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 disabled:opacity-50 ${
                    sortBy === "name"
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400 shadow-lg"
                      : "bg-gray-800/50 text-white border-gray-600 hover:border-blue-500/50 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Nombre</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setSortBy("team")}
                  disabled={isTransitioning}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 disabled:opacity-50 ${
                    sortBy === "team"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-lg"
                      : "bg-gray-800/50 text-white border-gray-600 hover:border-purple-500/50 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3v-8h6v8h3a1 1 0 001-1V7l-7-5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Equipo</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setSortBy("status")}
                  disabled={isTransitioning}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 border-2 disabled:opacity-50 ${
                    sortBy === "status"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400 shadow-lg"
                      : "bg-gray-800/50 text-white border-gray-600 hover:border-green-500/50 hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm6-1a1 1 0 00-1-1h-2a1 1 0 00-1 1v1h4V5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Estado</span>
                  </div>
                </button>
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
          <div className={`mb-8 transition-content ${isTransitioning ? 'loading' : ''}`} data-players-section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Jugadores de {GAMES.find(g => g.id === game)?.name}
              </h3>
              <div className="text-sm text-gray-400">
                {loading ? (
                  <div className="animate-pulse bg-gray-600 h-4 w-32 rounded"></div>
                ) : (
                  `${players.length} jugadores encontrados`
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PlayerSkeleton key={i} />
                ))}
              </div>
            ) : sortedAndPaginatedPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto transition-all duration-500 ease-in-out">
                {sortedAndPaginatedPlayers.map((player: Player, index) => (
                  <div 
                    key={player.id} 
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <PlayerCard 
                      player={player} 
                      onToggleFavorite={setFavoritePlayers} 
                      favoritePlayers={favoritePlayers} 
                    />
                  </div>
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
