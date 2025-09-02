import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { getFallbackTeams } from "../../../lib/fallbackData";

// Mapeo de IDs de juegos a los nombres de la API de PandaScore
const GAME_MAPPING: Record<string, string> = {
  "dota2": "dota2",
  "lol": "lol", 
  "csgo": "csgo",
  "r6siege": "r6siege",
  "ow": "ow", // Overwatch usa "ow" en PandaScore
  "overwatch": "ow" // Fallback para compatibilidad
};

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
  const gameParam = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  const search = searchParams.get("search") || q; // Soporte para ambos parámetros
  
  try {
    // Mapear el juego al nombre correcto de la API
    const game = GAME_MAPPING[gameParam] || gameParam;
    
    // Verificar cache primero
    const cacheKey = getCacheKey(game, search);
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log(`Returning cached data for ${game} (${cachedResult.length} teams)`);
      return NextResponse.json(cachedResult);
    }

    console.log(`Fetching teams for game: ${gameParam} -> ${game}`);
    
    // Rate limiting
    await waitForRateLimit();
    
    const url = new URL(`https://api.pandascore.co/${game}/teams`);
    url.searchParams.set("per_page", search ? "20" : "30");
    if (search) {
      url.searchParams.set("search[name]", search);
    }
    
    console.log(`API URL: ${url.toString()}`);
    
    const res = await pandaScoreFetch(url.toString(), url.searchParams, {
      cache: "no-store",
    });
    
    console.log(`API Response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error: ${res.status} - ${errorText}`);

      // Si es rate limit, devolver datos de respaldo
      if (res.status === 429) {
        console.log("Rate limit hit, returning fallback data");
        const fallbackData = getFallbackTeams(game);
        if (fallbackData.length > 0) {
          setCachedData(cacheKey, fallbackData);
          return NextResponse.json(fallbackData);
        }
        return NextResponse.json([]);
      }

      // En caso de error devolver array vacío para evitar 404 en el cliente
      return NextResponse.json([]);
    }
    
    const data = await res.json();
    console.log(`Received ${data.length} teams for ${game}`);
    
    if (!Array.isArray(data)) {
      console.error("API did not return an array:", data);
      return NextResponse.json([]);
    }
    
    // Enriquecer los datos de equipos con información básica (sin muchas requests para evitar rate limit)
    const enrichedTeams = data.slice(0, 30).map((t: any, index: number) => {
      let gloryScore = 0;
      
      // Calcular gloria usando solo datos reales del equipo
      if (t.players && Array.isArray(t.players)) {
        gloryScore += t.players.length * 2; // 2 puntos por jugador
      }
      
      // Puntos por tener logo oficial
      if (t.image_url) gloryScore += 8;
      
      // Puntos por tener acrónimo
      if (t.acronym) gloryScore += 5;
      
      return {
        id: t.id,
        name: t.name,
        acronym: t.acronym,
        image_url: t.image_url ?? null,
        current_videogame: t.current_videogame,
        players: t.players?.length || 0,
        modified_at: t.modified_at,
        gloryScore: Math.max(0, gloryScore)
      };
    });
    
    // Ordenar por puntuación de gloria (mayor a menor)
    const sortedTeams = enrichedTeams.sort((a, b) => b.gloryScore - a.gloryScore);
    
    // Guardar en cache
    setCachedData(cacheKey, sortedTeams);
    
    return NextResponse.json(sortedTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json([]);
  }
}
