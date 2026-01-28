import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";
import { Serie } from "../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game") || "dota2";
    const gamesParam = searchParams.get("games");
    const perPageParam = searchParams.get("per_page");
    const pageParam = searchParams.get("page");
    const search = searchParams.get("search");
    const year = searchParams.get("year");
    const season = searchParams.get("season");
    
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
      const baseUrl = `https://api.pandascore.co/${game}/series`;
      const searchParamsApi = new URLSearchParams();
      searchParamsApi.set('per_page', String(perPage));
      searchParamsApi.set('page', String(page));
      searchParamsApi.set('sort', '-begin_at');
      
      if (search) {
        searchParamsApi.set('search[name]', search);
      }
      if (year) {
        searchParamsApi.set('filter[year]', year);
      }
      if (season) {
        searchParamsApi.set('filter[season]', season);
      }
      
      try {
        const res = await pandaScoreFetch(baseUrl, searchParamsApi, { 
          cache: "no-store",
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EMob-Esports/1.0'
          }
        }, {
          ttl: 10 * 60 * 1000,
          priority: 'medium',
          tags: ['series', gameId]
        });
        
        if (!res.ok) {
          console.error(`API Error for game ${game}: ${res.status} ${res.statusText}`);
          return [];
        }
        
        const data = await res.json();
        return Array.isArray(data)
          ? data.map((serie: Serie) => ({
              ...serie,
              _gameId: gameId,
              game: gameId
            }))
          : [];
      } catch (error) {
        console.error(`Error fetching series for game ${gameId}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    const allSeries = results.flat();
    
    return NextResponse.json(allSeries);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json([]);
  }
}
