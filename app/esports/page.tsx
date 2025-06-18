"use client";

import { useEffect, useState } from "react";

interface Match {
  id: number;
  radiant: string;
  dire: string;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  league: string;
  radiant_win: boolean;
}

const PANDA_SCORE_TOKEN =
  "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

const GAMES = [
  { id: "dota2", name: "Dota 2" },
  { id: "league-of-legends", name: "LoL" },
  { id: "cs2", name: "CS2" },
];

const DAYS = [
  { id: "yesterday", label: "Ayer", offset: -1 },
  { id: "today", label: "Hoy", offset: 0 },
  { id: "tomorrow", label: "Mañana", offset: 1 },
];

async function fetchMatches(game: string): Promise<Match[]> {
  const res = await fetch(
    `https://api.pandascore.co/${game}/matches?per_page=50&token=${PANDA_SCORE_TOKEN}`,
    { cache: "no-store" }
  );
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
          : false,
    } as Match;
  });
}

export default function EsportsPage() {
  const [game, setGame] = useState<string>(GAMES[0].id);
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMatches(game);
      setMatches(data);
      setLoading(false);
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
      <aside className="w-36 pr-4 border-r border-[#2a2a2a]">
        <ul className="space-y-2">
          {GAMES.map((g) => (
            <li key={g.id}>
              <button
                onClick={() => setGame(g.id)}
                className={`w-full text-left hover:text-[var(--accent)] ${
                  game === g.id ? "text-[var(--accent)] font-semibold" : "text-gray-300"
                }`}
              >
                {g.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex-1 pl-4">
        <div className="flex justify-center gap-6 mb-4">
          {DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDayOffset(d.offset)}
              className={`hover:text-[var(--accent)] ${
                dayOffset === d.offset ? "text-[var(--accent)] font-semibold" : "text-gray-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul className="space-y-4">
            {filtered.map((match) => (
              <li
                key={match.id}
                className="card p-4 flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <div className="flex-1">
                  <p className="font-semibold">
                    {match.radiant} vs {match.dire}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(match.start_time * 1000).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{match.league}</p>
                </div>
                <div className="text-lg font-bold text-[var(--accent)]">
                  {match.radiant_score}-{match.dire_score}{" "}
                  {match.radiant_win ? "(Radiant win)" : "(Dire win)"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
