import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../lib/pandaScoreFetch";



// Función para generar datos de Instagram simulados basados en el jugador
function generateInstagramData(player: any) {
  // Algoritmo para generar seguidores de Instagram realistas
  let baseFollowers = 10000; // Base mínima
  
  // Factor por puntuación de títulos (necesitamos calcular el título score primero)
  const titleScore = calculateTitleScore(player);
  baseFollowers += titleScore * 500; // Más títulos = más seguidores
  
  // Factor por equipo
  if (player.current_team) {
    baseFollowers += 50000; // Jugadores en equipos tienen más exposición
    
    // Equipos tier 1 tienen más seguidores
    if (player.current_team.id && player.current_team.id < 1000) {
      baseFollowers += 200000;
    } else if (player.current_team.id && player.current_team.id < 5000) {
      baseFollowers += 100000;
    }
  }
  
  // Factor por imagen (jugadores con imagen oficial tienden a tener más seguidores)
  if (player.image_url) {
    baseFollowers += 75000;
  }
  
  // Factor por nacionalidad (algunas regiones tienen más actividad en redes sociales)
  const highSocialMediaRegions = ['BR', 'US', 'KR', 'PH', 'ID', 'TH', 'TR'];
  if (player.nationality && highSocialMediaRegions.includes(player.nationality)) {
    baseFollowers += 100000;
  }
  
  // Variación basada en ID para consistencia
  const variation = (player.id % 50000) + (player.id % 17) * 10000;
  baseFollowers += variation;
  
  // Agregar algo de aleatoriedad realista pero consistente
  const randomFactor = 0.8 + (Math.sin(player.id) * 0.4); // Entre 0.4 y 1.2
  baseFollowers = Math.floor(baseFollowers * randomFactor);
  
  // Generar handle de Instagram
  let instagramHandle = null;
  // Usar un algoritmo determinístico basado en el ID del jugador
  if ((player.id % 100) < 75) { // 75% de probabilidad de tener Instagram
    const nameBase = player.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffixes = ['', '_', 'official', 'pro', 'gaming', '1', '2'];
    const suffix = suffixes[player.id % suffixes.length];
    instagramHandle = `${nameBase}${suffix}`;
  }
  
  return {
    followers: Math.max(5000, baseFollowers), // Mínimo 5K seguidores
    handle: instagramHandle
  };
}

// Función auxiliar para calcular el score de títulos
function calculateTitleScore(player: any): number {
  let score = 0;
  
  if (player.current_team) {
    score += 50;
    if (player.current_team.id && player.current_team.id < 1000) {
      score += 100;
    } else if (player.current_team.id && player.current_team.id < 5000) {
      score += 75;
    } else if (player.current_team.id && player.current_team.id < 10000) {
      score += 50;
    }
  }
  
  const prestigiousRegions = ['CN', 'KR', 'US', 'DE', 'SE', 'DK', 'RU', 'BR'];
  if (player.nationality && prestigiousRegions.includes(player.nationality)) {
    score += 25;
  }
  
  const leadershipRoles = ['Carry', 'Mid', 'Captain', 'IGL', 'AWP', 'Entry'];
  const supportRoles = ['Support', 'Hard Support', 'Soft Support', 'Coach'];
  
  if (player.role) {
    if (leadershipRoles.some((role: string) => player.role.includes(role))) {
      score += 40;
    } else if (supportRoles.some((role: string) => player.role.includes(role))) {
      score += 30;
    } else {
      score += 35;
    }
  }
  
  if (player.id < 5000) {
    score += 150;
  } else if (player.id < 20000) {
    score += 100;
  } else if (player.id < 50000) {
    score += 75;
  } else if (player.id < 100000) {
    score += 50;
  } else {
    score += 25;
  }
  
  if (player.image_url) {
    score += 30;
  }
  
  score += (player.id % 20);
  return score;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    // Obtener datos básicos del jugador
    const playerRes = await pandaScoreFetch(
      `https://api.pandascore.co/players/${id}`,
      new URLSearchParams(),
      { cache: "no-store" }
    );
    
    if (!playerRes.ok) {
      return new NextResponse("Failed to fetch player", { status: playerRes.status });
    }
    
    const playerData = await playerRes.json();
    
    // Obtener estadísticas de matches del jugador (últimos partidos)
    
    let recentMatches = [];
    let historicalMatches = [];
    let isVeteran = false;
    
    try {
      const matchesRes = await pandaScoreFetch(
        `https://api.pandascore.co/players/${id}/matches`,
        new URLSearchParams({
          'sort': '-begin_at',
          'per_page': '10'
        }),
        { cache: "no-store" }
      );
      if (matchesRes.ok) {
        recentMatches = await matchesRes.json();
      }
    } catch (e) {
      console.log("No matches data available");
    }

    // Calcular si es veterano basado en el score antes de devolverlo
    const preliminaryScore = calculateTitleScore(playerData);
    isVeteran = preliminaryScore >= 100;

    // Para veteranos con pocos partidos recientes, buscar partidos históricos importantes
    if (isVeteran && recentMatches.length < 8) {
      try {
        
        const historicalRes = await pandaScoreFetch(
          `https://api.pandascore.co/players/${id}/matches`,
          new URLSearchParams({
            'sort': '-begin_at',
            'per_page': '50',
            'filter[status]': 'finished'
          }),
          { cache: "no-store" }
        );
        
        if (historicalRes.ok) {
          const allMatches = await historicalRes.json();
          
          // Filtrar partidos importantes para veteranos
          historicalMatches = (allMatches || [])
            .filter((match: any) => {
              const matchName = match.name?.toLowerCase() || '';
              const tournamentName = match.tournament?.name?.toLowerCase() || '';
              const leagueName = match.league?.name?.toLowerCase() || '';
              
              // Detectar partidos importantes
              const importantKeywords = [
                'final', 'grand final', 'championship', 'semifinal', 'quarter',
                'playoff', 'elimination', 'major', 'world', 'international',
                'masters', 'premier', 'elite', 'pro league', 'championship series',
                'cup', 'open', 'invitational', 'qualifier'
              ];
              
              const isImportant = importantKeywords.some(keyword => 
                matchName.includes(keyword) || 
                tournamentName.includes(keyword) || 
                leagueName.includes(keyword)
              );

              // También incluir partidos de hace más de 6 meses (históricos)
              const matchDate = new Date(match.begin_at);
              const sixMonthsAgo = new Date();
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
              const isHistorical = matchDate < sixMonthsAgo;
              
              return isImportant || isHistorical;
            })
            .slice(0, 12); // Máximo 12 partidos históricos importantes
        }
      } catch (error) {
        console.error('Error fetching historical matches:', error);
      }
    }
    
    // Obtener información del equipo actual si existe
    let teamData = null;
    if (playerData.current_team?.id) {
      try {
        const teamRes = await pandaScoreFetch(
        `https://api.pandascore.co/teams/${playerData.current_team.id}`,
        new URLSearchParams(),
        { cache: "no-store" }
      );
        if (teamRes.ok) {
          teamData = await teamRes.json();
        }
      } catch (e) {
        console.log("No team data available");
      }
    }
    
    // Calcular estadísticas
    const winRate = recentMatches.length > 0 
      ? (recentMatches.filter((m: any) => {
          const playerTeamId = playerData.current_team?.id;
          return m.winner?.id === playerTeamId;
        }).length / recentMatches.length * 100).toFixed(1)
      : 0;
    
    // Función para calcular puntuación de títulos (reutilizada de players route)
    function calculateTitleScore(player: any): number {
      let score = 0;
      
      if (player.current_team) {
        score += 50;
        if (player.current_team.id && player.current_team.id < 1000) {
          score += 100;
        } else if (player.current_team.id && player.current_team.id < 5000) {
          score += 75;
        } else if (player.current_team.id && player.current_team.id < 10000) {
          score += 50;
        }
      }
      
      const prestigiousRegions = ['CN', 'KR', 'US', 'DE', 'SE', 'DK', 'RU', 'BR'];
      if (player.nationality && prestigiousRegions.includes(player.nationality)) {
        score += 25;
      }
      
      const leadershipRoles = ['Carry', 'Mid', 'Captain', 'IGL', 'AWP', 'Entry'];
      const supportRoles = ['Support', 'Hard Support', 'Soft Support', 'Coach'];
      
      if (player.role) {
        if (leadershipRoles.some((role: string) => player.role.includes(role))) {
          score += 40;
        } else if (supportRoles.some((role: string) => player.role.includes(role))) {
          score += 30;
        } else {
          score += 35;
        }
      }
      
      if (player.id < 5000) {
        score += 150;
      } else if (player.id < 20000) {
        score += 100;
      } else if (player.id < 50000) {
        score += 75;
      } else if (player.id < 100000) {
        score += 50;
      } else {
        score += 25;
      }
      
      if (player.image_url) {
        score += 30;
      }
      
      score += (player.id % 20);
      return score;
    }
    
    // Calcular datos de Instagram
    const instagramData = generateInstagramData(playerData);

    const data = {
      id: playerData.id,
      name: playerData.name ?? "",
      first_name: playerData.first_name ?? null,
      last_name: playerData.last_name ?? null,
      nationality: playerData.nationality ?? null,
      role: playerData.role ?? null,
      image_url: playerData.image_url ?? null,
      current_team: playerData.current_team?.name ?? null,
      current_team_id: playerData.current_team?.id ?? null,
      current_team_image: playerData.current_team?.image_url ?? null,
      // Información adicional enriquecida
      age: playerData.age ?? null,
      birthday: playerData.birthday ?? null,
      hometown: playerData.hometown ?? null,
      modified_at: playerData.modified_at ?? null,
      // Estadísticas calculadas
      title_score: calculateTitleScore(playerData),
      recent_matches: recentMatches.slice(0, 5), // Últimos 5 partidos
      historical_matches: historicalMatches || [], // Partidos históricos importantes para veteranos
      win_rate: winRate,
      total_matches: recentMatches.length,
      is_veteran: isVeteran,
      // Información del equipo
      team_data: teamData ? {
        id: teamData.id,
        name: teamData.name,
        acronym: teamData.acronym,
        image_url: teamData.image_url,
        location: teamData.location,
        current_videogame: teamData.current_videogame,
        players: teamData.players || []
      } : null,
      // Estado profesional
      professional_status: playerData.current_team ? "Activo" : "Libre",
      // Información de la región
      region_info: getRegionInfo(playerData.nationality),
      // Datos de Instagram
      instagram_followers: instagramData.followers,
      instagram_handle: instagramData.handle,
    };
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching player details:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Server error: ${errorMessage}`, { status: 500 });
  }
}

// Función helper para obtener información de la región
function getRegionInfo(nationality: string | null) {
  if (!nationality) return null;
  
  const regions: { [key: string]: { name: string; flag: string; region: string } } = {
    'CN': { name: 'China', flag: '🇨🇳', region: 'Asia' },
    'KR': { name: 'Corea del Sur', flag: '🇰🇷', region: 'Asia' },
    'US': { name: 'Estados Unidos', flag: '🇺🇸', region: 'Norteamérica' },
    'CA': { name: 'Canadá', flag: '🇨🇦', region: 'Norteamérica' },
    'DE': { name: 'Alemania', flag: '🇩🇪', region: 'Europa' },
    'SE': { name: 'Suecia', flag: '🇸🇪', region: 'Europa' },
    'DK': { name: 'Dinamarca', flag: '🇩🇰', region: 'Europa' },
    'RU': { name: 'Rusia', flag: '🇷🇺', region: 'Europa/Asia' },
    'BR': { name: 'Brasil', flag: '🇧🇷', region: 'Sudamérica' },
    'FR': { name: 'Francia', flag: '🇫🇷', region: 'Europa' },
    'GB': { name: 'Reino Unido', flag: '🇬🇧', region: 'Europa' },
    'UA': { name: 'Ucrania', flag: '🇺🇦', region: 'Europa' },
    'FI': { name: 'Finlandia', flag: '🇫🇮', region: 'Europa' },
    'NO': { name: 'Noruega', flag: '🇳🇴', region: 'Europa' },
    'AU': { name: 'Australia', flag: '🇦🇺', region: 'Oceanía' },
    'JP': { name: 'Japón', flag: '🇯🇵', region: 'Asia' },
    'MY': { name: 'Malasia', flag: '🇲🇾', region: 'Asia' },
    'SG': { name: 'Singapur', flag: '🇸🇬', region: 'Asia' },
    'TH': { name: 'Tailandia', flag: '🇹🇭', region: 'Asia' },
    'ID': { name: 'Indonesia', flag: '🇮🇩', region: 'Asia' },
    'PH': { name: 'Filipinas', flag: '🇵🇭', region: 'Asia' },
    'VN': { name: 'Vietnam', flag: '🇻🇳', region: 'Asia' },
    'ES': { name: 'España', flag: '🇪🇸', region: 'Europa' },
    'IT': { name: 'Italia', flag: '🇮🇹', region: 'Europa' },
    'NL': { name: 'Países Bajos', flag: '🇳🇱', region: 'Europa' },
    'BE': { name: 'Bélgica', flag: '🇧🇪', region: 'Europa' },
    'PL': { name: 'Polonia', flag: '🇵🇱', region: 'Europa' },
    'CZ': { name: 'República Checa', flag: '🇨🇿', region: 'Europa' },
    'TR': { name: 'Turquía', flag: '🇹🇷', region: 'Europa/Asia' },
    'MX': { name: 'México', flag: '🇲🇽', region: 'Norteamérica' },
    'AR': { name: 'Argentina', flag: '🇦🇷', region: 'Sudamérica' },
    'CL': { name: 'Chile', flag: '🇨🇱', region: 'Sudamérica' },
    'PE': { name: 'Perú', flag: '🇵🇪', region: 'Sudamérica' },
    'CO': { name: 'Colombia', flag: '🇨🇴', region: 'Sudamérica' },
    'UY': { name: 'Uruguay', flag: '🇺🇾', region: 'Sudamérica' },
  };
  
  return regions[nationality] || { name: nationality, flag: '🌍', region: 'Internacional' };
}
