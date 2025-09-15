import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game") || "dota2";
    const perPageParam = searchParams.get("per_page");
    
    // Mapear el juego al nombre correcto de la API usando la configuración centralizada
    const game = getGameApiName(gameParam);
    
    const baseUrl = `https://api.pandascore.co/${game}/tournaments`;
    const searchParamsApi = new URLSearchParams();
    const perPage = perPageParam ? Math.min(Math.max(parseInt(perPageParam, 10) || 0, 1), 100) : 50;
    searchParamsApi.set('per_page', String(perPage));
    
    const res = await pandaScoreFetch(baseUrl, searchParamsApi, { 
      cache: "no-store",
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EMob-Esports/1.0'
      }
    });
    
    if (!res.ok) {
      console.error(`API Error for game ${game}: ${res.status} ${res.statusText}`);
      return NextResponse.json([]);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json([]);
  }
}
