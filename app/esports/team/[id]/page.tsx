"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Player {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  image_url: string | null;
}

interface TeamDetail {
  id: number;
  name: string;
  acronym: string | null;
  image_url: string | null;
  location: string | null;
  players: Player[];
}

async function fetchTeam(id: string): Promise<TeamDetail | null> {
  const res = await fetch(`/api/esports/team/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as TeamDetail;
}

export default function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [team, setTeam] = useState<TeamDetail | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchTeam(id);
      setTeam(data);
    }
    load();
  }, [id]);

  if (!team) {
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
      <div className="card p-4 space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {team.image_url && (
            <img src={team.image_url} alt="" className="w-8 h-8 object-contain" />
          )}
          {team.name}
          {team.acronym && <span className="text-sm text-gray-400">({team.acronym})</span>}
        </h1>
        {team.location && <p className="text-sm text-gray-400">Ubicación: {team.location}</p>}
      </div>
      {team.players.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold mt-4">Jugadores</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {team.players.map((p) => (
              <li key={p.id} className="card p-2 flex items-center gap-2">
                {p.image_url && (
                  <img src={p.image_url} alt="" className="w-6 h-6 object-contain" />
                )}
                <span className="text-sm">
                  {p.name}
                  {p.nationality && ` (${p.nationality})`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
