"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import MatchHeader from "../../components/MatchHeader";
import MatchCard from "../../components/MatchCard";
import MatchStreams from "../../components/MatchStreams";
import PredictionSystem from "../../components/PredictionSystem";
import Spinner from "../../components/Spinner";
import { MatchDetail, Notification, Language } from "../../lib/types";

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
    return {
        id: apiData.id,
        name: apiData.name ?? `${team1?.name ?? "TBD"} vs ${team2?.name ?? "TBD"}`,
        radiant: team1?.name ?? "TBD",
        dire: team2?.name ?? "TBD",
        radiant_id: team1?.id ?? null,
        dire_id: team2?.id ?? null,
        radiant_score: apiData.results?.[0]?.score ?? 0,
        dire_score: apiData.results?.[1]?.score ?? 0,
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

export default function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const [matchId, setMatchId] = useState<string | null>(null);
  useEffect(() => {
    params.then(p => setMatchId(p.matchId)).catch(console.error);
  }, [params]);

  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<string>(LANGS[0].code);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
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
    if (!match || !autoRefresh || !isPageVisible || !isOnline) return;
    const isLive = match.start_time <= (Date.now() / 1000) && match.radiant_win === null;
    if (!isLive) return;
    const interval = setInterval(() => { if (isPageVisible && isOnline) loadMatchData(true); }, 30000);
    return () => clearInterval(interval);
  }, [match, autoRefresh, isPageVisible, isOnline, loadMatchData]);

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
    <main className="p-4 sm:p-8 font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white" role="main" aria-labelledby="match-title">
      <div className="w-full max-w-6xl mx-auto">
        <MatchHeader matchName={match.name} lang={lang} langs={LANGS} onLangChange={handleLangChange} showNotification={showNotification} />

        {/* Notificaciones */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 rounded-lg shadow-xl border backdrop-blur-sm animate-slide-in-right ${ n.type === 'success' ? 'bg-green-900/95 border-green-400 text-green-50' : n.type === 'error' ? 'bg-red-900/95 border-red-400 text-red-50' : 'bg-blue-900/95 border-blue-400 text-blue-50' }`}>
                {n.message}
              </div>
            ))}
          </div>
        )}

        <MatchCard match={match} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} lang={lang} />
        
        <PredictionSystem matchId={match.id} matchTitle={match.name} game="esports" radiantTeam={match.radiant} direTeam={match.dire} isFinished={match.radiant_win !== null} actualWinner={match.radiant_win === true ? 'radiant' : match.radiant_win === false ? 'dire' : null} startTime={match.start_time} />

        <MatchStreams streams={match.streams} />

        {/* Resto de la UI (mapa a mapa, VODs, etc.) que también podría ser extraída */}
      </div>
    </main>
  );
}
