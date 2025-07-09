"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ChatBot from "../components/ChatBot";
import Countdown from "../components/Countdown";
import Search from "../components/Search";
import { MatchSkeleton, TournamentSkeleton } from "../components/Skeleton";

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
  return data.map((m: any) => {
    const team1 = m.opponents?.[0]?.opponent;
    const team2 = m.opponents?.[1]?.opponent;
    return {
      id: m.id,
      radiant: team1?.name ?? "TBD",
      dire: team2?.name ?? "TBD",
      radiant_score: m.results?.[0]?.score ?? 0,
      dire_score: m.results?.[1]?.score ?? 0,
      start_time: new Date(m.begin_at ?? m.scheduled_at).getTime() / 1000,
      league: m.league?.name ?? "",
      radiant_win:
        m.winner?.id !== undefined && team1?.id !== undefined
          ? m.winner.id === team1.id
          : null,
    } as Match;
  });
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMatches(game);
      setMatches(data);
      setLoading(false);
    }
    load();
  }, [game]);

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

  const filtered = matches.filter(matchOnSelectedDay);

  return (
    <main className="p-4 sm:p-8 font-sans flex">
      <aside className="w-48 pr-4 border-r border-[#2a2a2a]">
        <ul className="space-y-3">
          {GAMES.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => setGame(g.id)}
                aria-label={`Seleccionar juego ${g.name}`}
                className={`w-full text-left hover:text-[var(--accent)] ${
                  game === g.id ? "text-[var(--accent)] font-semibold" : "text-gray-300"
                }`}
              >
                <span className="flex items-center gap-3 text-lg">
                  <img src={g.icon} alt={g.name} title={g.name} className="w-6 h-6 invert" />
                  {g.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex-1 pl-4 flex gap-4">
        <div className="flex-1">
          <div className="mb-4">
            <Search game={game} />
          </div>
          <div className="flex justify-center gap-6 mb-4">
          {DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDayOffset(d.offset)}
              aria-label={`Ver partidos de ${d.label}`}
              className={`hover:text-[var(--accent)] ${
                dayOffset === d.offset ? "text-[var(--accent)] font-semibold" : "text-gray-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
          {loading ? (
            <ul className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MatchSkeleton key={i} />
              ))}
            </ul>
          ) : (
            <ul className="space-y-4">
              {filtered.map((match) => (
                <li key={match.id} className="card p-4">
                  <Link
                    href={`/esports/${match.id}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 hover:opacity-80"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">
                        {match.radiant} vs {match.dire}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(match.start_time * 1000).toLocaleString("es-ES")}
                      </p>
                      <p className="text-sm text-gray-500">{match.league}</p>
                    </div>
                    <div className="text-lg font-bold text-[var(--accent)] flex items-center gap-2">
                      {match.radiant_score}-{match.dire_score}
                      {(() => {
                        const now = Date.now() / 1000;
                        const started = match.start_time <= now;
                        const ended = match.radiant_win !== null;
                        if (started && !ended)
                          return (
                            <span className="ml-2 px-2 py-0.5 rounded bg-green-700 text-xs text-white">
                              En directo
                            </span>
                          );
                        return match.radiant_win === null ? (
                          <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-xs text-white">
                            Por jugar
                          </span>
                        ) : match.radiant_win ? (
                          <span className="ml-2 px-2 py-0.5 rounded bg-blue-700 text-xs text-white">
                            Radiant win
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-0.5 rounded bg-red-700 text-xs text-white">
                            Dire win
                          </span>
                        );
                      })()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ChatBot />
        </div>
        <aside className="w-64 border-l border-[#2a2a2a] pl-4 space-y-4">
          <h2 className="text-lg font-semibold">Torneos</h2>
          {loadingTournaments ? (
            <ul className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <TournamentSkeleton key={i} />
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {tournaments.map((t) => (
                <li key={t.id} className="card p-3">
                  <Link
                    href={`/esports/tournament/${t.id}`}
                    className="flex flex-col hover:opacity-80"
                  >
                    <span className="font-semibold">
                      {t.league} {t.serie}
                    </span>
                    <span className="text-sm text-gray-400">{t.name}</span>
                    {t.begin_at !== null && (
                      <span className="text-sm text-gray-400">
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
                      <span className="text-sm text-gray-500">{t.prizepool}</span>
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
