import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  const search = searchParams.get("search") || q; // Soporte para ambos parámetros
  
  try {
    // Mapear nombres de juegos
    let gameSlug = game;
    if (game === "lol") gameSlug = "lol"; // No cambiar, la API usa 'lol'
    if (game === "csgo") gameSlug = "csgo"; // No cambiar, la API usa 'csgo'
    if (game === "r6siege") gameSlug = "r6siege"; // No cambiar, la API usa 'r6siege'
    
    console.log(`Fetching teams for game: ${game} -> ${gameSlug}`);
    
    const url = new URL(`https://api.pandascore.co/${gameSlug}/teams`);
    url.searchParams.set("per_page", search ? "20" : "50"); // Más equipos por defecto
    url.searchParams.set("token", PANDA_SCORE_TOKEN);
    if (search) {
      url.searchParams.set("search[name]", search);
    }
    
    console.log(`API URL: ${url.toString()}`);
    
    const res = await fetch(url.toString(), {
      cache: "no-store",
      dispatcher: getProxyAgent(),
    } as RequestInit & { dispatcher?: any });
    
    console.log(`API Response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error: ${res.status} - ${errorText}`);
      return new NextResponse(`Failed to fetch teams: ${res.status} - ${errorText}`, { status: res.status });
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} teams for ${gameSlug}`);
    
    if (!Array.isArray(data)) {
      console.error("API did not return an array:", data);
      return new NextResponse("Invalid API response format", { status: 500 });
    }
    
    const list = data.map((t) => ({
      id: t.id,
      name: t.name,
      acronym: t.acronym,
      image_url: t.image_url ?? null,
      current_videogame: t.current_videogame,
      players: t.players?.length || 0,
      modified_at: t.modified_at
    }));
    
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching teams:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Server error: ${errorMessage}`, { status: 500 });
  }
}
