import { NextResponse } from "next/server";
import { getGeminiModel } from "../../../../../lib/gemini";

// Interfaces para el prompt
const interfacesPrompt = `
interface CareerHighlight { match_name: string; tournament: string; date: string; importance: string; }
interface VeteranAnalysis { career_highlights: CareerHighlight[]; playing_style: string; legacy_impact: string; achievements_summary: string; ai_insights: string[]; }
`;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const model = getGeminiModel();
    const isMockId = !isNaN(Number(id));

    const prompt = `
      Actúa como un experto analista de esports.
      Genera un ANÁLISIS detallado para el jugador con ID/Nombre "${id}".
      
      Si es un jugador real conocido, usa datos reales. Si no, inventa un análisis coherente para un jugador profesional de alto nivel.
      
      ${interfacesPrompt}
      
      Devuelve SOLO un objeto JSON válido que cumpla con la interfaz VeteranAnalysis.
      
      Detalles que debes llenar:
      - playing_style: Describe su estilo (ej: agresivo, táctico, soporte).
      - legacy_impact: Su impacto en la escena competitiva.
      - ai_insights: 3 a 5 puntos clave o curiosidades generadas por IA.
      - career_highlights: Lista de 3 a 5 momentos cumbre.
      
      NO uses markdown. Solo JSON raw.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const analysisData = JSON.parse(cleanJson);

    return NextResponse.json({
      player_id: isMockId ? Number(id) : id,
      player_name: "Player " + id, // El nombre real vendría en el objeto analysis si lo pidiéramos, pero mantenemos compatibilidad básica
      is_veteran: true, // Asumimos que si pedimos análisis es relevante
      analysis: analysisData,
      generated_at: new Date().toISOString(),
      ai_powered: true,
      provider: "gemini-3.0-flash" // Marca de agua
    });

  } catch (error) {
    console.error("Error generating analysis with Gemini:", error);
    return new NextResponse("Internal Server Error: " + (error instanceof Error ? error.message : "Unknown"), { status: 500 });
  }
}
