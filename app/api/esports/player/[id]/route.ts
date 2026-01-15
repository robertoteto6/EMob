import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../lib/pandaScoreFetch";
import { searchPlayerHighlights, convertYouTubeToMediaItems } from "../../../../lib/youtube";
import type { Achievement, MediaItem, CareerEvent, GameSpecificStats } from "../../../../lib/types/player";

// Función para generar logros del jugador basados en sus datos
function generateAchievements(player: any, titleScore: number, historicalMatches: any[]): Achievement[] {
  const achievements: Achievement[] = [];
  let achievementId = 1;

  // Logros por score de títulos
  if (titleScore >= 150) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'milestone',
      title: 'Leyenda del Esport',
      description: 'Ha alcanzado el estatus legendario en la escena competitiva',
      date: new Date().toISOString(),
      icon: '👑',
      rarity: 'legendary'
    });
  }

  if (titleScore >= 100) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'milestone',
      title: 'Veterano Consagrado',
      description: 'Más de 100 puntos de prestigio acumulados en su carrera',
      date: new Date().toISOString(),
      icon: '⭐',
      rarity: 'epic'
    });
  }

  // Logros por equipo
  if (player.current_team) {
    if (player.current_team.id && player.current_team.id < 1000) {
      achievements.push({
        id: `ach-${achievementId++}`,
        type: 'milestone',
        title: 'Equipo de Élite',
        description: `Miembro de ${player.current_team.name}, uno de los equipos más prestigiosos`,
        date: new Date().toISOString(),
        team: player.current_team.name,
        icon: '🏆',
        rarity: 'legendary'
      });
    } else if (player.current_team.id && player.current_team.id < 5000) {
      achievements.push({
        id: `ach-${achievementId++}`,
        type: 'milestone',
        title: 'Profesional Tier 1',
        description: `Jugador profesional en ${player.current_team.name}`,
        date: new Date().toISOString(),
        team: player.current_team.name,
        icon: '🎮',
        rarity: 'epic'
      });
    }
  }

  // Logros por nacionalidad
  const eliteRegions = ['KR', 'CN'];
  const strongRegions = ['US', 'DE', 'SE', 'DK', 'RU', 'BR'];
  if (eliteRegions.includes(player.nationality)) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'milestone',
      title: 'Talento de Región Élite',
      description: 'Proviene de una de las regiones más competitivas del mundo',
      date: new Date().toISOString(),
      icon: '🌏',
      rarity: 'epic'
    });
  } else if (strongRegions.includes(player.nationality)) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'milestone',
      title: 'Representante Regional',
      description: 'Talento destacado de su región',
      date: new Date().toISOString(),
      icon: '🌍',
      rarity: 'rare'
    });
  }

  // Logros por rol
  const starRoles = ['Carry', 'Mid', 'AWP', 'Entry'];
  const leaderRoles = ['Captain', 'IGL'];
  if (player.role) {
    if (leaderRoles.some((r: string) => player.role.includes(r))) {
      achievements.push({
        id: `ach-${achievementId++}`,
        type: 'milestone',
        title: 'Líder de Equipo',
        description: 'Lidera a su equipo como capitán o in-game leader',
        date: new Date().toISOString(),
        icon: '👨‍✈️',
        rarity: 'epic'
      });
    } else if (starRoles.some((r: string) => player.role.includes(r))) {
      achievements.push({
        id: `ach-${achievementId++}`,
        type: 'milestone',
        title: 'Jugador Estrella',
        description: `Rol de ${player.role} - posición de alto impacto`,
        date: new Date().toISOString(),
        icon: '💫',
        rarity: 'rare'
      });
    }
  }

  // Logros basados en partidos históricos
  const grandFinals = historicalMatches.filter((m: any) => 
    m.name?.toLowerCase().includes('grand final') || m.name?.toLowerCase().includes('final')
  );
  const majors = historicalMatches.filter((m: any) => 
    m.tournament?.name?.toLowerCase().includes('major') || 
    m.tournament?.name?.toLowerCase().includes('world') ||
    m.tournament?.name?.toLowerCase().includes('international')
  );

  if (grandFinals.length >= 3) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'finals',
      title: 'Finalista Serial',
      description: `Ha llegado a ${grandFinals.length} finales en su carrera`,
      date: grandFinals[0]?.begin_at || new Date().toISOString(),
      icon: '🥇',
      rarity: 'epic'
    });
  } else if (grandFinals.length >= 1) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'finals',
      title: 'Finalista',
      description: 'Ha disputado una final de torneo',
      date: grandFinals[0]?.begin_at || new Date().toISOString(),
      tournament: grandFinals[0]?.tournament?.name,
      icon: '🥈',
      rarity: 'rare'
    });
  }

  if (majors.length >= 2) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'championship',
      title: 'Veterano de Majors',
      description: `Participación en ${majors.length} torneos mayores`,
      date: majors[0]?.begin_at || new Date().toISOString(),
      icon: '🏟️',
      rarity: 'legendary'
    });
  } else if (majors.length === 1) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'championship',
      title: 'Participante de Major',
      description: 'Ha competido en un torneo mayor internacional',
      date: majors[0]?.begin_at || new Date().toISOString(),
      tournament: majors[0]?.tournament?.name,
      icon: '🏆',
      rarity: 'epic'
    });
  }

  // Logros por antigüedad (basado en ID - IDs más bajos = jugadores más antiguos)
  if (player.id < 1000) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'milestone',
      title: 'Pionero del Esport',
      description: 'Uno de los primeros jugadores registrados profesionalmente',
      date: new Date().toISOString(),
      icon: '🎖️',
      rarity: 'legendary'
    });
  } else if (player.id < 5000) {
    achievements.push({
      id: `ach-${achievementId++}`,
      type: 'milestone',
      title: 'Veterano de la Vieja Guardia',
      description: 'Jugador con larga trayectoria en la escena',
      date: new Date().toISOString(),
      icon: '📜',
      rarity: 'epic'
    });
  }

  return achievements;
}

// Función para generar estadísticas específicas del juego
function generateGameStats(player: any, matches: any[]): GameSpecificStats[] {
  const gameStats: GameSpecificStats[] = [];
  
  // Detectar el juego del jugador
  const videogame = player.current_videogame?.slug || 
                    player.current_team?.current_videogame?.slug ||
                    matches[0]?.videogame?.slug;
  
  if (!videogame) return gameStats;

  // Generar estadísticas simuladas pero consistentes basadas en el ID del jugador
  const seed = player.id;
  const baseValue = (key: string) => {
    const hash = key.split('').reduce((a, b) => a + b.charCodeAt(0), seed);
    return (hash % 100) / 100;
  };

  const gameConfigs: Record<string, { name: string; icon: string; stats: any[] }> = {
    'league-of-legends': {
      name: 'League of Legends',
      icon: '🎮',
      stats: [
        { key: 'kills', label: 'Kills', value: Math.round(3 + baseValue('kills') * 7) },
        { key: 'deaths', label: 'Deaths', value: Math.round(2 + baseValue('deaths') * 4) },
        { key: 'assists', label: 'Assists', value: Math.round(5 + baseValue('assists') * 10) },
        { key: 'kda', label: 'KDA', value: (2 + baseValue('kda') * 4).toFixed(2) },
        { key: 'cs_per_min', label: 'CS/min', value: (7 + baseValue('cs') * 3).toFixed(1) },
        { key: 'vision_score', label: 'Vision Score', value: Math.round(30 + baseValue('vision') * 40) },
        { key: 'gold_per_min', label: 'Oro/min', value: Math.round(350 + baseValue('gold') * 150) },
        { key: 'damage_share', label: 'Daño %', value: (15 + baseValue('dmg') * 20).toFixed(1) },
        { key: 'first_blood_rate', label: 'First Blood %', value: (10 + baseValue('fb') * 30).toFixed(1) },
        { key: 'solo_kills', label: 'Solo Kills/game', value: (baseValue('solo') * 2).toFixed(2) },
      ]
    },
    'dota-2': {
      name: 'Dota 2',
      icon: '⚔️',
      stats: [
        { key: 'kills', label: 'Kills', value: Math.round(5 + baseValue('kills') * 10) },
        { key: 'deaths', label: 'Deaths', value: Math.round(3 + baseValue('deaths') * 5) },
        { key: 'assists', label: 'Assists', value: Math.round(8 + baseValue('assists') * 15) },
        { key: 'kda', label: 'KDA', value: (2.5 + baseValue('kda') * 5).toFixed(2) },
        { key: 'last_hits', label: 'Last Hits/min', value: (5 + baseValue('lh') * 4).toFixed(1) },
        { key: 'denies', label: 'Denies/game', value: (5 + baseValue('denies') * 15).toFixed(1) },
        { key: 'gpm', label: 'GPM', value: Math.round(400 + baseValue('gpm') * 250) },
        { key: 'xpm', label: 'XPM', value: Math.round(450 + baseValue('xpm') * 200) },
        { key: 'tower_damage', label: 'Tower DMG/game', value: Math.round(1500 + baseValue('tower') * 3000) },
        { key: 'hero_damage', label: 'Hero DMG/min', value: Math.round(400 + baseValue('hdmg') * 300) },
      ]
    },
    'cs-go': {
      name: 'Counter-Strike 2',
      icon: '🔫',
      stats: [
        { key: 'kills', label: 'Kills', value: Math.round(15 + baseValue('kills') * 10) },
        { key: 'deaths', label: 'Deaths', value: Math.round(12 + baseValue('deaths') * 6) },
        { key: 'kd_ratio', label: 'K/D Ratio', value: (0.8 + baseValue('kd') * 0.8).toFixed(2) },
        { key: 'headshot_pct', label: 'HS%', value: (35 + baseValue('hs') * 25).toFixed(1) },
        { key: 'adr', label: 'ADR', value: (65 + baseValue('adr') * 35).toFixed(1) },
        { key: 'kast', label: 'KAST%', value: (60 + baseValue('kast') * 25).toFixed(1) },
        { key: 'rating', label: 'Rating 2.0', value: (0.85 + baseValue('rating') * 0.5).toFixed(2) },
        { key: 'clutch_wins', label: 'Clutches', value: Math.round(baseValue('clutch') * 15) },
        { key: 'opening_kills', label: 'Opening K/R', value: (0.8 + baseValue('opk') * 0.5).toFixed(2) },
        { key: 'flash_assists', label: 'Flash Assists', value: (baseValue('flash') * 3).toFixed(1) },
      ]
    },
    'ow': {
      name: 'Overwatch 2',
      icon: '🎯',
      stats: [
        { key: 'eliminations', label: 'Elims', value: Math.round(20 + baseValue('elims') * 15) },
        { key: 'deaths', label: 'Deaths', value: Math.round(5 + baseValue('deaths') * 5) },
        { key: 'damage', label: 'Damage', value: Math.round(8000 + baseValue('dmg') * 7000) },
        { key: 'healing', label: 'Healing', value: Math.round(5000 + baseValue('heal') * 8000) },
        { key: 'final_blows', label: 'Final Blows', value: Math.round(10 + baseValue('fb') * 10) },
        { key: 'elims_per_10', label: 'Elims/10min', value: (15 + baseValue('e10') * 15).toFixed(1) },
        { key: 'deaths_per_10', label: 'Deaths/10min', value: (4 + baseValue('d10') * 4).toFixed(1) },
        { key: 'ult_charge_rate', label: 'Ult Rate', value: (80 + baseValue('ult') * 40).toFixed(1) },
      ]
    },
    'r6siege': {
      name: 'Rainbow Six Siege',
      icon: '🛡️',
      stats: [
        { key: 'kills', label: 'Kills', value: Math.round(6 + baseValue('kills') * 6) },
        { key: 'deaths', label: 'Deaths', value: Math.round(4 + baseValue('deaths') * 3) },
        { key: 'kd_ratio', label: 'K/D', value: (0.9 + baseValue('kd') * 0.7).toFixed(2) },
        { key: 'plants', label: 'Plants', value: Math.round(baseValue('plants') * 5) },
        { key: 'entry_kills', label: 'Entry K/R', value: (0.7 + baseValue('entry') * 0.6).toFixed(2) },
        { key: 'clutch_rate', label: 'Clutch %', value: (20 + baseValue('clutch') * 40).toFixed(1) },
        { key: 'survival_rate', label: 'Survival %', value: (40 + baseValue('surv') * 30).toFixed(1) },
        { key: 'headshot_pct', label: 'HS%', value: (30 + baseValue('hs') * 30).toFixed(1) },
      ]
    }
  };

  const config = gameConfigs[videogame];
  if (config) {
    gameStats.push({
      game: videogame,
      gameName: config.name,
      gameIcon: config.icon,
      stats: config.stats
    });
  }

  return gameStats;
}

// Función para generar timeline de carrera
function generateCareerTimeline(player: any, matches: any[]): CareerEvent[] {
  const events: CareerEvent[] = [];
  let eventId = 1;

  // Evento de unirse al equipo actual
  if (player.current_team) {
    events.push({
      id: `event-${eventId++}`,
      type: 'team_join',
      date: player.modified_at || new Date().toISOString(),
      title: `Se unió a ${player.current_team.name}`,
      description: `Fichado como ${player.role || 'jugador'} por ${player.current_team.name}`,
      team: {
        id: player.current_team.id,
        name: player.current_team.name,
        image_url: player.current_team.image_url
      },
      icon: '🎮'
    });
  }

  // Eventos basados en partidos importantes
  matches.slice(0, 5).forEach((match: any) => {
    const matchName = match.name?.toLowerCase() || '';
    if (matchName.includes('final') || matchName.includes('championship')) {
      events.push({
        id: `event-${eventId++}`,
        type: 'tournament',
        date: match.begin_at,
        title: match.name,
        description: `Participación en ${match.tournament?.name || 'torneo'}`,
        icon: '🏆'
      });
    }
  });

  // Ordenar por fecha descendente
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events.slice(0, 10);
}

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

    // Generar logros
    const titleScore = calculateTitleScore(playerData);
    const achievements = generateAchievements(playerData, titleScore, historicalMatches);

    // Generar estadísticas específicas del juego
    const gameStats = generateGameStats(playerData, recentMatches);

    // Generar timeline de carrera
    const careerTimeline = generateCareerTimeline(playerData, [...recentMatches, ...historicalMatches]);

    // Obtener videos de YouTube (highlights del jugador)
    let mediaGallery: MediaItem[] = [];
    try {
      const gameName = playerData.current_videogame?.name || 
                       playerData.current_team?.current_videogame?.name || '';
      const youtubeResults = await searchPlayerHighlights(playerData.name, gameName, 6);
      
      if (youtubeResults.videos.length > 0) {
        mediaGallery = convertYouTubeToMediaItems(youtubeResults.videos, true);
      }
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
    }

    // Calcular años activos y ganancias estimadas
    const yearsActive = playerData.id < 5000 ? 8 + (playerData.id % 5) : 
                        playerData.id < 20000 ? 5 + (playerData.id % 4) :
                        playerData.id < 50000 ? 3 + (playerData.id % 3) : 
                        1 + (playerData.id % 2);
    
    const totalEarnings = titleScore >= 150 ? 500000 + (playerData.id % 500000) :
                          titleScore >= 100 ? 200000 + (playerData.id % 200000) :
                          titleScore >= 70 ? 50000 + (playerData.id % 100000) :
                          10000 + (playerData.id % 30000);

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
      // Nuevos campos
      achievements: achievements,
      media_gallery: mediaGallery,
      career_timeline: careerTimeline,
      game_stats: gameStats,
      years_active: yearsActive,
      total_earnings: totalEarnings,
      signature_heroes: generateSignatureHeroes(playerData),
    };
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching player details:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Server error: ${errorMessage}`, { status: 500 });
  }
}

// Función para generar héroes/personajes signature
function generateSignatureHeroes(player: any): string[] {
  const videogame = player.current_videogame?.slug || 
                    player.current_team?.current_videogame?.slug;
  
  const heroLists: Record<string, string[]> = {
    'league-of-legends': ['Azir', 'Lee Sin', 'Orianna', 'Thresh', 'Kai\'Sa', 'Zeri', 'Ahri', 'Jayce', 'Gnar', 'Renekton'],
    'dota-2': ['Invoker', 'Storm Spirit', 'Anti-Mage', 'Morphling', 'Rubick', 'Earth Spirit', 'Puck', 'Tiny', 'Mars', 'Phoenix'],
    'cs-go': ['AK-47', 'AWP', 'M4A4', 'M4A1-S', 'Desert Eagle'],
    'ow': ['Tracer', 'Genji', 'Winston', 'Ana', 'Lucio', 'Sojourn', 'Kiriko', 'Sigma'],
    'r6siege': ['Ash', 'Jäger', 'Thermite', 'Smoke', 'Mira', 'Vigil', 'Zofia']
  };

  const heroes = heroLists[videogame || ''] || [];
  if (heroes.length === 0) return [];

  // Seleccionar 3 héroes basados en el ID del jugador para consistencia
  const selectedHeroes: string[] = [];
  for (let i = 0; i < 3 && i < heroes.length; i++) {
    const index = (player.id + i * 7) % heroes.length;
    if (!selectedHeroes.includes(heroes[index])) {
      selectedHeroes.push(heroes[index]);
    }
  }

  return selectedHeroes;
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
