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
    serie: apiData.serie?.full_name ?? "",
    tournament: apiData.tournament?.name ?? "",
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
      showNotification(`Error: ${msg}`, 'error');
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(p => p + 1);
          loadMatchData(forceRefresh);
        }, 2000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  }, [matchId, retryCount, showNotification]);

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

  if (!matchId || (loading && !match)) return <main className="p-4 sm:p-10 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center"><div className="text-center"><Spinner size={48} /><p className="text-lg text-gray-400 font-semibold mt-4">Cargando...</p></div></main>;
  if (error && !loading) return <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center"><div>Error: {error}</div></main>;
  if (!match) return <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center"><div>Partido no encontrado</div></main>;

  return (
    <main className="pt-20 p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white" role="main" aria-labelledby="match-title">
      <div className="w-full max-w-6xl mx-auto">
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

        <MatchCard match={match} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} lang={lang} />

        <div className="mb-10">
          <MatchStreams streams={match.streams} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Left/Main Column: Games, Lineups, Predictions */}
          <div className="lg:col-span-2 space-y-8">
            <MatchGames games={match.games} radiantName={match.radiant} direName={match.dire} />

            <MatchLineups
              radiantName={match.radiant}
              direName={match.dire}
              radiantPlayers={match.players?.radiant}
              direPlayers={match.players?.dire}
            />

            <PredictionSystem matchId={match.id} matchTitle={match.name} game="esports" radiantTeam={match.radiant} direTeam={match.dire} isFinished={match.radiant_win !== null} actualWinner={match.radiant_win === true ? 'radiant' : match.radiant_win === false ? 'dire' : null} startTime={match.start_time} />
          </div>

          {/* Right Column: Information */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl bg-gray-800/20 border border-gray-700/50 flex items-center justify-center text-gray-500 italic text-sm">
              Información adicional del partido
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
