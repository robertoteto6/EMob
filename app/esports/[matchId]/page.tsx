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

// Componente para mostrar el embed de stream/VOD con diseño mejorado
function StreamEmbed({ twitch, vodUrl }: { twitch: StreamInfo; vodUrl: string | null }) {
  const [isLoading, setIsLoading] = useState(true);
  
  const embedUrl = (() => {
    if (vodUrl) {
      const m = vodUrl.match(/videos\/(\d+)/);
      if (m) {
        const url = new URL("https://player.twitch.tv/");
        url.searchParams.set("video", m[1]);
        if (typeof window !== "undefined") {
          if (!url.searchParams.get("parent")) {
            url.searchParams.set("parent", window.location.hostname);
          }
        }
        return url.toString();
      }
      return vodUrl;
    }
    try {
      const url = new URL(twitch.embed_url);
      if (typeof window !== "undefined") {
        if (!url.searchParams.get("parent")) {
          url.searchParams.set("parent", window.location.hostname);
        }
        return url.toString();
      }
    } catch {
      /* ignore */
    }
    return twitch.embed_url;
  })();

  // Miniatura del stream si es Twitch
  let thumbnail = null;
  if (twitch.raw_url.includes("twitch.tv")) {
    const channel = twitch.raw_url.split("twitch.tv/")[1]?.split("/")[0];
    if (channel) {
      thumbnail = (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <img
            src={`https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-640x360.jpg`}
            alt={`Miniatura de ${channel}`}
            className="rounded-lg border border-[#333] max-w-md shadow-2xl"
            style={{ objectFit: "cover" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 rounded-lg" />
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-sm font-bold">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              EN VIVO
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 blur-sm" />
      <div className="relative w-full h-0 pb-[56.25%] rounded-xl overflow-hidden border border-[#333] shadow-2xl bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-4">
              <Spinner size={40} />
              <p className="text-gray-400 text-sm">Cargando stream...</p>
            </div>
          </div>
        )}
        
        {thumbnail && isLoading && (
          <div className="absolute inset-0 pointer-events-none">
            {thumbnail}
          </div>
        )}
        
        <iframe
          src={embedUrl}
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-xl"
          title="Stream del partido"
          aria-label="Stream del partido"
          onLoad={() => setIsLoading(false)}
        />
        
        {/* Controles overlay */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => window.open(twitch.raw_url, '_blank')}
            className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-black/90 transition-colors"
          >
            Ver en Twitch
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar la lista de streams con diseño mejorado
function StreamList({ streams }: { streams: StreamInfo[] }) {
  if (streams.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
        </svg>
        Streams disponibles
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {streams.map((s, idx) => (
          <a
            key={idx}
            href={s.raw_url}
            target="_blank"
            rel="noopener"
            className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 hover:border-[var(--accent,#00FF80)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent,#00FF80)]/20"
            title={`Ver stream en ${s.language.toUpperCase()}`}
          >
            <LangFlag code={s.language} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white group-hover:text-[var(--accent,#00FF80)] transition-colors text-sm truncate">
                  {s.language.toUpperCase()} Stream
                </span>
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-gray-400 group-hover:text-[var(--accent,#00FF80)] transition-colors flex-shrink-0"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {s.raw_url.includes('twitch.tv') ? 'Twitch' : 'Stream externo'}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

// Componente para copiar resultado con animación mejorada
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={label}
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 transform hover:scale-105 ${
        copied 
          ? 'bg-green-600 text-white shadow-lg shadow-green-500/25' 
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600 hover:border-gray-500'
      }`}
      title={label}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          ¡Copiado!
        </>
      ) : (
        <>
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className={`transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copiar resultado
        </>
      )}
    </button>
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
  // Estados adicionales para notificaciones y mejoras de UX
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  
  // El tema se gestiona globalmente, no local aquí
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

  // Guardar idioma y tema en localStorage
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
    // Aquí deberías llamar a la función global de cambio de idioma si usas i18n
    // Por ejemplo: i18n.changeLanguage(newLang)
    // Si usas context, puedes disparar el cambio aquí
  }

  // El tema se gestiona globalmente

  // Función de compartir mejorada
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: match?.name,
        url: window.location.href,
      }).then(() => {
        showNotification('¡Enlace compartido exitosamente!', 'success');
      }).catch(() => {
        handleCopyLink();
      });
    } else {
      handleCopyLink();
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showNotification('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
      showNotification('Error al copiar enlace', 'error');
    });
  }

  // Compartir en redes sociales mejorado
  function handleShareSocial(network: "twitter" | "whatsapp") {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(match?.name ?? "Partido");
    try {
      if (network === "twitter") {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
        showNotification('Compartiendo en Twitter...', 'info');
      } else if (network === "whatsapp") {
        window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
        showNotification('Compartiendo en WhatsApp...', 'info');
      }
    } catch (error) {
      showNotification('Error al compartir', 'error');
    }
  }

  useEffect(() => {
    if (!match) return;
    const now = Date.now() / 1000;
    const ended = match.end_time !== null && now > match.end_time;
    if (!ended || vodUrl || findingVod || searchedVod) return;
    const twitch =
      match.streams.find(
        (s) => s.embed_url.includes("twitch") || s.raw_url.includes("twitch")
      ) || match.streams[0];
    if (!twitch) return;
    let channel = "";
    try {
      const u = new URL(twitch.raw_url || twitch.embed_url);
      channel = u.pathname.replace(/^\//, "").split("/")[0];
    } catch {
      return;
    }
    async function searchVod() {
      setFindingVod(true);
      setSearchedVod(true);
      try {
        const res = await fetch("/api/esports/vod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchName: match!.name,
            channel,
            startTime: match!.start_time,
          }),
        });
        const data = await res.json();
        if (data.url) setVodUrl(data.url);
      } catch (err) {
        console.error("Error buscando VOD:", err);
      } finally {
        setFindingVod(false);
      }
    }
    searchVod();
  }, [match, vodUrl, findingVod, searchedVod]);

  // Skeleton loader mejorado
  if (loading) {
    return (
      <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg w-24 animate-pulse" />
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
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-16 animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-8 animate-pulse" />
                  <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-16 animate-pulse" />
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full animate-pulse" />
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

  // Helper para logo de equipo con fallback mejorado
  function TeamLogo({ id, name, size = 48 }: { id: number | null; name: string; size?: number }) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    
    if (!id || error) {
      return (
        <div 
          className="bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-gray-300 border-2 border-gray-500 shadow-lg hover:scale-105 transition-transform duration-300 flex-shrink-0" 
          style={{ width: size, height: size, minWidth: size, minHeight: size }}
          title={name}
        >
          <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      );
    }
    
    return (
      <div className="relative group flex-shrink-0" style={{ width: size, height: size }}>
        {loading && (
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
          className={`rounded-full border-2 border-gray-500 group-hover:border-[var(--accent,#00FF80)] bg-white shadow-lg hover:shadow-xl hover:shadow-[var(--accent,#00FF80)]/20 transition-all duration-300 hover:scale-105 object-cover ${loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ width: size, height: size, minWidth: size, minHeight: size }}
          title={name}
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
          unoptimized
        />
      </div>
    );
  }

  // MVP y jugadores destacados (mock)
  const mvp = match ? (match.radiant_score > match.dire_score ? match.radiant : match.dire) : "";
  const destacados = match ? [match.radiant, match.dire] : [];

  // Animación de transición para el contenedor principal
  const transitionClass = "transition-all duration-500 ease-in-out hover:scale-[1.01] hover:shadow-2xl";

  return (
    <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white" role="main">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header mejorado */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
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
          
          <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-end">
            <div className="order-1 sm:order-1 w-full sm:w-auto">
              <Search />
            </div>
            
            {/* Botones de compartir mejorados */}
            <div className="order-2 sm:order-2 flex gap-2">
              <button 
                onClick={handleShare} 
                aria-label="Compartir partido" 
                className="group flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600 hover:border-gray-500 transition-all duration-300 text-xs font-semibold"
                title="Compartir por enlace"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                  <polyline points="16,6 12,2 8,6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span className="hidden sm:inline">Compartir</span>
              </button>
              
              <button 
                onClick={() => handleShareSocial("twitter")} 
                aria-label="Compartir en Twitter" 
                className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all duration-300 text-xs font-semibold hover:shadow-lg hover:shadow-blue-500/25"
                title="Compartir en Twitter"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="hidden sm:inline">Twitter</span>
              </button>
              
              <button 
                onClick={() => handleShareSocial("whatsapp")} 
                aria-label="Compartir en WhatsApp" 
                className="group flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-all duration-300 text-xs font-semibold hover:shadow-lg hover:shadow-green-500/25"
                title="Compartir en WhatsApp"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
            
            {/* Selector de idioma mejorado */}
            <div className="order-3 sm:order-3 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gray-800 border border-gray-600">
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
            
            {/* Información del partido y titulo mejorado */}
            <div className="space-y-6 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent,#00FF80)] to-green-400 mb-4 leading-tight text-center lg:text-left">
                  {match.name}
                </h1>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
                  <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg">
                    {match.league}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 text-xs border border-gray-600">
                    {match.serie}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 text-xs border border-gray-600">
                    {match.tournament}
                  </span>
                </div>
                
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-6">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span className="break-all">{new Date(match.start_time * 1000).toLocaleString(lang)}</span>
                  </div>
                  {match.end_time && (
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      <span>Finalizado: {new Date(match.end_time * 1000).toLocaleString(lang)}</span>
                    </div>
                  )}
                </div>
                
                {match.start_time > Date.now() / 1000 && (
                  <div className="mb-6 flex justify-center lg:justify-start">
                    <Countdown targetTime={match.start_time} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Marcador principal mejorado */}
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-4xl bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 shadow-xl">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-lg font-bold">
                  {/* Equipo 1 */}
                  <div className="flex flex-col items-center gap-3 min-w-[120px] sm:min-w-[140px]">
                    <Link 
                      href={`/esports/team/${match.radiant_id}`} 
                      aria-label={`Ver equipo ${match.radiant}`}
                      className="group transition-transform hover:scale-105"
                    >
                      <TeamLogo id={match.radiant_id} name={match.radiant} size={72} />
                    </Link>
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm sm:text-base mb-2 truncate max-w-[120px] sm:max-w-[140px]" title={match.radiant}>
                        {match.radiant}
                      </p>
                      <span className={`inline-block px-4 py-2 rounded-xl text-xl sm:text-2xl font-bold shadow-lg transition-all ${
                        match.radiant_win === true 
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white scale-110' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                        {match.radiant_score}
                      </span>
                    </div>
                  </div>
                  
                  {/* VS y Estado */}
                  <div className="flex flex-col items-center gap-3 px-4">
                    <span className="text-xl sm:text-2xl font-bold text-gray-400">VS</span>
                    <div className="flex justify-center">
                      <MatchStatus match={match} />
                    </div>
                  </div>
                  
                  {/* Equipo 2 */}
                  <div className="flex flex-col items-center gap-3 min-w-[120px] sm:min-w-[140px]">
                    <Link 
                      href={`/esports/team/${match.dire_id}`} 
                      aria-label={`Ver equipo ${match.dire}`}
                      className="group transition-transform hover:scale-105"
                    >
                      <TeamLogo id={match.dire_id} name={match.dire} size={72} />
                    </Link>
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm sm:text-base mb-2 truncate max-w-[120px] sm:max-w-[140px]" title={match.dire}>
                        {match.dire}
                      </p>
                      <span className={`inline-block px-4 py-2 rounded-xl text-xl sm:text-2xl font-bold shadow-lg transition-all ${
                        match.radiant_win === false 
                          ? 'bg-gradient-to-r from-green-600 to-green-500 text-white scale-110' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                        {match.dire_score}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Acciones adicionales */}
                <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-gray-600">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">MVP:</span>
                    <span className="font-bold text-[var(--accent,#00FF80)]">{mvp}</span>
                  </div>
                  <CopyButton 
                    text={`${match.radiant} ${match.radiant_score} - ${match.dire_score} ${match.dire}`} 
                    label="Copiar resultado" 
                  />
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
        
        {/* Detalles del partido mejorados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Información del partido */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="sm:w-5 sm:h-5">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Información del partido</span>
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-400 min-w-0">Serie:</span>
                  <span className="text-white font-semibold text-xs sm:text-sm truncate">{match.serie}</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-400 min-w-0">Torneo:</span>
                  <span className="text-white font-semibold text-xs sm:text-sm truncate">{match.tournament}</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-400 min-w-0">Formato:</span>
                  <span className="text-white font-semibold text-xs sm:text-sm truncate">
                    {match.match_type === "best_of" ? `Best of ${match.number_of_games}` : match.match_type}
                  </span>
                </div>
                {match.end_time && (
                  <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-gray-400 min-w-0">Finalizado:</span>
                    <span className="text-white font-semibold text-xs sm:text-sm truncate">
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
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="sm:w-5 sm:h-5">
                    <path d="M3 3v18h18"/>
                    <path d="M18 17V9"/>
                    <path d="M13 17V5"/>
                    <path d="M8 17v-3"/>
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Estadísticas</span>
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <span className="text-gray-400 text-xs sm:text-sm">Duración estimada</span>
                  <span className="text-white font-semibold text-xs sm:text-sm">
                    {match.end_time && match.start_time 
                      ? `${Math.round((match.end_time - match.start_time) / 60)} min`
                      : 'En curso'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <span className="text-gray-400 text-xs sm:text-sm">Juegos totales</span>
                  <span className="text-white font-semibold text-xs sm:text-sm">{match.games.length}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <span className="text-gray-400 text-xs sm:text-sm">Estado</span>
                  <div className="flex justify-end">
                    <MatchStatus match={match} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Mapa a mapa mejorado */}
        {match.games.length > 0 && (
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="sm:w-6 sm:h-6">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="9" x2="9" y2="15"/>
                    <line x1="15" y1="9" x2="15" y2="15"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                  </svg>
                </div>
                <span className="text-base sm:text-xl">Mapa a mapa</span>
              </h2>
              <div className="grid gap-3 sm:gap-4">
                {match.games.map((g, index) => {
                  const isFinished = g.status === "finished";
                  const isRunning = g.status === "running";
                  const winner = isFinished && g.winner_id 
                    ? g.winner_id === match.radiant_id ? match.radiant : match.dire
                    : null;
                  
                  return (
                    <div 
                      key={g.id} 
                      className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
                        isRunning 
                          ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500 shadow-lg shadow-yellow-500/20' 
                          : isFinished
                          ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-600 hover:border-gray-500'
                          : 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-white text-sm sm:text-base ${
                            isRunning 
                              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 animate-pulse' 
                              : isFinished
                              ? 'bg-gradient-to-r from-green-600 to-green-500'
                              : 'bg-gradient-to-r from-gray-600 to-gray-500'
                          }`}>
                            {g.position}
                          </div>
                          <div>
                            <p className="font-semibold text-white mb-1 text-sm sm:text-base">
                              Juego {g.position}
                              {isRunning && (
                                <span className="ml-2 px-2 py-1 rounded-full bg-red-600 text-white text-xs animate-pulse">
                                  EN VIVO
                                </span>
                              )}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400">
                              {g.begin_at 
                                ? new Date(g.begin_at).toLocaleString(lang)
                                : 'Hora por determinar'
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-left sm:text-right w-full sm:w-auto">
                          {isFinished && winner ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <span className="text-xs sm:text-sm text-gray-400">Ganador:</span>
                              <span className={`font-bold px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                                winner === match.radiant 
                                  ? 'bg-gradient-to-r from-[var(--accent,#00FF80)] to-green-500 text-black' 
                                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                              }`}>
                                {winner}
                              </span>
                            </div>
                          ) : (
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium capitalize ${
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
        {/* Streams mejorados */}
        {match.streams.length > 0 && (
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 rounded-2xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-4 sm:p-6 lg:p-8 shadow-2xl backdrop-blur-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-red-600 to-pink-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="sm:w-6 sm:h-6">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <span className="text-base sm:text-xl">
                  {(() => {
                    const now = Date.now() / 1000;
                    const ended = match.end_time !== null && now > match.end_time;
                    const started = match.start_time <= now;
                    return started && !ended
                      ? "Stream en directo"
                      : ended
                      ? "Ver en diferido"
                      : "Dónde ver";
                  })()}
                </span>
              </h2>
              
              {/* Stream embed */}
              {(() => {
                const now = Date.now() / 1000;
                const ended = match.end_time !== null && now > match.end_time;
                const started = match.start_time <= now;
                const showEmbed = started || ended;
                if (!showEmbed) return null;
                const twitch =
                  match.streams.find(
                    (s) =>
                      s.embed_url.includes("twitch") || s.raw_url.includes("twitch")
                  ) || match.streams[0];
                if (!twitch) return null;
                return (
                  <div className="mb-4 sm:mb-6">
                    <StreamEmbed twitch={twitch} vodUrl={vodUrl} />
                  </div>
                );
              })()}
              
              {/* Estados de búsqueda de VOD */}
              {findingVod && (
                <div className="flex items-center justify-center gap-3 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 mb-4 sm:mb-6">
                  <Spinner size={20} color="#3B82F6" />
                  <span className="text-blue-400 font-medium text-sm sm:text-base">Buscando grabación del partido...</span>
                </div>
              )}
              
              {searchedVod && !vodUrl && !findingVod && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/30 mb-4 sm:mb-6 text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-red-400 sm:w-12 sm:h-12">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8.5 8.5l7 7"/>
                    <path d="M15.5 8.5l-7 7"/>
                  </svg>
                  <p className="text-red-400 font-medium text-sm sm:text-base">No se encontró grabación del partido</p>
                </div>
              )}
              
              {/* Link a VOD si está disponible */}
              {vodUrl && (
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      <span className="text-green-400 font-medium text-sm sm:text-base">Grabación disponible</span>
                    </div>
                    <a
                      href={vodUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 text-sm"
                      title="Ver VOD completo"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5,3 19,12 5,21 5,3"/>
                      </svg>
                      Ver VOD
                    </a>
                  </div>
                </div>
              )}
              
              {/* Lista de streams */}
              <StreamList streams={match.streams} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
