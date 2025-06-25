"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

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

  useEffect(() => {
    async function load() {
      const data = await fetchTournament(id);
      setTournament(data);
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
    <main className="p-4 sm:p-8 font-sans space-y-4">
      <Link href="/esports" className="text-[var(--accent)] hover:underline">
        ← Volver
      </Link>
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
    </main>
  );
}
