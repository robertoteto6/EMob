import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { Game } from "../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("match_id");
    
    if (!matchId) {
      return NextResponse.json(
        { error: "Missing required parameter: match_id" },
        { status: 400 }
      );
    }
    
    const res = await pandaScoreFetch(
      `https://api.pandascore.co/matches/${matchId}/games`,
      new URLSearchParams(),
      { cache: "no-store" },
      {
        ttl: 5 * 60 * 1000,
        priority: 'high',
        tags: ['games', 'match', matchId]
      }
    );
    
    if (!res.ok) {
      return new NextResponse("Failed to fetch games", { status: res.status });
    }
    
    const data = await res.json();
    
    // Para cada game, intentar obtener estadísticas detalladas
    const gamesWithStats = await Promise.all(
      (data || []).map(async (game: Game) => {
        try {
          const statsRes = await pandaScoreFetch(
            `https://api.pandascore.co/games/${game.id}`,
            new URLSearchParams(),
            { cache: "no-store" },
            {
              ttl: 5 * 60 * 1000,
              priority: 'medium',
              tags: ['game-stats', String(game.id)]
            }
          );
          
          if (statsRes.ok) {
            const stats = await statsRes.json();
            return {
              ...game,
              detailed_stats: stats
            };
          }
        } catch {
          // Stats detalladas no siempre disponibles
        }
        
        return game;
      })
    );
    
    return NextResponse.json(gamesWithStats);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json([]);
  }
}
