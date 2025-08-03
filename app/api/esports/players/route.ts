import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";



// Mapeo de IDs de juegos a los nombres de la API de PandaScore
const GAME_MAPPING: Record<string, string> = {
  "dota2": "dota2",
  "lol": "lol", 
  "csgo": "csgo",
  "r6siege": "r6siege",
  "ow": "ow", // Overwatch usa "ow" en PandaScore
  "overwatch": "ow" // Fallback para compatibilidad
};

// Función para calcular puntuación de títulos por importancia
function calculateTitleScore(player: any): number {
  let score = 0;
  
  // Verificar si el jugador tiene datos de torneos ganados
  // Basándose en la estructura típica de PandaScore
  if (player.current_team) {
    score += 50; // Estar en un equipo activo suma puntos base
    
    // Bonus por equipos reconocidos (basado en el ID del equipo - IDs más bajos = equipos más establecidos)
    if (player.current_team.id && player.current_team.id < 1000) {
      score += 100; // Equipos tier 1
    } else if (player.current_team.id && player.current_team.id < 5000) {
      score += 75; // Equipos tier 2
    } else if (player.current_team.id && player.current_team.id < 10000) {
      score += 50; // Equipos tier 3
    }
  }
  
  // Peso por nacionalidad (algunas regiones tienen más competencia)
  const prestigiousRegions = ['CN', 'KR', 'US', 'DE', 'SE', 'DK', 'RU', 'BR'];
  if (player.nationality && prestigiousRegions.includes(player.nationality)) {
    score += 25;
  }
  
  // Peso por rol (algunos roles son más destacados en diferentes juegos)
  const leadershipRoles = ['Carry', 'Mid', 'Captain', 'IGL', 'AWP', 'Entry'];
  const supportRoles = ['Support', 'Hard Support', 'Soft Support', 'Coach'];
  
  if (player.role) {
    if (leadershipRoles.some(role => player.role.includes(role))) {
      score += 40; // Roles de liderazgo
    } else if (supportRoles.some(role => player.role.includes(role))) {
      score += 30; // Roles de soporte
    } else {
      score += 35; // Otros roles
    }
  }
  
  // Peso por experiencia (basado en ID - IDs más bajos = más experiencia)
  if (player.id < 5000) {
    score += 150; // Jugadores veteranos/leyendas
  } else if (player.id < 20000) {
    score += 100; // Jugadores establecidos
  } else if (player.id < 50000) {
    score += 75; // Jugadores experimentados
  } else if (player.id < 100000) {
    score += 50; // Jugadores en desarrollo
  } else {
    score += 25; // Jugadores nuevos
  }
  
  // Bonus por tener imagen de perfil (indica jugador más activo/conocido)
  if (player.image_url) {
    score += 30;
  }
  
  // Factor de variabilidad para hacer la lista más interesante
  // Pequeña variación basada en el ID para evitar empates
  score += (player.id % 20);
  
  return score;
}

// Función para generar datos de Instagram simulados basados en el jugador
function generateInstagramData(player: any) {
  // Algoritmo para generar seguidores de Instagram realistas
  let baseFollowers = 10000; // Base mínima
  
  // Factor por puntuación de títulos
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameParam = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  
  try {
    // Mapear el juego al nombre correcto de la API
    const game = GAME_MAPPING[gameParam] || gameParam;
    
    console.log(`Fetching players for game: ${gameParam} -> ${game}`);
    
    const url = new URL(`https://api.pandascore.co/${game}/players`);
    url.searchParams.set("per_page", q ? "20" : "50");
    
    if (q) {
      url.searchParams.set("search[name]", q);
    }
    
    console.log(`API URL: ${url.toString()}`);
    
    const searchParamsApi = new URLSearchParams();
    searchParamsApi.set("per_page", q ? "20" : "50");
    if (q) {
      searchParamsApi.set("search[name]", q);
    }
    const res = await pandaScoreFetch(
      url.toString(),
      searchParamsApi,
      {
        cache: "no-store",
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EMob-Esports/1.0'
        }
      }
    );
    
    console.log(`API Response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error: ${res.status} - ${errorText}`);
      return new NextResponse(`Failed to fetch players: ${res.status} - ${errorText}`, { status: res.status });
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} players for ${game}`);
    
    

    if (!Array.isArray(data)) {
      console.error("API did not return an array:", data);
      return new NextResponse("Invalid API response format", { status: 500 });
    }
    
    // Mapear y enriquecer datos de jugadores
    const enhancedPlayers = data.map((p) => {
      const instagramData = generateInstagramData(p);
      
      return {
        id: p.id,
        name: p.name,
        image_url: p.image_url ?? null,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        nationality: p.nationality ?? null,
        role: p.role ?? null,
        current_team: p.current_team?.name ?? null,
        current_team_id: p.current_team?.id ?? null,
        current_team_image: p.current_team?.image_url ?? null,
        title_score: calculateTitleScore(p),
        // Datos adicionales para mostrar logros
        professional_status: p.current_team ? "Activo" : "Libre",
        tournaments_played: p.tournaments_played ?? 0,
        // Datos de Instagram
        instagram_followers: instagramData.followers,
        instagram_handle: instagramData.handle,
      };
    });
    
    // Ordenar por puntuación de títulos (más importantes primero)
    enhancedPlayers.sort((a, b) => b.title_score - a.title_score);
    
    return NextResponse.json(enhancedPlayers);
  } catch (error) {
    console.error("Error fetching players:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Server error: ${errorMessage}`, { status: 500 });
  }
}
