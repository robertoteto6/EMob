import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getGameApiName } from "../../../lib/gameConfig";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'player', 'team', 'match'
    const id = searchParams.get("id");
    const gameParam = searchParams.get("game");
    
    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing required parameters: type and id" },
        { status: 400 }
      );
    }

    const validTypes = ['player', 'team', 'match'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: player, team, or match" },
        { status: 400 }
      );
    }
    
    // Construir URL base
    let baseUrl: string;

    if (gameParam) {
      const game = getGameApiName(gameParam);
      baseUrl = `https://api.pandascore.co/${game}/${type}s/${id}/stats`;
    } else {
      baseUrl = `https://api.pandascore.co/stats/${type}s/${id}`;
    }
    
    const res = await pandaScoreFetch(
      baseUrl,
      new URLSearchParams(),
      { cache: "no-store" },
      {
        ttl: 30 * 60 * 1000, // 30 minutos para stats
        priority: 'medium',
        tags: ['stats', type, id]
      }
    );
    
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: "Stats not found for this entity" },
          { status: 404 }
        );
      }
      return new NextResponse(`Failed to fetch stats: ${res.statusText}`, { status: res.status });
    }
    
    const data = await res.json();
    
    return NextResponse.json({
      type,
      id: parseInt(id),
      game: gameParam || 'all',
      stats: data,
      fetched_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
