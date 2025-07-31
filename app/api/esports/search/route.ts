import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";
const GAMES = ["dota2", "lol", "csgo", "r6siege", "overwatch"];

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: "no-store", dispatcher: getProxyAgent() } as RequestInit & { dispatcher?: any });
  if (!res.ok) return [];
  try {
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const game = searchParams.get("game") || undefined;

  if (!q) {
    return NextResponse.json([]);
  }

  const games = game ? [game] : GAMES;
  const results: any[] = [];

  for (const g of games) {
    const encoded = encodeURIComponent(q);
    const base = `https://api.pandascore.co/${g}`;
    const params = `per_page=5&search%5Bname%5D=${encoded}&token=${PANDA_SCORE_TOKEN}`;

    try {
      const [teams, players, tournaments, matches] = await Promise.all([
        fetchJSON(`${base}/teams?${params}`),
        fetchJSON(`${base}/players?${params}`),
        fetchJSON(`${base}/tournaments?${params}`),
        fetchJSON(`${base}/matches?${params}`),
      ]);

      teams.forEach((t: any) => {
        results.push({
          id: t.id,
          name: t.name,
          type: "team",
          image_url: t.image_url ?? null,
          league: t.league?.name ?? undefined,
          game: g,
        });
      });

      players.forEach((p: any) => {
        results.push({
          id: p.id,
          name: p.name,
          type: "player",
          image_url: p.image_url ?? null,
          game: g,
        });
      });

      tournaments.forEach((t: any) => {
        results.push({
          id: t.id,
          name: t.name,
          type: "tournament",
          image_url: t.league?.image_url ?? null,
          league: t.league?.name ?? undefined,
          game: g,
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
          game: g,
          status: m.status ?? undefined,
        });
      });
    } catch (err) {
      console.error("Search API error:", err);
    }
  }

  return NextResponse.json(results.slice(0, 50));
}
