"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface PlayerDetail {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  role: string | null;
  image_url: string | null;
  current_team: string | null;
}

async function fetchPlayer(id: string): Promise<PlayerDetail | null> {
  const res = await fetch(`/api/esports/player/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as PlayerDetail;
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [player, setPlayer] = useState<PlayerDetail | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchPlayer(id);
      setPlayer(data);
    }
    load();
  }, [id]);

  if (!player) {
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
          {player.image_url && (
            <img src={player.image_url} alt="" className="w-8 h-8 object-contain" />
          )}
          {player.name}
        </h1>
        {player.current_team && (
          <p className="text-sm text-gray-400">Equipo: {player.current_team}</p>
        )}
        {player.role && <p className="text-sm">Rol: {player.role}</p>}
        {player.nationality && (
          <p className="text-sm">Nacionalidad: {player.nationality}</p>
        )}
        {player.first_name && player.last_name && (
          <p className="text-sm">Nombre real: {player.first_name} {player.last_name}</p>
        )}
      </div>
    </main>
  );
}
