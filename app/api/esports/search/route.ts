import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  if (q.length < 1) return NextResponse.json([]);
  const base = `https://api.pandascore.co/${game}`;
  const tokenParam = `token=${PANDA_SCORE_TOKEN}`;

  async function load(endpoint: string) {
    const url = `${base}/${endpoint}?per_page=5&search[name]=${encodeURIComponent(q)}&${tokenParam}`;
    const res = await fetch(url, { cache: "no-store", dispatcher: getProxyAgent() } as RequestInit & { dispatcher?: any });
    if (!res.ok) return [];
    return res.json();
  }

  const [teams, players, matches] = await Promise.all([
    load("teams"),
    load("players"),
    load("matches"),
  ]);

  const list = [
    ...(teams as any[]).map((t) => ({ type: "team", id: t.id, name: t.name, image_url: t.image_url ?? null })),
    ...(players as any[]).map((p) => ({ type: "player", id: p.id, name: p.name, image_url: p.image_url ?? null })),
    ...(matches as any[]).map((m) => {
      const team1 = m.opponents?.[0]?.opponent?.name ?? "TBD";
      const team2 = m.opponents?.[1]?.opponent?.name ?? "TBD";
      return { type: "match", id: m.id, name: `${team1} vs ${team2}`, image_url: null };
    }),
  ];

  return NextResponse.json(list);
}
