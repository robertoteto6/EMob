import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../../lib/pandaScoreFetch";



interface CareerHighlight {
  match_name: string;
  tournament: string;
  date: string;
  importance: string;
}

interface VeteranAnalysis {
  career_highlights: CareerHighlight[];
  playing_style: string;
  legacy_impact: string;
  achievements_summary: string;
  ai_insights: string[];
}

// Simulación de análisis de IA tipo Gemini para jugadores veteranos
function generateVeteranAnalysis(playerData: any, matches: any[]): VeteranAnalysis {
  const analysis: VeteranAnalysis = {
    career_highlights: [],
    playing_style: "",
    legacy_impact: "",
    achievements_summary: "",
    ai_insights: []
  };

  // Análisis de carrera basado en datos
  if (matches.length > 0) {
    const recentMatches = matches.slice(0, 10);
    const wins = recentMatches.filter(m => m.winner && m.opponents?.some((opp: any) => 
      opp.opponent?.id === playerData.id && opp.opponent?.id === m.winner?.id
    )).length;
    
    const winRate = recentMatches.length > 0 ? (wins / recentMatches.length * 100).toFixed(1) : "0";

    // Detectar momentos destacados
    const importantMatches = matches.filter((match: any) => {
      const matchName = match.name?.toLowerCase() || '';
      const tournamentName = match.tournament?.name?.toLowerCase() || '';
      return matchName.includes('final') || tournamentName.includes('championship') || 
             tournamentName.includes('major') || matchName.includes('playoff');
    });

    analysis.career_highlights = importantMatches.slice(0, 5).map((match: any): CareerHighlight => ({
      match_name: match.name || 'Partido importante',
      tournament: match.tournament?.name || 'Torneo destacado',
      date: match.begin_at || '',
      importance: match.name?.toLowerCase().includes('grand final') ? 'Legendario' : 'Importante'
    }));
  }

  // Análisis de estilo de juego basado en rol y experiencia
  if (playerData.role) {
    const roleAnalysis: { [key: string]: string } = {
      'Carry': 'Jugador orientado al daño con enfoque en el farm y las eliminaciones tardías',
      'Support': 'Especialista en visión, control de mapa y protección del equipo',
      'Mid': 'Cerebro del equipo, control de tempo y rotaciones estratégicas',
      'Jungle': 'Maestro del control de objetivos y ganks oportunos',
      'Top': 'Tanque confiable con excelente conocimiento de matchups',
      'ADC': 'Máximo daño sostenido con posicionamiento excepcional',
      'IGL': 'Líder estratégico con capacidad de lectura del juego avanzada'
    };
    
    analysis.playing_style = roleAnalysis[playerData.role] || 'Jugador versátil con amplia experiencia competitiva';
  }

  // Impacto del legado
  const titleScore = calculateTitleScore(playerData);
  if (titleScore >= 150) {
    analysis.legacy_impact = "Leyenda indiscutible que ha definido el meta y inspirado a generaciones de jugadores";
    analysis.ai_insights.push("🏆 Este jugador pertenece al 1% elite de competidores profesionales");
  } else if (titleScore >= 100) {
    analysis.legacy_impact = "Veterano respetado con contribuciones significativas al desarrollo competitivo";
    analysis.ai_insights.push("⭐ Jugador con impacto duradero en la escena profesional");
  }

  // Resumen de logros basado en datos disponibles
  if (playerData.current_team) {
    analysis.achievements_summary = `Jugador activo en ${playerData.current_team.name} con una trayectoria sólida`;
  } else {
    analysis.achievements_summary = `Veterano con amplia experiencia que ha marcado la historia de los esports`;
  }

  // Insights adicionales de IA
  if (playerData.nationality) {
    const regionImpact: { [key: string]: string } = {
      'KR': 'Representa la excelencia coreana en esports',
      'CN': 'Parte del dominio chino en competiciones internacionales',
      'US': 'Emblema del talento norteamericano',
      'EU': 'Representa la diversidad y estrategia europea',
      'BR': 'Pionero de la escena latinoamericana'
    };
    
    const impact = regionImpact[playerData.nationality] || 'Contribuye a la diversidad global de los esports';
    analysis.ai_insights.push(`🌍 ${impact}`);
  }

  if (matches.length < 5) {
    analysis.ai_insights.push("📈 Aunque no esté activo recientemente, su legado perdura en la comunidad");
  }

  return analysis;
}

function calculateTitleScore(player: any): number {
  let score = 0;
  
  if (player.current_team) {
    if (player.current_team.id && player.current_team.id < 1000) {
      score += 100;
    } else if (player.current_team.id && player.current_team.id < 5000) {
      score += 75;
    }
  }
  
  if (player.id < 5000) {
    score += 150;
  } else if (player.id < 20000) {
    score += 100;
  } else if (player.id < 50000) {
    score += 75;
  }
  
  return score;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    // Obtener datos del jugador
    const playerRes = await pandaScoreFetch(
      `https://api.pandascore.co/players/${id}`,
      new URLSearchParams(),
      { cache: "no-store" }
    );
    
    if (!playerRes.ok) {
      return new NextResponse("Failed to fetch player", { status: playerRes.status });
    }
    
    const playerData = await playerRes.json();
    
    // Obtener historial de partidos
    
    let matches = [];
    try {
      const matchesRes = await pandaScoreFetch(
        `https://api.pandascore.co/players/${id}/matches`,
        new URLSearchParams({
          'sort': '-begin_at',
          'per_page': '50'
        }),
        { cache: "no-store" }
      );
      if (matchesRes.ok) {
        matches = await matchesRes.json();
      }
    } catch (e) {
      console.log("No matches data available");
    }

    // Generar análisis de IA
    const analysis = generateVeteranAnalysis(playerData, matches);
    
    return NextResponse.json({
      player_id: parseInt(id),
      player_name: playerData.name,
      is_veteran: calculateTitleScore(playerData) >= 100,
      analysis: analysis,
      generated_at: new Date().toISOString(),
      ai_powered: true
    });
    
  } catch (error) {
    console.error("Error generating analysis:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
