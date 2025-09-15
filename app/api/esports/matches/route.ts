import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game") || "dota2";
    const tournamentId = searchParams.get("tournamentId");
    const perPageParam = searchParams.get("per_page");
    
    // Mapear el juego al nombre correcto de la API usando la configuración centralizada
    const game = getGameApiName(gameParam);
    
    const baseUrl = `https://api.pandascore.co/${game}/matches`;
    const searchParamsApi = new URLSearchParams();
    const perPage = perPageParam ? Math.min(Math.max(parseInt(perPageParam, 10) || 0, 1), 100) : 50;
    searchParamsApi.set('per_page', String(perPage));
    if (tournamentId) {
      searchParamsApi.set('filter[tournament_id]', tournamentId);
    }
    
    const res = await pandaScoreFetch(baseUrl, searchParamsApi, { 
      cache: "no-store",
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EMob-Esports/1.0'
      }
    });
    
    if (!res.ok) {
      console.error(`API Error for game ${game}: ${res.status} ${res.statusText}`);
      // En lugar de devolver error, devolvemos array vacío para que no se rompa la aplicación
      return NextResponse.json([]);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching matches:', error);
    // Devolver array vacío en caso de error para mantener la aplicación funcionando
    return NextResponse.json([]);
  }
}
