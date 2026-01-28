import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";
import { Odds } from "../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game");
    const gamesParam = searchParams.get("games");
    const matchId = searchParams.get("match_id");
    
    // Si se especifica un match_id, obtener odds específicas
    if (matchId) {
      try {
        const res = await pandaScoreFetch(
          `https://api.pandascore.co/odds`,
          new URLSearchParams({ 'filter[match_id]': matchId }),
          { cache: "no-store" },
          {
            ttl: 60 * 1000, // 1 minuto para odds
            priority: 'high',
            tags: ['odds', 'match', matchId]
          }
        );
        
        if (!res.ok) {
          return NextResponse.json([]);
        }
        
        const data = await res.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error(`Error fetching odds for match ${matchId}:`, error);
        return NextResponse.json([]);
      }
    }
    
    // Obtener odds por juego
    const gameIds = gamesParam 
      ? gamesParam.split(',').map(g => g.trim()).filter(Boolean)
      : gameParam 
        ? [gameParam]
        : ['dota2', 'lol', 'csgo', 'r6siege', 'overwatch'];
    
    const promises = gameIds.map(async (gameId) => {
      const game = getGameApiName(gameId);
      
      try {
        // Obtener partidos próximos y buscar odds
        const matchesRes = await pandaScoreFetch(
          `https://api.pandascore.co/${game}/matches/upcoming`,
          new URLSearchParams({ 'per_page': '20' }),
          { cache: "no-store" },
          {
            ttl: 2 * 60 * 1000,
            priority: 'medium',
            tags: ['matches', 'upcoming', gameId]
          }
        );
        
        if (!matchesRes.ok) {
          return [];
        }
        
        const matches = await matchesRes.json();
        const matchIds = (matches || []).map((m: any) => m.id).join(',');
        
        if (!matchIds) {
          return [];
        }
        
        // Obtener odds para estos partidos
        const oddsRes = await pandaScoreFetch(
          `https://api.pandascore.co/odds`,
          new URLSearchParams({ 'filter[match_id]': matchIds }),
          { cache: "no-store" },
          {
            ttl: 60 * 1000,
            priority: 'high',
            tags: ['odds', gameId]
          }
        );
        
        if (!oddsRes.ok) {
          return [];
        }
        
        const odds = await oddsRes.json();
        
        // Combinar partidos con odds
        return (matches || []).map((match: any) => ({
          ...match,
          _gameId: gameId,
          game: gameId,
          odds: (odds || []).filter((o: Odds) => o.match_id === match.id)
        }));
      } catch (error) {
        console.error(`Error fetching odds for game ${gameId}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    const allOdds = results.flat();
    
    return NextResponse.json(allOdds);
  } catch (error) {
    console.error('Error fetching odds:', error);
    return NextResponse.json([]);
  }
}
