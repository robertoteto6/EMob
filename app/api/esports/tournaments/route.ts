import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game") || "dota2";
    const gamesParam = searchParams.get("games"); // Nuevo: soporte para múltiples juegos
    const perPageParam = searchParams.get("per_page");
    
    // Si hay games param, usar múltiples juegos; si no, usar game param (compatibilidad)
    const gameIds = gamesParam 
      ? gamesParam.split(',').map(g => g.trim()).filter(Boolean)
      : [gameParam];
    
    // Si no hay juegos, retornar array vacío
    if (gameIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Procesar múltiples juegos en paralelo
    const perPage = perPageParam ? Math.min(Math.max(parseInt(perPageParam, 10) || 0, 1), 100) : 50;
    
    const promises = gameIds.map(async (gameId) => {
      const game = getGameApiName(gameId);
      const baseUrl = `https://api.pandascore.co/${game}/tournaments`;
      const searchParamsApi = new URLSearchParams();
      searchParamsApi.set('per_page', String(perPage));
      
      try {
        const res = await pandaScoreFetch(baseUrl, searchParamsApi, { 
          cache: "no-store",
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EMob-Esports/1.0'
          }
        });
        
        if (!res.ok) {
          console.error(`API Error for game ${game}: ${res.status} ${res.statusText}`);
          return [];
        }
        
        const data = await res.json();
        // Agregar metadata del juego a cada tournament
        return Array.isArray(data) ? data.map((tournament: any) => ({ ...tournament, _gameId: gameId })) : [];
      } catch (error) {
        console.error(`Error fetching tournaments for game ${gameId}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    const allTournaments = results.flat();
    
    return NextResponse.json(allTournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json([]);
  }
}
