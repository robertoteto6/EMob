"use client";

import { useEffect, useState, useCallback, use } from "react";
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

export default function MatchPage(props: { params: Promise<{ matchId: string }> }) {
  const params = use(props.params);
  const matchId = params.matchId;

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
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
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
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M8 11h6"/>
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

  return (
    <main className="pt-16 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white" role="main" aria-labelledby="match-title">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8">
        <MatchHeader matchName={match.name} lang={lang} langs={LANGS} onLangChange={handleLangChange} showNotification={showNotification} />

        {/* Notificaciones */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 rounded-lg shadow-xl border backdrop-blur-sm animate-slide-in-right ${n.type === 'success' ? 'bg-green-900/95 border-green-400 text-green-50' : n.type === 'error' ? 'bg-red-900/95 border-red-400 text-red-50' : 'bg-blue-900/95 border-blue-400 text-blue-50'}`}>
                {n.message}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <MatchCard match={match} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} lang={lang} />
        </div>

        {/* Streams Section */}
        {match.streams && match.streams.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full"></span>
              Transmisiones en Vivo
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full font-semibold">
                {match.streams.length} disponible{match.streams.length > 1 ? 's' : ''}
              </span>
            </h3>
            <MatchStreams streams={match.streams} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left/Main Column: Games, Lineups, Predictions */}
          <div className="lg:col-span-2 space-y-8">
            <MatchGames 
              games={match.games} 
              radiantName={match.radiant} 
              direName={match.dire} 
              radiantId={match.radiant_id}
              direId={match.dire_id}
            />

            <MatchLineups
              radiantName={match.radiant}
              direName={match.dire}
              radiantPlayers={match.players?.radiant}
              direPlayers={match.players?.dire}
              radiantId={match.radiant_id}
              direId={match.dire_id}
            />

            {/* Predictions Section */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                Sistema de Predicciones
              </h3>
              <div className="p-6 rounded-xl bg-gray-800/40 border border-gray-700/50">
                <PredictionSystem matchId={match.id} matchTitle={match.name} game="esports" radiantTeam={match.radiant} direTeam={match.dire} isFinished={match.radiant_win !== null} actualWinner={match.radiant_win === true ? 'radiant' : match.radiant_win === false ? 'dire' : null} startTime={match.start_time} />
              </div>
            </div>
          </div>

          {/* Right Column: Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Match Result Summary - Show when match is finished */}
            {match.radiant_win !== null && (
              <div className={`p-6 rounded-2xl border ${match.radiant_win ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${match.radiant_win ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={match.radiant_win ? 'text-green-400' : 'text-red-400'}>
                      <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Partido Finalizado</p>
                    <p className={`text-lg font-bold ${match.radiant_win ? 'text-green-400' : 'text-red-400'}`}>
                      {match.radiant_win ? match.radiant : match.dire} Victoria
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20">
                  <span className="text-sm text-gray-300">{match.radiant}</span>
                  <span className="text-xl font-bold text-white">{match.radiant_score} - {match.dire_score}</span>
                  <span className="text-sm text-gray-300">{match.dire}</span>
                </div>
                {match.end_time && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Duración total: {Math.round((match.end_time - match.start_time) / 60)} minutos
                  </p>
                )}
              </div>
            )}

            {/* Match Info Card */}
            <div className="p-6 rounded-2xl bg-gray-800/20 border border-gray-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent,#00FF80)]">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Información del Partido
              </h3>
              <div className="space-y-4">
                {/* Game */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Juego</p>
                    <p className="text-sm text-gray-200 capitalize">{match.game.replace(/-/g, ' ')}</p>
                  </div>
                </div>

                {/* Match Status */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                    <p className={`text-sm font-semibold ${
                      match.radiant_win !== null ? 'text-gray-400' :
                      match.start_time * 1000 <= Date.now() ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {match.radiant_win !== null ? 'Finalizado' :
                       match.start_time * 1000 <= Date.now() ? 'En Vivo' : 'Programado'}
                    </p>
                  </div>
                </div>

                {/* Match Type/Format */}
                {match.match_type && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-800">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Formato</p>
                      <p className="text-sm text-gray-200">{match.match_type.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  </div>
                )}

                {/* Number of Games */}
                {match.number_of_games > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-800">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Número de Mapas</p>
                      <p className="text-sm text-gray-200">Mejor de {match.number_of_games}</p>
                    </div>
                  </div>
                )}

                {/* Start Time */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Fecha y Hora</p>
                    <p className="text-sm text-gray-200">
                      {new Date(match.start_time * 1000).toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(match.start_time * 1000).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament/Competition Info */}
            {(match.league || match.tournament || match.serie) && (
              <div className="p-6 rounded-2xl bg-gray-800/20 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                  </svg>
                  Competición
                </h3>
                <div className="space-y-4">
                  {match.league && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-yellow-900/20">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Liga</p>
                        <p className="text-sm text-gray-200">{match.league}</p>
                      </div>
                    </div>
                  )}

                  {match.serie && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gray-800">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Serie</p>
                        <p className="text-sm text-gray-200">{match.serie}</p>
                      </div>
                    </div>
                  )}

                  {match.tournament && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gray-800">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Torneo</p>
                        {match.tournament_id ? (
                          <a href={`/esports/tournament/${match.tournament_id}`} className="text-sm text-[var(--accent,#00FF80)] hover:underline">
                            {match.tournament}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-200">{match.tournament}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-gray-800/20 border border-gray-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Acciones Rápidas
              </h3>
              <div className="space-y-2">
                <button
                  onClick={toggleFavorite}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    isFavorite 
                      ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400' 
                      : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span className="text-sm font-semibold">
                    {isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  </span>
                </button>

                <button
                  onClick={() => loadMatchData(true)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600 transition-all text-left disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'animate-spin' : ''}>
                    <path d="M23 4v6h-6"/>
                    <path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  <span className="text-sm font-semibold">
                    {loading ? 'Actualizando...' : 'Actualizar datos'}
                  </span>
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className={`p-4 rounded-xl border ${
              isOnline 
                ? 'bg-green-900/10 border-green-500/20' 
                : 'bg-red-900/10 border-red-500/20'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`text-xs font-semibold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                  {isOnline ? 'Conectado' : 'Sin conexión'}
                </span>
              </div>
              {!isOnline && (
                <p className="text-xs text-gray-500 mt-2">
                  Los datos se actualizarán cuando vuelva la conexión
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
