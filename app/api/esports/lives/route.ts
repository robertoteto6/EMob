import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game");
    const gamesParam = searchParams.get("games");
    
    const gameIds = gamesParam 
      ? gamesParam.split(',').map(g => g.trim()).filter(Boolean)
      : gameParam 
        ? [gameParam]
        : ['dota2', 'lol', 'csgo', 'r6siege', 'overwatch', 'valorant'];
    
    const promises = gameIds.map(async (gameId) => {
      const game = getGameApiName(gameId);
      
      try {
        // Obtener partidos en vivo
        const matchesRes = await pandaScoreFetch(
          `https://api.pandascore.co/${game}/matches/running`,
          new URLSearchParams({ 'per_page': '100' }),
          { cache: "no-store" },
          {
            ttl: 30 * 1000, // 30 segundos para datos en vivo
            priority: 'critical',
            tags: ['lives', 'running', gameId]
          }
        );
        
        if (!matchesRes.ok) {
          console.error(`API Error for game ${game}: ${matchesRes.status}`);
          return [];
        }
        
        const matches = await matchesRes.json();
        
        // Para cada partido en vivo, intentar obtener datos de lives si existen
        const matchesWithLives = await Promise.all(
          (matches || []).map(async (match: any) => {
            try {
              const livesRes = await pandaScoreFetch(
                `https://api.pandascore.co/lives`,
                new URLSearchParams({ 'filter[match_id]': match.id }),
                { cache: "no-store" },
                {
                  ttl: 15 * 1000, // 15 segundos para lives
                  priority: 'critical',
                  tags: ['lives', 'match', String(match.id)]
                }
              );
              
              if (livesRes.ok) {
                const lives = await livesRes.json();
                return {
                  ...match,
                  _gameId: gameId,
                  game: gameId,
                  lives: Array.isArray(lives) ? lives : []
                };
              }
            } catch {
              // Lives no siempre están disponibles
            }
            
            return {
              ...match,
              _gameId: gameId,
              game: gameId,
              lives: []
            };
          })
        );
        
        return matchesWithLives;
      } catch (error) {
        console.error(`Error fetching lives for game ${gameId}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    const allLives = results.flat();
    
    return NextResponse.json(allLives);
  } catch (error) {
    console.error('Error fetching lives:', error);
    return NextResponse.json([]);
  }
}
