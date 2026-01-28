import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { Bracket } from "../../../lib/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournament_id");
    
    if (!tournamentId) {
      return NextResponse.json(
        { error: "Missing required parameter: tournament_id" },
        { status: 400 }
      );
    }
    
    const res = await pandaScoreFetch(
      `https://api.pandascore.co/tournaments/${tournamentId}/brackets`,
      new URLSearchParams(),
      { cache: "no-store" },
      {
        ttl: 10 * 60 * 1000,
        priority: 'medium',
        tags: ['brackets', 'tournament', tournamentId]
      }
    );
    
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json([]);
      }
      return new NextResponse("Failed to fetch brackets", { status: res.status });
    }
    
    const data = await res.json();
    
    // Obtener standings también si están disponibles
    let standings = null;
    try {
      const standingsRes = await pandaScoreFetch(
        `https://api.pandascore.co/tournaments/${tournamentId}/standings`,
        new URLSearchParams(),
        { cache: "no-store" },
        {
          ttl: 10 * 60 * 1000,
          priority: 'medium',
          tags: ['standings', 'tournament', tournamentId]
        }
      );
      
      if (standingsRes.ok) {
        standings = await standingsRes.json();
      }
    } catch {
      // Standings opcional
    }
    
    return NextResponse.json({
      tournament_id: parseInt(tournamentId),
      brackets: data || [],
      standings: standings || []
    });
  } catch (error) {
    console.error('Error fetching brackets:', error);
    return NextResponse.json([]);
  }
}
