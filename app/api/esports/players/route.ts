import { NextResponse } from "next/server";
import { getGeminiModel } from "../../../lib/gemini";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameParam = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";

  try {
    const model = getGeminiModel();

    // Configuración del prompt para asegurar respuesta JSON limpia
    const prompt = `
      Genera una lista de 15 jugadores profesionales de esports para el juego "${gameParam}".
      ${q ? `La búsqueda debe estar relacionada con: "${q}".` : "Incluye jugadores populares y actuales."}
      
      IMPORTANTE: Devuelve SOLO un objeto JSON válido que contenga un array bajo la clave "players".
      No incluyas markdown (como \`\`\`json), ni texto adicional. Solo el JSON crudo.
      
      Cada jugador debe tener la siguiente estructura exacta:
      {
        "id": number (generar un ID aleatorio único),
        "name": string (nickname),
        "first_name": string (nombre real),
        "last_name": string (apellido real),
        "nationality": string (código de país de 2 letras, ej: KR, CN, DK, PE),
        "role": string (rol en el juego, ej: Mid, Carry, Support),
        "current_team": {
          "id": number,
          "name": string,
          "image_url": string (url de logo de equipo ficticio o real si sabes)
        },
        "image_url": string (null),
        "tournaments_played": number (entre 5 y 100)
      }
      
      Inventa o usa datos reales si los conoces, pero la prioridad es tener datos completos y coherentes.
      Asegura variedad en nacionalidades y equipos.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Limpieza básica por si el modelo incluye markdown
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      data = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Error parsing Gemini response:", e);
      // Fallback simple por si falla el parseo
      return NextResponse.json([{ id: 1, name: "GeminiError", role: "AI" }]);
    }

    const players = data.players || [];

    // Enriquecer y calcular scores
    const enhancedPlayers = players.map((p: any) => {
      // Cálculo simplificado de score para demo
      const titleScore = Math.floor(Math.random() * 200) + 50;

      // Simular seguidores de IG
      const instagramFollowers = Math.floor(Math.random() * 1000000) + 10000;

      return {
        id: p.id,
        name: p.name,
        image_url: p.image_url ?? "https://placehold.co/400x400/1a1a1a/white?text=" + p.name[0],
        first_name: p.first_name,
        last_name: p.last_name,
        nationality: p.nationality,
        role: p.role,
        current_team: p.current_team?.name ?? "Free Agent",
        current_team_id: p.current_team?.id ?? null,
        current_team_image: p.current_team?.image_url ?? null,
        title_score: titleScore,
        professional_status: p.current_team ? "Activo" : "Libre",
        tournaments_played: p.tournaments_played ?? 0,
        instagram_followers: instagramFollowers,
        instagram_handle: p.name.toLowerCase().replace(/\s/g, '_'),
      };
    });

    // Ordenar por popularidad/score
    enhancedPlayers.sort((a: any, b: any) => b.title_score - a.title_score);

    return NextResponse.json(enhancedPlayers);

  } catch (error) {
    console.error("Error fetching players from Gemini:", error);
    return new NextResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown'}`, { status: 500 });
  }
}
