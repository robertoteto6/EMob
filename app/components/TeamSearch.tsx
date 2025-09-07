"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Team {
  id: number;
  name: string;
  image_url: string | null;
}

export default function TeamSearch({ game = "dota2" }: { game?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/esports/teams?q=${encodeURIComponent(query)}&game=${game}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setResults(data))
      .catch(() => {});
    return () => controller.abort();
  }, [query, game]);

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
                {t.image_url && (
                  <Image
                    src={t.image_url}
                    alt={`Logotipo de ${t.name}`}
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                )}
                <span>{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
