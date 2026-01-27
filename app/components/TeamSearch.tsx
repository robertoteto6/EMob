"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getTeamImageUrl } from "../lib/imageFallback";
import { useGameStore } from "../contexts/GameContext";

interface Team {
  id: number;
  name: string;
  image_url: string | null;
}

export default function TeamSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Usar juegos seleccionados del contexto global
  const { selectedGames } = useGameStore();
  const gamesParam = selectedGames.length > 0 ? selectedGames.join(',') : '';

  useEffect(() => {
    if (query.length < 2 || !gamesParam) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/esports/teams?q=${encodeURIComponent(query)}&games=${gamesParam}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setResults(data))
      .catch(() => {});
    return () => controller.abort();
  }, [query, gamesParam]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  function select(team: Team) {
    router.push(`/esports/team/${team.id}`);
    setQuery("");
    setShow(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder="Buscar equipo..."
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] p-2 rounded"
      />
      {show && results.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 bg-[#0f0f0f] border border-[#2a2a2a] mt-1 max-h-48 overflow-y-auto">
          {results.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => select(t)}
                className="flex items-center gap-2 w-full text-left p-2 hover:bg-[#1a1a1a]"
              >
                <Image
                  src={getTeamImageUrl({ id: t.id, name: t.name, image_url: t.image_url })}
                  alt={`Logotipo de ${t.name}`}
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <span>{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
