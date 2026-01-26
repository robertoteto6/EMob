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
  const gamesParam = searchParams.get("games"); // Nuevo: soporte para múltiples juegos
  const q = searchParams.get("q") || "";
  const search = searchParams.get("search") || q; // Soporte para ambos parámetros
  
  // Si hay games param, usar múltiples juegos; si no, usar game param (compatibilidad)
  const gameIds = gamesParam 
    ? gamesParam.split(',').map(g => g.trim()).filter(Boolean)
    : [gameParam];

  // Si no hay juegos, retornar array vacío
  if (gameIds.length === 0) {
    return NextResponse.json([]);
  }
  
  try {
    // Procesar múltiples juegos en paralelo
    const promises = gameIds.map(async (gameId) => {
      // Mapear el juego al nombre correcto de la API
      const game = GAME_MAPPING[gameId] || gameId;
    
      // Verificar cache primero
      const cacheKey = getCacheKey(game, search);
      const cachedResult = getCachedData(cacheKey);
      if (cachedResult) {
        console.log(`Returning cached data for ${game} (${cachedResult.length} teams)`);
        return cachedResult.map((team: any) => ({ ...team, _gameId: gameId }));
      }

      console.log(`Fetching teams for game: ${gameId} -> ${game}`);
      
      // Rate limiting
      await waitForRateLimit();
      
      const url = new URL(`https://api.pandascore.co/${game}/teams`);
      url.searchParams.set("per_page", search ? "20" : "30");
      if (search) {
        url.searchParams.set("search[name]", search);
      }
      
      try {
        const res = await pandaScoreFetch(url.toString(), url.searchParams, {
          cache: "no-store",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`API Error for game ${gameId}: ${res.status} - ${errorText}`);

          // Si es rate limit, devolver datos de respaldo
          if (res.status === 429) {
            console.log("Rate limit hit, returning fallback data");
            const fallbackData = getFallbackTeams(game);
            if (fallbackData.length > 0) {
              const enriched = fallbackData.map((team: any) => ({ ...team, _gameId: gameId }));
              setCachedData(cacheKey, enriched);
              return enriched;
            }
            return [];
          }

          return [];
        }
        
        const data = await res.json();
        
        if (!Array.isArray(data)) {
          console.error(`API did not return an array for game ${gameId}:`, data);
          return [];
        }
        
        // Enriquecer los datos de equipos
        const enrichedTeams = data.slice(0, 30).map((t: any) => {
          let gloryScore = 0;
          
          if (t.players && Array.isArray(t.players)) {
            gloryScore += t.players.length * 2;
          }
          
          if (t.image_url) gloryScore += 8;
          if (t.acronym) gloryScore += 5;
          
          return {
            id: t.id,
            name: t.name,
            acronym: t.acronym,
            image_url: t.image_url ?? null,
            current_videogame: t.current_videogame,
            players: t.players?.length || 0,
            modified_at: t.modified_at,
            tournaments: [],
            gloryScore: Math.max(0, gloryScore),
            _gameId: gameId, // Agregar metadata del juego
          };
        });
        
        // Ordenar por puntuación de gloria
        const sortedTeams = enrichedTeams.sort((a, b) => b.gloryScore - a.gloryScore);
        
        // Guardar en cache
        setCachedData(cacheKey, sortedTeams);
        
        return sortedTeams;
      } catch (error) {
        console.error(`Error fetching teams for game ${gameId}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const allTeams = results.flat();
    
    // Ordenar todos los equipos por gloria
    allTeams.sort((a, b) => b.gloryScore - a.gloryScore);
    
    return NextResponse.json(allTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json([]);
  }
}
