import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";
import { getFallbackTeams } from "../../../lib/fallbackData";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

// Sistema de cache simple en memoria
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 segundo entre requests

// Cache para equipos
function getCacheKey(game: string, search: string = '') {
  return `teams_${game}_${search}`;
}

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Cache hit for ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`Cached data for ${key}`);
}

// Rate limiting helper
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  const search = searchParams.get("search") || q; // Soporte para ambos parámetros
  
  try {
    // Verificar cache primero
    const cacheKey = getCacheKey(game, search);
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log(`Returning cached data for ${game} (${cachedResult.length} teams)`);
      return NextResponse.json(cachedResult);
    }

    // Mapear nombres de juegos
    let gameSlug = game;
    if (game === "lol") gameSlug = "lol"; // No cambiar, la API usa 'lol'
    if (game === "csgo") gameSlug = "csgo"; // No cambiar, la API usa 'csgo'
    if (game === "r6siege") gameSlug = "r6siege"; // No cambiar, la API usa 'r6siege'
    
    console.log(`Fetching teams for game: ${game} -> ${gameSlug}`);
    
    // Rate limiting
    await waitForRateLimit();
    
    const url = new URL(`https://api.pandascore.co/${gameSlug}/teams`);
    url.searchParams.set("per_page", search ? "20" : "30"); // Reducido para evitar rate limit
    url.searchParams.set("token", PANDA_SCORE_TOKEN);
    if (search) {
      url.searchParams.set("search[name]", search);
    }
    
    console.log(`API URL: ${url.toString()}`);
    
    const res = await fetch(url.toString(), {
      cache: "no-store",
      dispatcher: getProxyAgent(),
    } as RequestInit & { dispatcher?: any });
    
    console.log(`API Response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error: ${res.status} - ${errorText}`);
      
      // Si es rate limit, devolver datos de respaldo
      if (res.status === 429) {
        console.log("Rate limit hit, returning fallback data");
        const fallbackData = getFallbackTeams(gameSlug);
        if (fallbackData.length > 0) {
          setCachedData(cacheKey, fallbackData);
          return NextResponse.json(fallbackData);
        }
        return NextResponse.json([]);
      }
      
      return new NextResponse(`Failed to fetch teams: ${res.status} - ${errorText}`, { status: res.status });
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} teams for ${gameSlug}`);
    
    if (!Array.isArray(data)) {
      console.error("API did not return an array:", data);
      return new NextResponse("Invalid API response format", { status: 500 });
    }
    
    // Enriquecer los datos de equipos con información de torneos (limitado para evitar rate limit)
    const enrichedTeams = await Promise.all(data.slice(0, 20).map(async (t, index) => {
      let tournaments = [];
      let gloryScore = 0;
      
      try {
        // Solo obtener torneos para equipos importantes (máximo 15 para evitar rate limit)  
        if (index < 15) {
          // Añadir delay progresivo para evitar rate limit
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, 200 * index));
          }
          
          // Obtener torneos del equipo
          const tournamentUrl = new URL(`https://api.pandascore.co/${gameSlug}/tournaments`);
          tournamentUrl.searchParams.set("filter[winner_id]", t.id.toString());
          tournamentUrl.searchParams.set("per_page", "5"); // Reducido
          tournamentUrl.searchParams.set("token", PANDA_SCORE_TOKEN);
          
          const tournamentRes = await fetch(tournamentUrl.toString(), {
            cache: "no-store",
            dispatcher: getProxyAgent(),
          } as RequestInit & { dispatcher?: any });
          
          if (tournamentRes.ok) {
            const tournamentData = await tournamentRes.json();
            tournaments = Array.isArray(tournamentData) ? tournamentData.slice(0, 3) : [];
            
            // Calcular puntuación de gloria basada en torneos ganados
            gloryScore = tournaments.reduce((score, tournament) => {
              const tier = tournament.tier?.toLowerCase();
              const prizepool = tournament.prizepool;
              let points = 1; // Punto base por torneo ganado
              
              // Puntos extra por tier
              if (tier === 's') points += 10;
              else if (tier === 'a') points += 7;
              else if (tier === 'b') points += 4;
              else if (tier === 'c') points += 2;
              
              // Puntos extra por prize pool
              if (prizepool && typeof prizepool === 'string') {
                const prizeValue = prizepool.replace(/[^0-9]/g, '');
                if (parseInt(prizeValue) > 1000000) points += 5; // Más de 1M
                else if (parseInt(prizeValue) > 100000) points += 3; // Más de 100K
                else if (parseInt(prizeValue) > 10000) points += 1; // Más de 10K
              }
              
              return score + points;
            }, 0);
          }
        }
      } catch (error) {
        console.log(`Failed to fetch tournaments for team ${t.id}:`, error);
      }
      
      return {
        id: t.id,
        name: t.name,
        acronym: t.acronym,
        image_url: t.image_url ?? null,
        current_videogame: t.current_videogame,
        players: t.players?.length || 0,
        modified_at: t.modified_at,
        tournaments: tournaments.map(tournament => ({
          id: tournament.id,
          name: tournament.name,
          tier: tournament.tier,
          prizepool: tournament.prizepool,
          begin_at: tournament.begin_at,
          end_at: tournament.end_at,
          league: tournament.league?.name
        })),
        gloryScore
      };
    }));
    
    // Ordenar por puntuación de gloria (mayor a menor)
    const sortedTeams = enrichedTeams.sort((a, b) => b.gloryScore - a.gloryScore);
    
    // Guardar en cache
    setCachedData(cacheKey, sortedTeams);
    
    return NextResponse.json(sortedTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(`Server error: ${errorMessage}`, { status: 500 });
  }
}
