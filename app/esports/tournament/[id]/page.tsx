"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import SearchLazy from "../../../components/SearchLazy";
import { getTeamImageUrl } from "../../../lib/imageFallback";

interface TournamentDetail {
  id: number;
  name: string;
  league: string;
  serie: string;
  begin_at: string | null;
  end_at: string | null;
  prizepool: string | null;
  tier: string | null;
  region: string | null;
  live_supported: boolean;
}

interface Team {
  id: number;
  name: string;
  image_url: string | null;
}

interface MatchInfo {
  id: number;
  radiant: string;
  dire: string;
  start_time: number;
}

async function fetchTournament(id: string): Promise<TournamentDetail | null> {
  const res = await fetch(`/api/esports/tournament/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const t = await res.json();
  return {
    id: t.id,
    name: t.name ?? "",
    league: t.league?.name ?? "",
    serie: t.serie?.full_name ?? "",
    begin_at: t.begin_at,
    end_at: t.end_at,
    prizepool: t.prizepool ?? null,
    tier: t.tier ?? null,
    region: t.region ?? null,
    live_supported: !!t.live_supported,
  };
}

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    async function load() {
      const data = await fetchTournament(id);
      setTournament(data);
      const res = await fetch(`/api/esports/matches?tournamentId=${id}`, { cache: "no-store" });
      if (res.ok) {
        const list = await res.json();
        const teamMap = new Map<number, Team>();
        const ms = (list as any[]).map((m) => {
          const t1 = m.opponents?.[0]?.opponent;
          const t2 = m.opponents?.[1]?.opponent;
          if (t1) teamMap.set(t1.id, { id: t1.id, name: t1.name, image_url: t1.image_url });
          if (t2) teamMap.set(t2.id, { id: t2.id, name: t2.name, image_url: t2.image_url });
          return {
            id: m.id,
            radiant: t1?.name ?? "TBD",
            dire: t2?.name ?? "TBD",
            start_time: new Date(m.begin_at ?? m.scheduled_at).getTime() / 1000,
          } as MatchInfo;
        });
        ms.sort((a, b) => a.start_time - b.start_time);
        setMatches(ms);
        setTeams(Array.from(teamMap.values()));
      }
    }
    load();
  }, [id]);

  if (!tournament) {
    return (
      <main className="p-4 sm:p-8 font-sans">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="pt-20 p-4 sm:p-8 font-sans space-y-4">
      <Link href="/esports" className="text-[var(--accent)] hover:underline">
        ← Volver
      </Link>
      <SearchLazy />
      <div className="card p-4 space-y-2">
        <h1 className="text-2xl font-bold">
          {tournament.league} {tournament.serie}
        </h1>
        <p className="text-sm text-gray-400">{tournament.name}</p>
        {tournament.begin_at && (
          <p className="text-sm text-gray-400">
            Desde {new Date(tournament.begin_at).toLocaleString("es-ES")} {tournament.end_at ? `hasta ${new Date(tournament.end_at).toLocaleString("es-ES")}` : ""}
          </p>
        )}
        {tournament.prizepool && <p className="text-sm">Premio: {tournament.prizepool}</p>}
        {tournament.region && <p className="text-sm">Región: {tournament.region}</p>}
        {tournament.tier && <p className="text-sm">Nivel: {tournament.tier.toUpperCase()}</p>}
      </div>
      {teams.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold mt-4">Equipos</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {teams.map((t) => (
              <li key={t.id} className="card p-2 flex items-center gap-2">
                <Image
                  src={getTeamImageUrl({ id: t.id, name: t.name, image_url: t.image_url })}
                  alt={t.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
                <span className="text-sm">{t.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {matches.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold mt-4">Partidos</h2>
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.id} className="card p-3">
                <Link
                  href={`/esports/${m.id}`}
                  className="flex justify-between items-center hover:opacity-80"
                >
                  <span>
                    {m.radiant} vs {m.dire}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(m.start_time * 1000).toLocaleString("es-ES")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
