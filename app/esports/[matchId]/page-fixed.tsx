"use client";

import { useEffect, useState, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Countdown from "../../components/Countdown";
import Search from "../../components/Search";
import PredictionSystem from "../../components/PredictionSystem";

// Icono de favorito (estrella) reutilizable con tooltip y animación mejorada
function Star({ filled, ...props }: { filled: boolean; [key: string]: any }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />
      <span 
        title={filled ? "Quitar de favoritos" : "Añadir a favoritos"}
        className="relative block p-2 rounded-full hover:bg-yellow-500/10 transition-all duration-300"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill={filled ? "#FFD700" : "none"}
          stroke="#FFD700"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`cursor-pointer transition-all duration-300 transform hover:scale-110 ${filled ? 'filter drop-shadow-lg animate-pulse' : 'hover:fill-yellow-400'}`}
          {...props}
        >
          <polygon points="12,2 15.11,8.83 22.22,9.27 17,14.02 18.54,21.02 12,17.27 5.46,21.02 7,14.02 1.78,9.27 8.89,8.83" />
        </svg>
      </span>
    </div>
  );
}

// Componente para mostrar banderas de idioma con mejor diseño
function LangFlag({ code }: { code: string }) {
  const getFlag = (code: string) => {
    const flags = {
      "es-ES": { src: "/file.svg", alt: "Español", emoji: "🇪🇸" },
      "en-US": { src: "/globe.svg", alt: "English", emoji: "🇺🇸" },
      default: { src: "/globe.svg", alt: code, emoji: "🌍" }
    };
    return flags[code as keyof typeof flags] || flags.default;
  };

  const flag = getFlag(code);
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors">
      <span className="text-lg">{flag.emoji}</span>
      <img 
        src={flag.src} 
        alt={flag.alt} 
        title={flag.alt} 
        className="w-4 h-4 rounded-sm opacity-80"
      />
    </div>
  );
}

// Componente para mostrar loading spinner mejorado
function Spinner({ size = 24, color = "var(--accent,#00FF80)" }: { size?: number; color?: string }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="animate-spin rounded-full border-2 border-transparent"
        style={{ 
          width: size, 
          height: size,
          borderTopColor: color,
          borderRightColor: color,
          filter: 'drop-shadow(0 0 4px rgba(0, 255, 128, 0.3))'
        }}
        role="status"
        aria-label="Cargando"
      />
      <div
        className="absolute animate-ping rounded-full"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          backgroundColor: color,
          opacity: 0.4
        }}
      />
    </div>
  );
}

// Componente para mostrar el estado del partido con diseño mejorado
function MatchStatus({ match }: { match: MatchDetail }) {
  const now = Date.now() / 1000;
  const started = match.start_time <= now;
  const live = started && match.radiant_win === null;
  
  if (live) {
    const running = match.games.find((g) => g.status === "running");
    let minutes = 0;
    if (running) {
      const begin = running.begin_at
        ? new Date(running.begin_at).getTime()
        : match.start_time * 1000;
      minutes = Math.floor((Date.now() - begin) / 60000);
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg animate-pulse border border-red-400">
          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          <span>EN VIVO - Juego {running.position}</span>
          <span className="text-red-200">({minutes}m)</span>
        </div>
      );
    }
    minutes = Math.floor((Date.now() - match.start_time * 1000) / 60000);
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg animate-pulse border border-red-400">
        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
        <span>EN VIVO</span>
        <span className="text-red-200">({minutes}m)</span>
      </div>
    );
  }
  
  if (match.radiant_win === null) {
    const timeUntilStart = match.start_time - now;
    if (timeUntilStart > 0) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm shadow-lg border border-blue-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <span>Por jugar</span>
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold text-sm shadow-lg border border-yellow-400">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span>En curso</span>
        </div>
      );
    }
  }
  
  const winner = match.radiant_win ? match.radiant : match.dire;
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-sm shadow-lg border border-green-400">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
      <span>Ganó {winner}</span>
    </div>
  );
}

// Interfaces necesarias
interface GameInfo {
  id: number;
  position: number;
  status: string;
  begin_at: string | null;
  end_at: string | null;
  winner_id: number | null;
}

interface StreamInfo {
  embed_url: string;
  raw_url: string;
  language: string;
}

interface MatchDetail {
  id: number;
  name: string;
  radiant: string;
  dire: string;
  radiant_id: number | null;
  dire_id: number | null;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  end_time: number | null;
  league: string;
  serie: string;
  tournament: string;
  match_type: string;
  number_of_games: number;
  radiant_win: boolean | null;
  games: GameInfo[];
  streams: StreamInfo[];
}

async function fetchMatch(id: string): Promise<MatchDetail | null> {
  const res = await fetch(`/api/esports/match/${id}`, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to fetch match", await res.text());
    return null;
  }
  const m = await res.json();
  const team1 = m.opponents?.[0]?.opponent;
  const team2 = m.opponents?.[1]?.opponent;
  return {
    id: m.id,
    name: m.name ?? `${team1?.name ?? "TBD"} vs ${team2?.name ?? "TBD"}`,
    radiant: team1?.name ?? "TBD",
    dire: team2?.name ?? "TBD",
    radiant_id: team1?.id ?? null,
    dire_id: team2?.id ?? null,
    radiant_score: m.results?.[0]?.score ?? 0,
    dire_score: m.results?.[1]?.score ?? 0,
    start_time: new Date(m.begin_at ?? m.scheduled_at).getTime() / 1000,
    end_time: m.end_at ? new Date(m.end_at).getTime() / 1000 : null,
    league: m.league?.name ?? "",
    serie: m.serie?.full_name ?? "",
    tournament: m.tournament?.name ?? "",
    match_type: m.match_type ?? "",
    number_of_games: m.number_of_games ?? m.games?.length ?? 0,
    radiant_win:
      m.winner?.id !== undefined && team1?.id !== undefined
        ? m.winner.id === team1.id
        : null,
    games: (m.games ?? []).map((g: any) => ({
      id: g.id,
      position: g.position,
      status: g.status,
      begin_at: g.begin_at,
      end_at: g.end_at,
      winner_id: g.winner?.id ?? null,
    })),
    streams: (m.streams_list ?? []).map((s: any) => ({
      embed_url: s.embed_url,
      raw_url: s.raw_url,
      language: s.language,
    })),
  } as MatchDetail;
}

// Idiomas soportados
const LANGS = [
  { code: "es-ES", label: "Español" },
  { code: "en-US", label: "English" },
];

export default function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [vodUrl, setVodUrl] = useState<string | null>(null);
  const [findingVod, setFindingVod] = useState<boolean>(false);
  const [searchedVod, setSearchedVod] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [lang, setLang] = useState<string>(LANGS[0].code);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  
  const router = useRouter();
  
  // Función para mostrar notificaciones
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Auto-refresh para partidos en vivo
  useEffect(() => {
    if (!match || !autoRefresh) return;
    
    const now = Date.now() / 1000;
    const isLive = match.start_time <= now && match.radiant_win === null;
    
    if (!isLive) return;
    
    const interval = setInterval(async () => {
      const updatedMatch = await fetchMatch(matchId);
      if (updatedMatch) {
        setMatch(updatedMatch);
      }
    }, 30000); // Actualizar cada 30 segundos
    
    return () => clearInterval(interval);
  }, [match, autoRefresh, matchId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMatch(matchId);
      setMatch(data);
      setLoading(false);
    }
    load();
  }, [matchId]);

  // Guardar idioma en localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("match_lang");
    if (savedLang && LANGS.some(l => l.code === savedLang)) setLang(savedLang);
  }, []);

  // Favoritos en localStorage
  useEffect(() => {
    if (!match) return;
    const favs = JSON.parse(localStorage.getItem("favorites_matches") || "[]");
    setIsFavorite(favs.includes(match.id));
  }, [match]);

  function toggleFavorite() {
    if (!match) return;
    const favs = JSON.parse(localStorage.getItem("favorites_matches") || "[]");
    let newFavs;
    if (favs.includes(match.id)) {
      newFavs = favs.filter((id: number) => id !== match.id);
    } else {
      newFavs = [...favs, match.id];
    }
    localStorage.setItem("favorites_matches", JSON.stringify(newFavs));
    setIsFavorite(newFavs.includes(match.id));
  }

  function handleLangChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem("match_lang", newLang);
  }

  // Helper para logo de equipo con fallback mejorado
  function TeamLogo({ id, name, size = 48 }: { id: number | null; name: string; size?: number }) {
    const [error, setError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    
    if (!id || error) {
      return (
        <div 
          className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-gray-300 border-2 border-gray-500 shadow-lg hover:scale-105 transition-transform duration-300" 
          style={{ width: size, height: size }}
          title={name}
        >
          <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
      );
    }
    
    return (
      <div className="relative group">
        {imageLoading && (
          <div 
            className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center animate-pulse"
            style={{ width: size, height: size }}
          >
            <Spinner size={size * 0.4} />
          </div>
        )}
        <Image
          src={`/api/esports/team/${id}/logo`}
          alt={`Logo de ${name}`}
          width={size}
          height={size}
          className={`rounded-full border-2 border-gray-500 group-hover:border-[var(--accent,#00FF80)] bg-white shadow-lg hover:shadow-xl hover:shadow-[var(--accent,#00FF80)]/20 transition-all duration-300 hover:scale-105 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          title={name}
          onError={() => setError(true)}
          onLoad={() => setImageLoading(false)}
          unoptimized
        />
      </div>
    );
  }

  // Skeleton loader mejorado
  if (loading) {
    return (
      <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg w-32 animate-pulse" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg w-16 animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Main card skeleton */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl opacity-20 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="h-10 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-3/4 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-24 animate-pulse" />
                    <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-32 animate-pulse" />
                  </div>
                  <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-48 animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-16 animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-8 animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-16 animate-pulse" />
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Stream skeleton */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl opacity-20 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-32 mb-4 animate-pulse" />
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>
          
          <div className="text-center">
            <Spinner size={48} />
            <p className="text-lg text-gray-400 font-semibold mt-4">Cargando detalles del partido...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 rounded-full opacity-20 blur-xl" />
            <div className="relative w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-700 rounded-full flex items-center justify-center border border-gray-600">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8.5 8.5l7 7"/>
                <path d="M15.5 8.5l-7 7"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Partido no encontrado</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            No pudimos encontrar el partido que estás buscando. Es posible que haya sido eliminado o que la URL sea incorrecta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/esports" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent,#00FF80)] to-green-500 text-black font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver a partidos
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-white font-semibold border border-gray-600 hover:bg-gray-700 hover:border-gray-500 transition-all duration-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 009-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 006.74-2.74L21 16"/>
                <path d="M16 16h5v5"/>
              </svg>
              Recargar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white" role="main">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header mejorado */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <Link 
            href="/esports" 
            className="group inline-flex items-center gap-2 text-[var(--accent,#00FF80)] hover:text-green-400 text-sm font-semibold transition-all duration-300 hover:scale-105" 
            aria-label="Volver a la lista de partidos"
          >
            <div className="p-2 rounded-full bg-gray-800 group-hover:bg-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
            Volver a partidos
          </Link>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Search />
            
            {/* Botones de compartir mejorados */}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: match?.name,
                      url: window.location.href,
                    }).then(() => {
                      showNotification('¡Enlace compartido exitosamente!', 'success');
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href).then(() => {
                        showNotification('Enlace copiado al portapapeles', 'success');
                      });
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                      showNotification('Enlace copiado al portapapeles', 'success');
                    });
                  }
                }} 
                aria-label="Compartir partido" 
                className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600 hover:border-gray-500 transition-all duration-300 text-xs font-semibold"
                title="Compartir por enlace"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                  <polyline points="16,6 12,2 8,6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span className="hidden sm:inline">Compartir</span>
              </button>
            </div>
            
            {/* Selector de idioma mejorado */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-600">
              <select 
                value={lang} 
                onChange={handleLangChange} 
                aria-label="Seleccionar idioma" 
                className="bg-transparent text-gray-300 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {LANGS.map(l => (
                  <option key={l.code} value={l.code} className="bg-gray-800">
                    {l.label}
                  </option>
                ))}
              </select>
              <LangFlag code={lang} />
            </div>
          </div>
        </header>

        {/* Sistema de notificaciones */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm transform transition-all duration-300 animate-slide-in-right ${
                  notification.type === 'success' 
                    ? 'bg-green-900/90 border-green-500 text-green-100' 
                    : notification.type === 'error'
                    ? 'bg-red-900/90 border-red-500 text-red-100'
                    : 'bg-blue-900/90 border-blue-500 text-blue-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notification.type === 'success' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8.5 8.5l7 7"/>
                      <path d="M15.5 8.5l-7 7"/>
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  )}
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toggle para auto-refresh en partidos en vivo */}
        {match && (() => {
          const now = Date.now() / 1000;
          const isLive = match.start_time <= now && match.radiant_win === null;
          if (!isLive) return null;
          
          return (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 font-semibold">Partido en vivo</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-400">Auto-actualizar</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-1 ${autoRefresh ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          );
        })()}

        {/* Tarjeta principal del partido mejorada */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 blur-sm" />
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl backdrop-blur-sm">
            {/* Botón de favorito */}
            <div className="absolute top-6 right-6 z-10">
              <button 
                aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"} 
                onClick={toggleFavorite} 
                className="focus:outline-none"
              >
                <Star filled={isFavorite} />
              </button>
            </div>
            
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Información del partido */}
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl xl:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent,#00FF80)] to-green-400 mb-4 leading-tight">
                    {match.name}
                  </h1>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm shadow-lg">
                      {match.league}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs border border-gray-600">
                      {match.serie}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-xs border border-gray-600">
                      {match.tournament}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      {new Date(match.start_time * 1000).toLocaleString(lang)}
                    </div>
                    {match.end_time && (
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 12l2 2 4-4"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                        Finalizado: {new Date(match.end_time * 1000).toLocaleString(lang)}
                      </div>
                    )}
                  </div>
                  
                  {match.start_time > Date.now() / 1000 && (
                    <div className="mb-6">
                      <Countdown targetTime={match.start_time} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Marcador */}
              <div className="flex items-center justify-center xl:justify-end">
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600 shadow-xl min-w-fit">
                  <div className="flex items-center gap-6 text-lg font-bold">
                    {/* Equipo 1 */}
                    <div className="flex flex-col items-center gap-3 min-w-[100px]">
                      <Link 
                        href={`/esports/team/${match.radiant_id}`} 
                        aria-label={`Ver equipo ${match.radiant}`}
                        className="group"
                      >
                        <TeamLogo id={match.radiant_id} name={match.radiant} size={64} />
                      </Link>
                      <div className="text-center">
                        <p className="text-white font-semibold text-sm mb-1 truncate max-w-[100px]" title={match.radiant}>
                          {match.radiant}
                        </p>
                        <span className={`inline-block px-4 py-2 rounded-xl text-2xl font-bold shadow-lg ${
                          match.radiant_win === true 
                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {match.radiant_score}
                        </span>
                      </div>
                    </div>
                    
                    {/* VS */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl font-bold text-gray-500">VS</span>
                      <MatchStatus match={match} />
                    </div>
                    
                    {/* Equipo 2 */}
                    <div className="flex flex-col items-center gap-3 min-w-[100px]">
                      <Link 
                        href={`/esports/team/${match.dire_id}`} 
                        aria-label={`Ver equipo ${match.dire}`}
                        className="group"
                      >
                        <TeamLogo id={match.dire_id} name={match.dire} size={64} />
                      </Link>
                      <div className="text-center">
                        <p className="text-white font-semibold text-sm mb-1 truncate max-w-[100px]" title={match.dire}>
                          {match.dire}
                        </p>
                        <span className={`inline-block px-4 py-2 rounded-xl text-2xl font-bold shadow-lg ${
                          match.radiant_win === false 
                            ? 'bg-gradient-to-r from-green-600 to-green-500 text-white' 
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {match.dire_score}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sistema de Predicciones mejorado */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6 flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-yellow-600 to-orange-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              Predicciones
            </h2>
            <PredictionSystem
              matchId={match.id}
              matchTitle={match.name}
              game="esports"
              radiantTeam={match.radiant}
              direTeam={match.dire}
              isFinished={match.radiant_win !== null}
              actualWinner={match.radiant_win === true ? 'radiant' : match.radiant_win === false ? 'dire' : null}
              startTime={match.start_time}
            />
          </div>
        </div>

        {/* Información del partido y estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Información del partido */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                </div>
                Información del partido
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Serie:</span>
                  <span className="text-white font-semibold">{match.serie}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Torneo:</span>
                  <span className="text-white font-semibold">{match.tournament}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-400">Formato:</span>
                  <span className="text-white font-semibold">
                    {match.match_type === "best_of" ? `Best of ${match.number_of_games}` : match.match_type}
                  </span>
                </div>
                {match.end_time && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm text-gray-400">Finalizado:</span>
                    <span className="text-white font-semibold">
                      {new Date(match.end_time * 1000).toLocaleString(lang)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas adicionales */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 3v18h18"/>
                    <path d="M18 17V9"/>
                    <path d="M13 17V5"/>
                    <path d="M8 17v-3"/>
                  </svg>
                </div>
                Estadísticas
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <span className="text-gray-400">Duración estimada</span>
                  <span className="text-white font-semibold">
                    {match.end_time && match.start_time 
                      ? `${Math.round((match.end_time - match.start_time) / 60)} min`
                      : 'En curso'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <span className="text-gray-400">Juegos totales</span>
                  <span className="text-white font-semibold">{match.games.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <span className="text-gray-400">Estado</span>
                  <MatchStatus match={match} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información de juegos si existen */}
        {match.games.length > 0 && (
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="9" y2="15"/>
                    <line x1="15" y1="9" x2="15" y2="15"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                  </svg>
                </div>
                Mapa a mapa
              </h2>
              <div className="grid gap-4">
                {match.games.map((g, index) => {
                  const isFinished = g.status === "finished";
                  const isRunning = g.status === "running";
                  const winner = isFinished && g.winner_id 
                    ? g.winner_id === match.radiant_id ? match.radiant : match.dire
                    : null;
                  
                  return (
                    <div 
                      key={g.id} 
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        isRunning 
                          ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500 shadow-lg shadow-yellow-500/20' 
                          : isFinished
                          ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600 hover:border-gray-500'
                          : 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                            isRunning 
                              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 animate-pulse' 
                              : isFinished
                              ? 'bg-gradient-to-r from-green-600 to-green-500'
                              : 'bg-gradient-to-r from-gray-600 to-gray-500'
                          }`}>
                            {g.position}
                          </div>
                          <div>
                            <p className="font-semibold text-white mb-1">
                              Juego {g.position}
                              {isRunning && (
                                <span className="ml-2 px-2 py-1 rounded-full bg-red-600 text-white text-xs animate-pulse">
                                  EN VIVO
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-400">
                              {g.begin_at 
                                ? new Date(g.begin_at).toLocaleString(lang)
                                : 'Hora por determinar'
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {isFinished && winner ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">Ganador:</span>
                              <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                                winner === match.radiant 
                                  ? 'bg-gradient-to-r from-[var(--accent,#00FF80)] to-green-500 text-black' 
                                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                              }`}>
                                {winner}
                              </span>
                            </div>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                              isRunning 
                                ? 'bg-yellow-600 text-white' 
                                : 'bg-gray-600 text-gray-300'
                            }`}>
                              {g.status === 'running' ? 'En curso' : g.status === 'finished' ? 'Finalizado' : 'Por jugar'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {g.end_at && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-500">
                            Finalizado: {new Date(g.end_at).toLocaleString(lang)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Información de streams si existen */}
        {match.streams.length > 0 && (
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-2xl backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-6 flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-red-600 to-pink-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                Dónde ver
              </h2>
              
              {/* Lista de streams */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {match.streams.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.raw_url}
                    target="_blank"
                    rel="noopener"
                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 hover:border-[var(--accent,#00FF80)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent,#00FF80)]/20"
                    title={`Ver stream en ${s.language.toUpperCase()}`}
                  >
                    <LangFlag code={s.language} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-[var(--accent,#00FF80)] transition-colors">
                          {s.language.toUpperCase()} Stream
                        </span>
                        <svg 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          className="text-gray-400 group-hover:text-[var(--accent,#00FF80)] transition-colors"
                        >
                          <path d="M7 17L17 7M17 7H7M17 7V17"/>
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {s.raw_url.includes('twitch.tv') ? 'Twitch' : 'Stream externo'}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
