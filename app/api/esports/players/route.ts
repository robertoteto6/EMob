import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  
  try {
    console.log(`Fetching players for game: ${game}`);
    
    const url = new URL(`https://api.pandascore.co/${game}/players`);
    url.searchParams.set("per_page", q ? "20" : "50"); // Más jugadores
    url.searchParams.set("token", PANDA_SCORE_TOKEN);
    if (q) {
      url.searchParams.set("search[name]", q);
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
      return new NextResponse(`Failed to fetch players: ${res.status} - ${errorText}`, { status: res.status });
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} players for ${game}`);
    
    if (!Array.isArray(data)) {
      console.error("API did not return an array:", data);
      return new NextResponse("Invalid API response format", { status: 500 });
    }
    
    const list = data.map((p) => ({
      id: p.id,
      name: p.name,
      image_url: p.image_url ?? null,
    }));
    
    return NextResponse.json(list);
  } catch (error) {
    console.error("Error fetching players:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Server error: ${errorMessage}`, { status: 500 });
  }
}
