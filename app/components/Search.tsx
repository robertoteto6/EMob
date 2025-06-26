"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchItem {
  id: number;
  name: string;
  type: "team" | "player" | "match";
  image_url: string | null;
}

export default function Search({ game = "dota2" }: { game?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/esports/search?q=${encodeURIComponent(query)}&game=${game}`, {
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

  function select(item: SearchItem) {
    const base = item.type === "team" ? "team" : item.type === "player" ? "player" : "";
    const path = base ? `/esports/${base}/${item.id}` : `/esports/${item.id}`;
    router.push(path);
    setQuery("");
    setShow(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder="Buscar..."
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        className="w-full bg-[#0f0f0f] border border-[#2a2a2a] p-2 rounded"
      />
      {show && results.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 bg-[#0f0f0f] border border-[#2a2a2a] mt-1 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>\
              <button
                onClick={() => select(r)}
                className="flex items-center gap-2 w-full text-left p-2 hover:bg-[#1a1a1a]"
              >
                {r.image_url && (
                  <img src={r.image_url} alt="" className="w-5 h-5 object-contain" />
                )}
                <span>{r.name}</span>
                <span className="ml-auto text-xs text-gray-400">{r.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
