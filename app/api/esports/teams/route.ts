import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  const search = searchParams.get("search") || q; // Soporte para ambos parámetros
  
  // Mapear nombres de juegos
  let gameSlug = game;
  if (game === "lol") gameSlug = "league-of-legends";
  if (game === "csgo") gameSlug = "cs-go";
  if (game === "r6siege") gameSlug = "rainbow-six-siege";
  
  const url = new URL(`https://api.pandascore.co/${gameSlug}/teams`);
  url.searchParams.set("per_page", search ? "20" : "5"); // Más resultados para búsqueda
  url.searchParams.set("token", PANDA_SCORE_TOKEN);
  if (search) {
    url.searchParams.set("search[name]", search);
  }
  const res = await fetch(url.toString(), {
    cache: "no-store",
    dispatcher: getProxyAgent(),
  } as RequestInit & { dispatcher?: any });
  if (!res.ok) {
    return new NextResponse("Failed to fetch teams", { status: res.status });
  }
  const data = await res.json();
  const list = (data as any[]).map((t) => ({
    id: t.id,
    name: t.name,
    acronym: t.acronym,
    image_url: t.image_url ?? null,
    current_videogame: t.current_videogame,
    players: t.players?.length || 0,
    modified_at: t.modified_at
  }));
  return NextResponse.json(list);
}
