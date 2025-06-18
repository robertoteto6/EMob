"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface MatchDetail {
  id: number;
  name: string;
  radiant: string;
  dire: string;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  league: string;
  radiant_win: boolean;
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
    radiant_score: m.results?.[0]?.score ?? 0,
    dire_score: m.results?.[1]?.score ?? 0,
    start_time: new Date(m.begin_at ?? m.scheduled_at).getTime() / 1000,
    league: m.league?.name ?? "",
    radiant_win:
      m.winner?.id !== undefined && team1?.id !== undefined
        ? m.winner.id === team1.id
        : false,
  } as MatchDetail;
}

export default function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<MatchDetail | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchMatch(matchId);
      setMatch(data);
    }
    load();
  }, [matchId]);

  if (!match) {
    return (
      <main className="p-4 sm:p-8 font-sans">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 font-sans space-y-4">
      <Link href="/esports" className="text-[var(--accent)] hover:underline">
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold">{match.name}</h1>
      <p className="text-sm text-gray-500">{match.league}</p>
      <p className="text-sm text-gray-400">
        {new Date(match.start_time * 1000).toLocaleString()}
      </p>
      <div className="card p-4 space-y-2">
        <div className="flex justify-between">
          <span>{match.radiant}</span>
          <span className="font-semibold">{match.radiant_score}</span>
        </div>
        <div className="flex justify-between">
          <span>{match.dire}</span>
          <span className="font-semibold">{match.dire_score}</span>
        </div>
        <p className="text-center font-semibold mt-2">
          Ganó {match.radiant_win ? match.radiant : match.dire}
        </p>
      </div>
    </main>
  );
}
