import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";
import { League } from "../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game") || "dota2";
    const gamesParam = searchParams.get("games");
    const perPageParam = searchParams.get("per_page");
    const pageParam = searchParams.get("page");
    const search = searchParams.get("search");
    
    // Si hay games param, usar múltiples juegos
    const gameIds = gamesParam 
      ? gamesParam.split(',').map(g => g.trim()).filter(Boolean)
      : [gameParam];
    
    if (gameIds.length === 0) {
      return NextResponse.json([]);
    }
    
    const perPage = perPageParam 
      ? Math.min(Math.max(parseInt(perPageParam, 10) || 0, 1), 100) 
      : 50;
    const page = pageParam ? Math.max(parseInt(pageParam, 10) || 1, 1) : 1;
    
    const promises = gameIds.map(async (gameId) => {
      const game = getGameApiName(gameId);
      const baseUrl = `https://api.pandascore.co/${game}/leagues`;
      const searchParamsApi = new URLSearchParams();
      searchParamsApi.set('per_page', String(perPage));
      searchParamsApi.set('page', String(page));
      
      if (search) {
        searchParamsApi.set('search[name]', search);
      }
      
      try {
        const res = await pandaScoreFetch(baseUrl, searchParamsApi, { 
          cache: "no-store",
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EMob-Esports/1.0'
          }
        }, {
          ttl: 10 * 60 * 1000, // 10 minutos cache
          priority: 'medium',
          tags: ['leagues', gameId]
        });
        
        if (!res.ok) {
          console.error(`API Error for game ${game}: ${res.status} ${res.statusText}`);
          return [];
        }
        
        const data = await res.json();
        return Array.isArray(data)
          ? data.map((league: League) => ({
              ...league,
              _gameId: gameId,
              game: gameId
            }))
          : [];
      } catch (error) {
        console.error(`Error fetching leagues for game ${gameId}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    const allLeagues = results.flat();
    
    return NextResponse.json(allLeagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json([]);
  }
}
