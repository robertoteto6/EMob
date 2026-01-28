import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../lib/pandaScoreFetch";
import { apiCache } from "../../../lib/utils";

// Tipos para los resultados de búsqueda
interface SearchResult {
  id: number;
  name: string;
  type: "team" | "player" | "tournament" | "match" | "league" | "serie";
  image_url: string | null;
  league?: string;
  game: string;
  status?: string;
}

interface TeamData {
  id: number;
  name: string;
  image_url?: string;
  league?: {
    name?: string;
  };
}

interface PlayerData {
  id: number;
  name: string;
  image_url?: string;
}

interface TournamentData {
  id: number;
  name: string;
  league?: {
    name?: string;
    image_url?: string;
  };
}

interface MatchData {
  id: number;
  opponents?: Array<{
    opponent?: {
      name?: string;
    };
  }>;
  league?: {
    name?: string;
  };
  status?: string;
}

interface LeagueData {
  id: number;
  name: string;
  image_url?: string;
  url?: string;
}

interface SerieData {
  id: number;
  name: string;
  full_name?: string;
  season?: string;
  year?: number;
}

// Mapeo de IDs de juegos a los nombres de la API de PandaScore
const GAME_MAPPING: Record<string, string> = {
  "dota2": "dota2",
  "lol": "lol",
  "csgo": "csgo",
  "r6siege": "r6siege",
  "ow": "ow",
  "overwatch": "ow",
  "valorant": "valorant",
  "fortnite": "fortnite",
  "pubg": "pubg",
  "apex": "apex",
  "cod": "cod",
  "rl": "rl",
  "sf": "sf",
  "ssb": "ssb",
  "sc2": "sc2",
  "kog": "kog",
  "wr": "wr",
  "wow": "wow",
};

// Timeout para peticiones individuales (8 segundos)
const REQUEST_TIMEOUT = 8000;

async function fetchJSON(base: string, params: string): Promise<any[]> {
  try {
    const searchParams = new URLSearchParams(params);
    searchParams.delete('token'); // Remove token since handled in pandaScoreFetch
    
    // Crear un timeout para la petición usando Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
    });
    
    const fetchPromise = pandaScoreFetch(base, searchParams, { 
      cache: "no-store"
    }).then(res => res.json());
    
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    if ((error as Error).message === 'Request timeout') {
      console.warn(`Request timeout for ${base}`);
    } else {
      console.error(`Error fetching ${base}:`, error);
    }
    return [];
  }
}

// Función para normalizar texto (case-insensitive, trim, etc.)
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Función para calcular relevancia de un resultado
function calculateRelevance(itemName: string, query: string): number {
  const normalizedName = normalizeText(itemName);
  const normalizedQuery = normalizeText(query);
  
  // Coincidencia exacta = máxima relevancia
  if (normalizedName === normalizedQuery) {
    return 100;
  }
  
  // Empieza con la query = alta relevancia
  if (normalizedName.startsWith(normalizedQuery)) {
    return 90;
  }
  
  // Contiene la query = relevancia media
  if (normalizedName.includes(normalizedQuery)) {
    return 70;
  }
  
  // Coincidencias parciales de palabras
  const queryWords = normalizedQuery.split(' ');
  const nameWords = normalizedName.split(' ');
  let wordMatches = 0;
  
  for (const queryWord of queryWords) {
    if (nameWords.some(nameWord => nameWord.includes(queryWord) || queryWord.includes(nameWord))) {
      wordMatches++;
    }
  }
  
  if (wordMatches > 0) {
    return 50 + (wordMatches / queryWords.length) * 20;
  }
  
  return 0;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const gameParam = searchParams.get("game") || undefined;
  const gamesParam = searchParams.get("games"); // Nuevo: soporte para múltiples juegos

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // Determinar lista de juegos: priorizar games param, luego game param, luego todos
  let gameList: string[];
  if (gamesParam) {
    gameList = gamesParam.split(',').map(g => g.trim()).filter(Boolean);
  } else if (gameParam) {
    gameList = [gameParam];
  } else {
    gameList = Object.keys(GAME_MAPPING);
  }

  // Normalizar query para cache
  const normalizedQuery = normalizeText(q);
  const cacheKey = `search:${gameList.join(',')}:${normalizedQuery}`;
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Ejecutar búsquedas en paralelo para todos los juegos
  const searchPromises = gameList.map(async (gameParam) => {
    // Mapear el juego al nombre correcto de la API
    const g = GAME_MAPPING[gameParam] || gameParam;
    const encoded = encodeURIComponent(q);
    const base = `https://api.pandascore.co/${g}`;
    // Aumentar límite de resultados por tipo de 5 a 12
    const params = `per_page=12&search%5Bname%5D=${encoded}`;

    try {
      const [teams, players, tournaments, matches, leagues, series] = await Promise.all([
        fetchJSON(`${base}/teams`, params),
        fetchJSON(`${base}/players`, params),
        fetchJSON(`${base}/tournaments`, params),
        fetchJSON(`${base}/matches`, params),
        fetchJSON(`${base}/leagues`, params),
        fetchJSON(`${base}/series`, params),
      ]);

      const gameResults: (SearchResult & { relevance: number })[] = [];

      teams.forEach((t: TeamData) => {
        const relevance = calculateRelevance(t.name, q);
        gameResults.push({
          id: t.id,
          name: t.name,
          type: "team",
          image_url: t.image_url ?? null,
          league: t.league?.name ?? undefined,
          game: gameParam,
          relevance,
        });
      });

      players.forEach((p: PlayerData) => {
        const relevance = calculateRelevance(p.name, q);
        gameResults.push({
          id: p.id,
          name: p.name,
          type: "player",
          image_url: p.image_url ?? null,
          game: gameParam,
          relevance,
        });
      });

      tournaments.forEach((t: TournamentData) => {
        const relevance = calculateRelevance(t.name, q);
        gameResults.push({
          id: t.id,
          name: t.name,
          type: "tournament",
          image_url: t.league?.image_url ?? null,
          league: t.league?.name ?? undefined,
          game: gameParam,
          relevance,
        });
      });

      matches.forEach((m: MatchData) => {
        const radiant = m.opponents?.[0]?.opponent?.name ?? "TBD";
        const dire = m.opponents?.[1]?.opponent?.name ?? "TBD";
        const matchName = `${radiant} vs ${dire}`;
        const relevance = Math.max(
          calculateRelevance(radiant, q),
          calculateRelevance(dire, q),
          calculateRelevance(matchName, q)
        );
        gameResults.push({
          id: m.id,
          name: matchName,
          type: "match",
          image_url: null,
          league: m.league?.name ?? undefined,
          game: gameParam,
          status: m.status ?? undefined,
          relevance,
        });
      });

      leagues.forEach((l: LeagueData) => {
        const relevance = calculateRelevance(l.name, q);
        gameResults.push({
          id: l.id,
          name: l.name,
          type: "league",
          image_url: l.image_url ?? null,
          game: gameParam,
          relevance,
        });
      });

      series.forEach((s: SerieData) => {
        const name = s.full_name || s.name;
        const relevance = calculateRelevance(name, q);
        gameResults.push({
          id: s.id,
          name: name,
          type: "serie",
          image_url: null,
          game: gameParam,
          relevance,
        });
      });

      return gameResults;
    } catch (err) {
      console.error(`Search API error for game ${gameParam}:`, err);
      return [];
    }
  });

  try {
    const resultsArrays = await Promise.all(searchPromises);
    let results = resultsArrays.flat();

    // Ordenar por relevancia (mayor a menor) y luego por tipo
    results.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      // Si tienen la misma relevancia, priorizar equipos y jugadores
      const typePriority: Record<string, number> = {
        team: 4,
        player: 3,
        tournament: 2,
        league: 1,
        serie: 1,
        match: 0,
      };
      return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
    });

    // Remover la propiedad relevance antes de devolver
    const finalResults: SearchResult[] = results
      .filter(r => r.relevance > 0) // Solo resultados con alguna relevancia
      .slice(0, 50)
      .map(({ relevance, ...rest }) => rest);

    apiCache.set(cacheKey, finalResults);
    return NextResponse.json(finalResults);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Error al realizar la búsqueda" },
      { status: 500 }
    );
  }
}
