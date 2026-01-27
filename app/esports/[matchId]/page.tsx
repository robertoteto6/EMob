"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import MatchHeader from "../../components/MatchHeader";
import MatchCard from "../../components/MatchCard";
import MatchStreams from "../../components/MatchStreams";
import MatchGames from "../../components/MatchGames";
import MatchLineups from "../../components/MatchLineups";
import PredictionSystem from "../../components/PredictionSystem";
import Spinner from "../../components/Spinner";
import { MatchDetail, Notification, Language, Player } from "../../lib/types";

// Las animaciones personalizadas se han movido a app/globals.css

// Hooks personalizados
const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  return isVisible;
};

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
};

const matchCache = new Map<string, { data: MatchDetail | null; timestamp: number }>();
const CACHE_DURATION = 30000;
const AUTO_REFRESH_INTERVAL_MS = 30000;

async function fetchMatchAPI(matchId: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(`/api/esports/match/${matchId}`, { cache: "no-store", signal: controller.signal, headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } });
  clearTimeout(timeoutId);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data || typeof data !== 'object') throw new Error('Invalid match data received');
  return data;
}

function transformApiDataToMatchDetail(apiData: any): MatchDetail {
  const team1 = apiData.opponents?.[0]?.opponent;
  const team2 = apiData.opponents?.[1]?.opponent;
  const results = Array.isArray(apiData.results) ? apiData.results : [];
  const scoresByTeam = new Map<number, number>();
  for (const result of results) {
    const teamId = result?.team_id ?? result?.opponent_id;
    if (typeof teamId === "number" && typeof result?.score === "number") {
      scoresByTeam.set(teamId, result.score);
    }
  }
  const fallbackScore = (index: number) => {
    const score = results[index]?.score;
    return typeof score === "number" ? score : 0;
  };

  // Helper to map players if available in the match response (PandaScore usually provides lineups inside opponents in some endpoints)
  // Note: The structure depends heavily on the specific API plan/endpoint. We attempt to extract if present.
  const mapPlayers = (team: any): Player[] => {
    if (!team?.players && !team?.roster) return [];
    const source = team.players || team.roster;
    return Array.isArray(source) ? source.map((p: any) => ({
      id: String(p.id),
      name: p.name || p.slug || "Unknown",
      realName: p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : undefined,
      team: team.name,
      game: apiData.videogame?.slug || "unknown",
      avatar: p.image_url,
      nationality: p.nationality,
      role: p.role,
      stats: {}
    })) : [];
  };

  return {
    id: apiData.id,
    name: apiData.name ?? `${team1?.name ?? "TBD"} vs ${team2?.name ?? "TBD"}`,
    radiant: team1?.name ?? "TBD",
    dire: team2?.name ?? "TBD",
    radiant_id: team1?.id ?? null,
    dire_id: team2?.id ?? null,
    radiant_score: typeof team1?.id === "number" && scoresByTeam.has(team1.id) ? (scoresByTeam.get(team1.id) ?? 0) : fallbackScore(0),
    dire_score: typeof team2?.id === "number" && scoresByTeam.has(team2.id) ? (scoresByTeam.get(team2.id) ?? 0) : fallbackScore(1),
    start_time: new Date(apiData.begin_at ?? apiData.scheduled_at).getTime() / 1000,
    end_time: apiData.end_at ? new Date(apiData.end_at).getTime() / 1000 : null,
    league: apiData.league?.name ?? "",
    league_id: apiData.league?.id ?? null,
    serie: apiData.serie?.full_name ?? "",
    tournament: apiData.tournament?.name ?? "",
    tournament_id: apiData.tournament?.id ?? null,
    match_type: apiData.match_type ?? "",
    number_of_games: apiData.number_of_games ?? apiData.games?.length ?? 0,
    radiant_win: apiData.winner?.id !== undefined && team1?.id !== undefined ? apiData.winner.id === team1.id : null,
    game: apiData.videogame?.slug ?? "unknown",
    games: (apiData.games ?? []).map((g: any) => ({ id: g.id, position: g.position, status: g.status, begin_at: g.begin_at, end_at: g.end_at, winner_id: g.winner?.id ?? null })),
    streams: (apiData.streams_list ?? []).map((s: any) => ({ embed_url: s.embed_url || "", raw_url: s.raw_url || "", language: s.language || "en-US" })),
    players: {
      radiant: mapPlayers(team1),
      dire: mapPlayers(team2)
    }
  };
}

async function fetchMatch(matchId: string, forceRefresh = false): Promise<MatchDetail | null> {
  if (!forceRefresh) {
    const cached = matchCache.get(matchId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }
  try {
    const apiData = await fetchMatchAPI(matchId);
    const matchData = transformApiDataToMatchDetail(apiData);
    matchCache.set(matchId, { data: matchData, timestamp: Date.now() });
    return matchData;
  } catch (error) {
    console.error('Error fetching match data:', error);
    const cached = matchCache.get(matchId);
    if (cached?.data) return cached.data;
    return null;
  }
}

const LANGS: Language[] = [{ code: "es-ES", label: "Español" }, { code: "en-US", label: "English" }];

export default function MatchPage() {
  const params = useParams<{ matchId?: string | string[] }>();
  const rawMatchId = params?.matchId;
  const matchId = Array.isArray(rawMatchId) ? rawMatchId[0] : rawMatchId;

  if (!matchId) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<string>(LANGS[0].code);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);

  const isPageVisible = usePageVisibility();
  const isOnline = useOnlineStatus();

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      type: type as any,
      title: type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información',
      message,
      timestamp: Date.now(),
      read: false,
      priority: 'medium'
    };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  }, []);

  const loadMatchData = useCallback(async (forceRefresh = false) => {
    if (!matchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMatch(matchId, forceRefresh);
      if (data) {
        setMatch(data);
        setRetryCount(0);
      } else throw new Error('No se pudieron cargar los datos del partido');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      // Evitar mostrar notificación en el primer intento para no ser invasivo
      if (forceRefresh) {
        showNotification(`Error al actualizar: ${msg}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [matchId, showNotification]);

  // Efecto de reintento automático separado para evitar dependencia circular
  useEffect(() => {
    if (error && retryCount < 3) {
      const timeoutId = setTimeout(() => {
        setRetryCount(p => p + 1);
        loadMatchData(true);
      }, 2000 * (retryCount + 1));
      return () => clearTimeout(timeoutId);
    }
  }, [error, retryCount, loadMatchData]);

  useEffect(() => { if (matchId) loadMatchData(); }, [matchId, loadMatchData]);

  useEffect(() => {
    if (!match || !isPageVisible || !isOnline) return;
    const now = Date.now();
    const matchStartMs = match.start_time * 1000;
    const isLive = matchStartMs <= now && match.radiant_win === null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (isLive) {
      intervalId = setInterval(() => {
        if (isPageVisible && isOnline) loadMatchData(true);
      }, AUTO_REFRESH_INTERVAL_MS);
    } else if (match.radiant_win === null) {
      const delay = Math.max(0, Math.min(matchStartMs - now, AUTO_REFRESH_INTERVAL_MS));
      timeoutId = setTimeout(() => {
        if (isPageVisible && isOnline) loadMatchData(true);
      }, delay);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [match, isPageVisible, isOnline, loadMatchData]);

  useEffect(() => {
    const savedLang = localStorage.getItem("match_lang");
    if (savedLang && LANGS.some(l => l.code === savedLang)) setLang(savedLang);
    if (!match) return;
    const favs = JSON.parse(localStorage.getItem("favorites_matches") || "[]");
    setIsFavorite(favs.includes(match.id));

    // Set default tab based on match status
    const now = Date.now();
    const matchStartMs = match.start_time * 1000;
    const isLive = matchStartMs <= now && match.radiant_win === null;
    const hasStreams = match.streams && match.streams.length > 0;

    if (isLive && hasStreams) {
      setActiveTab("stream");
    }
  }, [match]);

  const toggleFavorite = useCallback(() => {
    if (!match) return;
    const favs = JSON.parse(localStorage.getItem("favorites_matches") || "[]");
    const newFavs = favs.includes(match.id) ? favs.filter((id: number) => id !== match.id) : [...favs, match.id];
    localStorage.setItem("favorites_matches", JSON.stringify(newFavs));
    setIsFavorite(newFavs.includes(match.id));
    showNotification(newFavs.includes(match.id) ? 'Partido añadido a favoritos' : 'Partido eliminado de favoritos', newFavs.includes(match.id) ? 'success' : 'info');
  }, [match, showNotification]);

  const handleLangChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem("match_lang", newLang);
    showNotification(`Idioma cambiado a ${LANGS.find(l => l.code === newLang)?.label || newLang}`, 'success');
  }, [showNotification]);

  // Estado de carga inicial
  if (!matchId || (loading && !match)) {
    return (
      <main className="p-4 sm:p-10 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Spinner size={48} />
          <p className="text-lg text-gray-400 font-semibold mt-4">Cargando partido...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espera mientras obtenemos la información</p>
        </div>
      </main>
    );
  }

  // Estado de error mejorado con opción de reintentar
  if (error && !loading) {
    return (
      <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 p-4 rounded-full bg-red-900/20 border border-red-500/30 w-20 h-20 flex items-center justify-center mx-auto">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Error al cargar el partido</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => loadMatchData(true)}
              className="px-6 py-3 bg-[var(--accent,#00FF80)] text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
            >
              Reintentar
            </button>
            <a
              href="/esports"
              className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors border border-gray-600"
            >
              Volver a partidos
            </a>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-gray-500 mt-4">Intentos de reconexión: {retryCount}/3</p>
          )}
        </div>
      </main>
    );
  }

  // Partido no encontrado
  if (!match) {
    return (
      <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 p-4 rounded-full bg-gray-800 border border-gray-600 w-20 h-20 flex items-center justify-center mx-auto">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-300 mb-2">Partido no encontrado</h2>
          <p className="text-gray-500 mb-6">El partido que buscas no existe o ha sido eliminado.</p>
          <a
            href="/esports"
            className="inline-block px-6 py-3 bg-[var(--accent,#00FF80)] text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
          >
            Ver todos los partidos
          </a>
        </div>
      </main>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'stream', label: 'Stream', hidden: !match.streams || match.streams.length === 0 },
    { id: 'games', label: 'Partidas', count: match.games?.length },
    { id: 'lineups', label: 'Alineaciones', hidden: !match.players?.radiant?.length && !match.players?.dire?.length },
    { id: 'predictions', label: 'Predicciones' },
  ].filter(t => !t.hidden);

  return (
    <main className="pt-16 pb-24 md:pb-10 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white" role="main" aria-labelledby="match-title">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MatchHeader matchName={match.name} lang={lang} langs={LANGS} onLangChange={handleLangChange} showNotification={showNotification} />

        {/* Notificaciones */}
        {notifications.length > 0 && (
          <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
            {notifications.map(n => (
              <div key={n.id} className={`pointer-events-auto px-4 py-3 rounded-lg shadow-xl border backdrop-blur-sm animate-slide-in-right transform transition-all ${n.type === 'success' ? 'bg-green-900/90 border-green-400/50 text-green-50' : n.type === 'error' ? 'bg-red-900/90 border-red-400/50 text-red-50' : 'bg-blue-900/90 border-blue-400/50 text-blue-50'}`}>
                <div className="flex items-center gap-3">
                  {n.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                  {n.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>}
                  {n.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  <p className="font-medium text-sm">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 animate-fade-in">
          <MatchCard match={match} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} lang={lang} />
        </div>

        {/* Tabs Navigation */}
        <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl border-b border-white/10 sm:border-none mb-8">
          <div className="flex overflow-x-auto no-scrollbar sm:gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 sm:py-3 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${activeTab === tab.id
                  ? 'text-[var(--accent,#00FF80)]'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-[var(--accent,#00FF80)]/20 text-[var(--accent,#00FF80)]' : 'bg-gray-800 text-gray-500'}`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent,#00FF80)] shadow-[0_-2px_8px_rgba(0,255,128,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'stream' && (
            <div className="animate-fade-in-up">
              <MatchStreams streams={match.streams} />
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
              <div className="lg:col-span-2 space-y-8">
                {/* Si hay stream y está en vivo, mostrarlo pequeño o un enlace rápido */}

                {/* Information Cards Detail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/50 transition-colors">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Detalles del Torneo</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-800 text-[var(--accent,#00FF80)]">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{match.tournament}</p>
                          <p className="text-sm text-gray-500">{match.league}</p>
                        </div>
                      </div>
                      {match.serie && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-800 text-purple-400">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                          </div>
                          <div>
                            <p className="text-white font-medium">{match.serie}</p>
                            <p className="text-sm text-gray-500">Serie</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/50 hover:border-gray-700/50 transition-colors">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Configuración</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-800 text-blue-400">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{match.game}</p>
                          <p className="text-sm text-gray-500">Videojuego</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-800 text-orange-400">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{match.match_type?.replace('_', ' ').toUpperCase() || 'BO3'}</p>
                          <p className="text-sm text-gray-500">Formato</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Games Preview */}
                {match.games && match.games.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Partidas Recientes</h3>
                      <button onClick={() => setActiveTab('games')} className="text-sm text-[var(--accent,#00FF80)] hover:underline">Ver todas</button>
                    </div>
                    <MatchGames
                      games={match.games.slice(0, 2)}
                      radiantName={match.radiant}
                      direName={match.dire}
                      radiantId={match.radiant_id}
                      direId={match.dire_id}
                    />
                  </div>
                )}
              </div>

              {/* Sidebar Content */}
              <div className="lg:col-span-1 space-y-6">
                {/* Connection Status & Refresh */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${isOnline ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`relative w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
                      {isOnline && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>}
                    </div>
                    <span className={`text-sm font-semibold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                      {isOnline ? 'Conexión Estable' : 'Sin Conexión'}
                    </span>
                  </div>
                  <button
                    onClick={() => loadMatchData(true)}
                    disabled={loading || !isOnline}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    aria-label="Refrescar datos"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'animate-spin' : ''}><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="p-1 rounded-2xl bg-gray-800/20 border border-gray-700/50">
                  <div className="p-4 border-b border-gray-700/50">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      Acciones
                    </h3>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={toggleFavorite}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${isFavorite
                        ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-sm font-medium">
                        {isFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        showNotification('Enlace copiado', 'success');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-left"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      <span className="text-sm font-medium">Copiar Enlace</span>
                    </button>
                  </div>
                </div>

                {/* Prediction Teaser */}
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-2">¿Quién ganará?</h3>
                  <p className="text-sm text-gray-400 mb-4">¡Haz tu predicción y compite con la comunidad!</p>
                  <button
                    onClick={() => setActiveTab('predictions')}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-purple-900/20"
                  >
                    Ir a Predicciones
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'games' && (
            <div className="animate-fade-in-up">
              <MatchGames
                games={match.games}
                radiantName={match.radiant}
                direName={match.dire}
                radiantId={match.radiant_id}
                direId={match.dire_id}
              />
            </div>
          )}

          {activeTab === 'lineups' && (
            <div className="animate-fade-in-up">
              <MatchLineups
                radiantName={match.radiant}
                direName={match.dire}
                radiantPlayers={match.players?.radiant}
                direPlayers={match.players?.dire}
                radiantId={match.radiant_id}
                direId={match.dire_id}
              />
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="animate-fade-in-up">
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
          )}
        </div>
      </div>
    </main>
  );
}
