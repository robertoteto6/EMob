"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ChatBot from "../components/ChatBot";
import Countdown from "../components/Countdown";
import Search from "../components/Search";
import { MatchSkeleton, TournamentSkeleton } from "../components/Skeleton";

// Icono de favorito (estrella)
function Star({ filled, ...props }: { filled: boolean; [key: string]: any }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill={filled ? "#FFD700" : "none"}
      stroke="#FFD700"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="10,2 12.59,7.36 18.51,7.63 13.97,11.61 15.45,17.37 10,14.13 4.55,17.37 6.03,11.61 1.49,7.63 7.41,7.36" />
    </svg>
  );
}

interface Match {
  id: number;
  radiant: string;
  dire: string;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  league: string;
  radiant_win: boolean | null;
}

interface Tournament {
  id: number;
  name: string;
  begin_at: number | null;
  end_at: number | null;
  league: string;
  serie: string;
  prizepool: string | null;
  tier: string | null;
  region: string | null;
  live_supported: boolean;
}

const GAMES = [
  { id: "dota2", name: "Dota 2", icon: "/dota2.svg" },
  { id: "lol", name: "LoL", icon: "/leagueoflegends.svg" },
  { id: "csgo", name: "CS2", icon: "/counterstrike.svg" },
  { id: "r6siege", name: "Rainbow Six Siege", icon: "/ubisoft.svg" },
];

const DAYS = [
  { id: "yesterday", label: "Ayer", offset: -1 },
  { id: "today", label: "Hoy", offset: 0 },
  { id: "tomorrow", label: "Mañana", offset: 1 },
];

async function fetchMatches(game: string): Promise<Match[]> {
  const res = await fetch(`/api/esports/matches?game=${game}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Failed to fetch matches", await res.text());
    return [];
  }
  const data = await res.json();
  return data
    .map((m: any) => {
      const team1 = m.opponents?.[0]?.opponent;
      const team2 = m.opponents?.[1]?.opponent;
      // Validar fecha
      const dateStr = m.begin_at ?? m.scheduled_at;
      const date = dateStr ? new Date(dateStr) : null;
      const start_time = date && !isNaN(date.getTime()) ? date.getTime() / 1000 : null;
      // Validar resultados
      const radiant_score = Array.isArray(m.results) && m.results[0]?.score != null ? m.results[0].score : null;
      const dire_score = Array.isArray(m.results) && m.results[1]?.score != null ? m.results[1].score : null;
      return {
        id: m.id,
        radiant: team1?.name ?? "TBD",
        dire: team2?.name ?? "TBD",
        radiant_score,
        dire_score,
        start_time,
        league: m.league?.name ?? "",
        radiant_win:
          m.winner?.id !== undefined && team1?.id !== undefined
            ? m.winner.id === team1.id
            : null,
      } as Match;
    })
    .filter((m: Match) => m.start_time !== null); // Filtrar partidos sin fecha válida
}

async function fetchTournaments(game: string): Promise<Tournament[]> {
  const res = await fetch(`/api/esports/tournaments?game=${game}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Failed to fetch tournaments", await res.text());
    return [];
  }
  const data = await res.json();
  return data.map((t: any) => ({
    id: t.id,
    name: t.name ?? "",
    begin_at: t.begin_at ? new Date(t.begin_at).getTime() / 1000 : null,
    end_at: t.end_at ? new Date(t.end_at).getTime() / 1000 : null,
    league: t.league?.name ?? "",
    serie: t.serie?.full_name ?? "",
    prizepool: t.prizepool ?? null,
    tier: t.tier ?? null,
    region: t.region ?? null,
    live_supported: !!t.live_supported,
  })) as Tournament[];
}

export default function EsportsPage() {
  const [game, setGame] = useState<string>(GAMES[0].id);
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState<boolean>(true);
  // Favoritos: ids de partidos favoritos
  const [favoriteMatches, setFavoriteMatches] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("favoriteMatches") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });
  // Filtros adicionales
  const [filterLeague, setFilterLeague] = useState<string>("");
  const [filterTeam, setFilterTeam] = useState<string>("");
  // Paginación
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Resetear página a 1 cuando cambian los filtros o el día
  useEffect(() => {
    setPage(1);
  }, [filterLeague, filterTeam, dayOffset, game]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMatches(game);
      setMatches(data);
      setLoading(false);
    }
    load();
  }, [game]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favoriteMatches", JSON.stringify(favoriteMatches));
    }
  }, [favoriteMatches]);

  useEffect(() => {
    async function load() {
      setLoadingTournaments(true);
      const data = await fetchTournaments(game);
      const now = Date.now() / 1000;
      const upcomingOrLive = data.filter((t) => {
        if (t.begin_at === null) return false;
        const started = t.begin_at <= now;
        const ended = t.end_at !== null && t.end_at < now;
        return !ended && (started || t.begin_at - now < 60 * 60 * 24 * 45);
      });
      upcomingOrLive.sort((a, b) => (a.begin_at ?? 0) - (b.begin_at ?? 0));
      const important = upcomingOrLive.filter((t) =>
        ["s", "a"].includes((t.tier ?? "").toLowerCase())
      );
      const list = important.length > 0 ? important : upcomingOrLive;
      setTournaments(list.slice(0, 5));
      setLoadingTournaments(false);
    }
    load();
  }, [game]);

  function matchOnSelectedDay(match: Match) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dayStart = new Date(startOfToday);
    dayStart.setDate(dayStart.getDate() + dayOffset);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const ms = match.start_time * 1000;
    return ms >= dayStart.getTime() && ms < dayEnd.getTime();
  }

  // Filtrado avanzado y favoritos
  const filtered = useMemo(() => {
    let res = matches.filter(matchOnSelectedDay);
    if (filterLeague) {
      res = res.filter((m) => m.league.toLowerCase().includes(filterLeague.toLowerCase()));
    }
    if (filterTeam) {
      res = res.filter(
        (m) =>
          m.radiant.toLowerCase().includes(filterTeam.toLowerCase()) ||
          m.dire.toLowerCase().includes(filterTeam.toLowerCase())
      );
    }
    return res;
  }, [matches, dayOffset, filterLeague, filterTeam]);

  // Paginación de partidos filtrados
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const favoriteList = useMemo(
    () => matches.filter((m) => favoriteMatches.includes(m.id)),
    [matches, favoriteMatches]
  );

  // Estadísticas rápidas
  const stats = useMemo(() => {
    return {
      total: filtered.length,
      favoritos: favoriteList.length,
      hoy: matches.filter(m => {
        if (!m.start_time) return false;
        const now = new Date();
        const ms = m.start_time * 1000;
        return new Date(ms).toDateString() === now.toDateString();
      }).length,
      equipos: Array.from(new Set(matches.flatMap(m => [m.radiant, m.dire]))).length,
      ligas: Array.from(new Set(matches.map(m => m.league))).length,
    };
  }, [filtered, favoriteList, matches]);

  // Dark/Light mode toggle (mejorado y fuera del dashboard)
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "light") setDark(false);
    else setDark(true);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Ajustes modal
  const [showSettings, setShowSettings] = useState(false);

  // Paleta de colores y mejoras visuales
  // Puedes personalizar estos estilos en tu CSS global para un look más moderno

  // Paleta de colores: negro puro y detalles en verde
  // --accent: #00FF80 (verde), --accent-dark: #00995c
  // Fondo: negro puro
  // Asegúrate de tener en tu CSS global:
  // :root { --accent: #00FF80; --accent-dark: #00995c; }

  return (
    <main className={"p-4 sm:p-8 font-sans flex min-h-screen transition-colors duration-300 bg-black text-white"} style={{ background: '#000' }}>
      {/* Botón de ajustes flotante */}
      <button
        aria-label="Abrir ajustes"
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-50 bg-[var(--accent,#00FF80)] text-black rounded-full shadow-lg p-2 hover:scale-110 transition-transform border-2 border-[#222]"
        title="Ajustes"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="9"/><path d="M11 7v4l2 2"/></svg>
      </button>
      {/* Modal de ajustes */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#23272f] rounded-lg p-6 min-w-[300px] shadow-2xl relative">
            <button
              aria-label="Cerrar ajustes"
              onClick={() => setShowSettings(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4">Ajustes</h2>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm">Tema:</span>
              <button
                aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                onClick={() => setDark((d) => !d)}
                className={`rounded px-3 py-1 text-sm font-semibold border border-[#333] transition-colors ${dark ? 'bg-[#181818] text-yellow-300' : 'bg-[#f7f7f7] text-gray-800'}`}
                title={dark ? "Modo claro" : "Modo oscuro"}
              >
                {dark ? "☀️ Claro" : "🌙 Oscuro"}
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-4">Más opciones próximamente...</div>
          </div>
        </div>
      )}
      <aside className="w-48 pr-4 border-r border-[#222] bg-[#111] rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-base tracking-wide text-[var(--accent,#00FF80)]">Juegos</span>
        </div>
        <ul className="space-y-3">
          {GAMES.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => setGame(g.id)}
                aria-label={`Seleccionar juego ${g.name}`}
                className={`w-full text-left rounded-lg px-2 py-2 transition-colors duration-150 flex items-center gap-3 text-lg border border-transparent hover:border-[var(--accent,#00FF80)] hover:bg-[#181c24] ${
                  game === g.id ? "bg-[var(--accent,#00FF80)] text-black font-semibold shadow-md" : "text-gray-300"
                }`}
              >
                <img src={g.icon} alt={g.name} title={g.name} className="w-6 h-6" style={{ filter: game === g.id ? 'none' : 'invert(1)' }} />
                {g.name}
              </button>
            </li>
          ))}
        </ul>
        {/* Estadísticas rápidas */}
        <div className="mt-8 p-3 rounded-xl bg-[#181c24] border border-[#222] text-xs text-green-400 space-y-1 shadow">
          <div><b>Partidos filtrados:</b> {stats.total}</div>
          <div><b>Favoritos:</b> {stats.favoritos}</div>
          <div><b>Partidos hoy:</b> {stats.hoy}</div>
          <div><b>Equipos únicos:</b> {stats.equipos}</div>
          <div><b>Ligas únicas:</b> {stats.ligas}</div>
        </div>
      </aside>
      <div className="flex-1 pl-4 flex gap-4">
        {/* Eliminado fondo decorativo visual */}
        <div className="flex-1 relative z-10">
          <div className="mb-4">
            <Search game={game} />
          </div>
          {/* Filtros avanzados */}
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <div>
              <input
                type="text"
                placeholder="Filtrar por liga..."
                value={filterLeague}
                onChange={e => setFilterLeague(e.target.value)}
                className="input input-sm bg-[#111] border border-[var(--accent,#00FF80)] rounded px-2 py-1 text-sm text-green-400 focus:ring-2 focus:ring-[var(--accent,#00FF80)] placeholder:text-green-900"
                aria-label="Filtrar por liga"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filtrar por equipo..."
                value={filterTeam}
                onChange={e => setFilterTeam(e.target.value)}
                className="input input-sm bg-[#111] border border-[var(--accent,#00FF80)] rounded px-2 py-1 text-sm text-green-400 focus:ring-2 focus:ring-[var(--accent,#00FF80)] placeholder:text-green-900"
                aria-label="Filtrar por equipo"
              />
            </div>
          </div>
          <div className="flex justify-center gap-6 mb-4">
            {DAYS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDayOffset(d.offset)}
                aria-label={`Ver partidos de ${d.label}`}
                className={`rounded-full px-4 py-1 border border-transparent transition-colors duration-150 hover:border-[var(--accent,#00FF80)] hover:bg-[#181c24] ${
                  dayOffset === d.offset ? "bg-[var(--accent,#00FF80)] text-black font-semibold shadow" : "text-green-400"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {/* Favoritos */}
          {favoriteList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2 flex items-center gap-2 text-[var(--accent,#00FF80)]">
                <Star filled={true} /> Partidos favoritos
              </h3>
              <ul className="space-y-2">
                {favoriteList.map((match) => (
                  <li key={match.id} className="card p-3 flex items-center gap-2 bg-[#181c24] rounded-lg border border-[#222] shadow">
                    <button
                      aria-label="Quitar de favoritos"
                      onClick={() => setFavoriteMatches(favoriteMatches.filter(id => id !== match.id))}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star filled={true} />
                    </button>
                    <Link href={`/esports/${match.id}`} className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 hover:opacity-80">
                      <span className="font-semibold">{match.radiant} vs {match.dire}</span>
                      <span className="text-sm text-green-400">{new Date(match.start_time * 1000).toLocaleString("es-ES")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {loading ? (
            <ul className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MatchSkeleton key={i} />
              ))}
            </ul>
          ) : (
            <>
              <ul className="space-y-4">
                {paginated.map((match) => (
                  <li key={match.id} className="card p-4 flex items-center gap-2 bg-[#181c24] rounded-lg border border-[#222] shadow-md hover:scale-[1.015] transition-transform">
                    <button
                      aria-label={favoriteMatches.includes(match.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                      onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        setFavoriteMatches(fav =>
                          fav.includes(match.id)
                            ? fav.filter(id => id !== match.id)
                            : [...fav, match.id]
                        );
                      }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star filled={favoriteMatches.includes(match.id)} />
                    </button>
                    <Link
                      href={`/esports/${match.id}`}
                      className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 hover:opacity-80"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-lg text-green-400">
                          {match.radiant} <span className="text-green-900">vs</span> {match.dire}
                        </p>
                        <p className="text-sm text-green-900">
                          {match.start_time ? new Date(match.start_time * 1000).toLocaleString("es-ES") : "Sin fecha"}
                        </p>
                        <p className="text-sm text-green-800">{match.league}</p>
                      </div>
                      <div className="text-lg font-bold text-[var(--accent,#00FF80)] flex items-center gap-2">
                        {typeof match.radiant_score === "number" && typeof match.dire_score === "number" ?
                          `${match.radiant_score}-${match.dire_score}` :
                          "TBD"
                        }
                        {(() => {
                          const now = Date.now() / 1000;
                          const started = match.start_time && match.start_time <= now;
                          const ended = match.radiant_win !== null;
                          if (started && !ended)
                            return (
                              <span className="ml-2 px-2 py-0.5 rounded bg-green-700 text-xs text-white animate-pulse">
                                En directo
                              </span>
                            );
                          return match.radiant_win === null ? (
                            <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-xs text-white">
                              Por jugar
                            </span>
                          ) : match.radiant_win ? (
                            <span className="ml-2 px-2 py-0.5 rounded bg-green-800 text-xs text-white">
                              Radiant win
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-0.5 rounded bg-green-900 text-xs text-white">
                              Dire win
                            </span>
                          );
                        })()}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 rounded bg-[#222] text-white disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-[var(--accent)] text-black' : 'bg-[#222] text-white'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 rounded bg-[#222] text-white disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
          <ChatBot />
        </div>
        <aside className="w-64 border-l border-[#222] pl-4 space-y-4">
          <h2 className="text-lg font-semibold text-green-400">Torneos</h2>
          {loadingTournaments ? (
            <ul className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <TournamentSkeleton key={i} />
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {tournaments.map((t) => (
                <li key={t.id} className="card p-3 bg-[#181c24] rounded-lg border border-[#222] shadow">
                  <Link
                    href={`/esports/tournament/${t.id}`}
                    className="flex flex-col hover:opacity-80"
                  >
                    <span className="font-semibold text-green-400">
                      {t.league} {t.serie}
                    </span>
                    <span className="text-sm text-green-900">{t.name}</span>
                    {t.begin_at !== null && (
                      <span className="text-sm text-green-700">
                        {(() => {
                          const now = Date.now() / 1000;
                          const started = t.begin_at <= now;
                          const ended = t.end_at !== null && t.end_at < now;
                          if (started && !ended) return "En directo";
                          if (!started)
                            return <Countdown targetTime={t.begin_at} />;
                          return "Finalizado";
                        })()}
                      </span>
                    )}
                    {t.prizepool && (
                      <span className="text-sm text-green-800">{t.prizepool}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
