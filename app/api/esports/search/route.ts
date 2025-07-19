import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  if (q.length < 1) return NextResponse.json([]);
  
  // Mapear juegos a los IDs correctos de PandaScore
  const gameMapping: { [key: string]: string } = {
    "dota2": "dota2",
    "lol": "lol", 
    "csgo": "csgo", // Cambiar de cs2 a csgo
    "r6siege": "r6siege"
  };
  
  const mappedGame = gameMapping[game] || game;
  const base = `https://api.pandascore.co/${mappedGame}`;
  const tokenParam = `token=${PANDA_SCORE_TOKEN}`;

  async function load(endpoint: string, extraParams: string = "") {
    // Múltiples intentos de búsqueda para mejor cobertura
    const searchQueries = [
      `search[name]=${encodeURIComponent(q)}`,
      `search[slug]=${encodeURIComponent(q.toLowerCase())}`,
      `filter[name]=${encodeURIComponent(q)}`,
    ];
    
    for (const searchQuery of searchQueries) {
      try {
        const url = `${base}/${endpoint}?per_page=5&${searchQuery}${extraParams}&${tokenParam}`;
        console.log(`Searching: ${url}`);
        
        const res = await fetch(url, { 
          cache: "no-store", 
          dispatcher: getProxyAgent() 
        } as RequestInit & { dispatcher?: any });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            return data;
          }
        }
      } catch (error) {
        console.error(`Error searching ${endpoint}:`, error);
      }
    }
    
    return [];
  }

  try {
    // Búsqueda en paralelo con mejor handling
    const [teams, players, matches, tournaments] = await Promise.all([
      load("teams"),
      load("players"), 
      load("matches", "&sort=begin_at"),
      load("tournaments", "&sort=begin_at"),
    ]);

    console.log(`Search results for "${q}":`, {
      teams: teams?.length || 0,
      players: players?.length || 0, 
      matches: matches?.length || 0,
      tournaments: tournaments?.length || 0
    });

    const list = [
      // Equipos - mejorar mapeo
      ...(teams as any[]).map((t) => ({ 
        type: "team", 
        id: t.id, 
        name: t.name || t.slug || `Team ${t.id}`, 
        image_url: t.image_url || null,
        league: t.current_lineup?.length ? `${t.current_lineup.length} jugadores` : 
                t.leagues?.length ? t.leagues[0]?.name : "Sin liga",
        game: game,
        slug: t.slug
      })),
      
      // Jugadores - mejorar mapeo
      ...(players as any[]).map((p) => ({ 
        type: "player", 
        id: p.id, 
        name: p.name || p.slug || `Player ${p.id}`, 
        image_url: p.image_url || null,
        league: p.current_team?.name || "Sin equipo",
        game: game,
        slug: p.slug
      })),
      
      // Partidos - mejorar mapeo
      ...(matches as any[]).map((m) => {
        const team1 = m.opponents?.[0]?.opponent?.name || "TBD";
        const team2 = m.opponents?.[1]?.opponent?.name || "TBD";
        
        let status = "Próximo";
        if (m.status === "running") status = "En vivo";
        else if (m.status === "finished") status = "Finalizado";
        else if (m.status === "not_started") status = "Próximo";
        
        return { 
          type: "match", 
          id: m.id, 
          name: `${team1} vs ${team2}`, 
          image_url: null,
          league: m.league?.name || m.tournament?.name || "",
          status: status,
          game: game
        };
      }),
      
      // Torneos - mejorar mapeo
      ...(tournaments as any[]).map((t) => {
        const now = new Date();
        const beginAt = t.begin_at ? new Date(t.begin_at) : null;
        const endAt = t.end_at ? new Date(t.end_at) : null;
        
        let status = "Próximo";
        if (beginAt && endAt) {
          if (now >= beginAt && now <= endAt) status = "En curso";
          else if (now > endAt) status = "Finalizado";
        }
        
        return { 
          type: "tournament", 
          id: t.id, 
          name: t.name || t.slug || `Tournament ${t.id}`, 
          image_url: t.image_url || null,
          league: t.league?.name || t.serie?.name || "",
          status: status,
          game: game,
          slug: t.slug
        };
      }),
    ];

    // Filtrar resultados duplicados y mejorar relevancia
    const uniqueResults = new Map();
    
    list.forEach(item => {
      const key = `${item.type}-${item.id}`;
      if (!uniqueResults.has(key)) {
        // Calcular relevancia basada en coincidencia del nombre
        const nameMatch = item.name.toLowerCase().includes(q.toLowerCase());
        const exactMatch = item.name.toLowerCase() === q.toLowerCase();
        const startsWithMatch = item.name.toLowerCase().startsWith(q.toLowerCase());
        
        let relevanceScore = 0;
        if (exactMatch) relevanceScore = 100;
        else if (startsWithMatch) relevanceScore = 80;
        else if (nameMatch) relevanceScore = 60;
        else relevanceScore = 20;
        
        uniqueResults.set(key, { ...item, relevanceScore });
      }
    });

    // Convertir a array y ordenar por relevancia
    const sorted = Array.from(uniqueResults.values()).sort((a: any, b: any) => {
      // Primero por relevancia
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Luego por tipo (equipos primero, luego jugadores, etc.)
      const typeOrder = { team: 1, player: 2, match: 3, tournament: 4 };
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] || 5;
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] || 5;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Finalmente por status (activos primero)
      if (a.status && b.status) {
        const statusOrder = { "En vivo": 1, "En curso": 1, "Próximo": 2, "Finalizado": 3 };
        const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] || 4;
        const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] || 4;
        if (aStatusOrder !== bStatusOrder) return aStatusOrder - bStatusOrder;
      }
      
      return a.name.localeCompare(b.name);
    });

    // Si no encontramos nada específico, intentar búsqueda más amplia
    if (sorted.length === 0 && q.length >= 2) {
      console.log(`No results found for "${q}", trying broader search...`);
      
      // Búsqueda más amplia sin filtros específicos  
      const broadSearchUrl = `${base}/teams?per_page=10&${tokenParam}`;
      
      try {
        const broadRes = await fetch(broadSearchUrl, { 
          cache: "no-store", 
          dispatcher: getProxyAgent() 
        } as RequestInit & { dispatcher?: any });
        
        if (broadRes.ok) {
          const broadData = await broadRes.json();
          const filtered = broadData.filter((t: any) => 
            t.name?.toLowerCase().includes(q.toLowerCase()) ||
            t.slug?.toLowerCase().includes(q.toLowerCase())
          );
          
          if (filtered.length > 0) {
            console.log(`Found ${filtered.length} results in broad search`);
            const broadResults = filtered.map((t: any) => ({
              type: "team",
              id: t.id,
              name: t.name || t.slug || `Team ${t.id}`,
              image_url: t.image_url || null,
              league: "Equipo",
              game: game,
              relevanceScore: 50
            }));
            
            return NextResponse.json(broadResults.slice(0, 8));
          }
        }
      } catch (error) {
        console.error("Broad search failed:", error);
      }
    }

    console.log(`Returning ${sorted.length} sorted results`);
    return NextResponse.json(sorted.slice(0, 12)); // Máximo 12 resultados
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json([]);
  }
}
