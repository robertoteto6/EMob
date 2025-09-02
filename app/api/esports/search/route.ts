import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { apiCache } from "../../../lib/utils";

// Mapeo de IDs de juegos a los nombres de la API de PandaScore
const GAME_MAPPING: Record<string, string> = {
  "dota2": "dota2",
  "lol": "lol", 
  "csgo": "csgo",
  "r6siege": "r6siege",
  "ow": "ow", // Overwatch usa "ow" en PandaScore
  "overwatch": "ow" // Fallback para compatibilidad
};

async function fetchJSON(base: string, params: string) {
  try {
    const searchParams = new URLSearchParams(params);
    searchParams.delete('token'); // Remove token since handled in pandaScoreFetch
    const res = await pandaScoreFetch(base, searchParams, { cache: "no-store" });
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const gameParam = searchParams.get("game") || undefined;

  if (!q) {
    return NextResponse.json([]);
  }

  const cacheKey = `search:${gameParam || 'all'}:${q}`;
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const gameList = gameParam ? [gameParam] : Object.keys(GAME_MAPPING);
  const results: any[] = [];

  for (const gameParam of gameList) {
    // Mapear el juego al nombre correcto de la API
    const g = GAME_MAPPING[gameParam] || gameParam;
    
    const encoded = encodeURIComponent(q);
    const base = `https://api.pandascore.co/${g}`;
    const params = `per_page=5&search%5Bname%5D=${encoded}`;

    try {
      const [teams, players, tournaments, matches] = await Promise.all([
        fetchJSON(`${base}/teams`, params),
        fetchJSON(`${base}/players`, params),
        fetchJSON(`${base}/tournaments`, params),
        fetchJSON(`${base}/matches`, params),
      ]);

      teams.forEach((t: any) => {
        results.push({
          id: t.id,
          name: t.name,
          type: "team",
          image_url: t.image_url ?? null,
          league: t.league?.name ?? undefined,
          game: gameParam,
        });
      });

      players.forEach((p: any) => {
        results.push({
          id: p.id,
          name: p.name,
          type: "player",
          image_url: p.image_url ?? null,
          game: gameParam,
        });
      });

      tournaments.forEach((t: any) => {
        results.push({
          id: t.id,
          name: t.name,
          type: "tournament",
          image_url: t.league?.image_url ?? null,
          league: t.league?.name ?? undefined,
          game: gameParam,
        });
      });

      matches.forEach((m: any) => {
        const radiant = m.opponents?.[0]?.opponent?.name ?? "TBD";
        const dire = m.opponents?.[1]?.opponent?.name ?? "TBD";
        results.push({
          id: m.id,
          name: `${radiant} vs ${dire}`,
          type: "match",
          image_url: null,
          league: m.league?.name ?? undefined,
          game: gameParam,
          status: m.status ?? undefined,
        });
      });
    } catch (err) {
      console.error("Search API error:", err);
    }
  }

  const sliced = results.slice(0, 50);
  apiCache.set(cacheKey, sliced);
  return NextResponse.json(sliced);
}
