import { NextResponse } from "next/server";
import { getGeminiModel } from "../../../../lib/gemini";

// Definir interfaces para el prompt (simplificadas para el texto del prompt)
const interfacesPrompt = `
interface RegionInfo { name: string; flag: string; region: string; }
interface TeamData { id: number; name: string; acronym: string; image_url: string | null; location: string | null; current_videogame: any; players: any[]; }
interface RecentMatch { id: number; name: string; begin_at: string; winner: { id: number; name: string } | null; opponents: Array<{ opponent: { id: number; name: string; image_url: string | null; } }>; league: { id: number; name: string; image_url: string | null; }; tournament: { id: number; name: string; }; }
interface Achievement { id: string; type: 'championship' | 'mvp' | 'finals' | 'allstar' | 'record' | 'milestone'; title: string; description: string; date: string; tournament?: string; team?: string; icon: string; rarity: 'legendary' | 'epic' | 'rare' | 'common'; }
interface MediaItem { id: string; type: 'image' | 'video' | 'highlight'; url: string; thumbnail?: string; title: string; description?: string; date?: string; source: 'youtube' | 'twitch' | 'instagram' | 'official' | 'other'; duration?: string; views?: number; }
interface CareerEvent { id: string; type: 'team_join' | 'team_leave' | 'achievement' | 'tournament' | 'milestone'; date: string; title: string; description?: string; team?: { id: number; name: string; image_url?: string; }; icon: string; }
interface GameSpecificStats { game: string; gameName: string; gameIcon: string; stats: { key: string; label: string; value: string | number; description?: string; trend?: 'up' | 'down' | 'stable'; }[]; }

Target Interface:
interface PlayerDetail {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null; // Code like 'KR', 'CN'
  role: string | null;
  image_url: string | null; // Use placeholder if unknown
  current_team: string | null;
  current_team_id: number | null;
  current_team_image: string | null;
  age: number | null;
  birthday: string | null; // ISO date
  hometown: string | null;
  modified_at: string | null;
  title_score: number; // 0-200 calculated score
  recent_matches: RecentMatch[];
  historical_matches: RecentMatch[];
  win_rate: string; // "55.5"
  total_matches: number;
  team_data: TeamData | null;
  professional_status: string; // "Activo" | "Libre"
  region_info: RegionInfo | null;
  is_veteran: boolean;
  instagram_followers: number;
  instagram_handle: string | null;
  achievements: Achievement[];
  media_gallery: MediaItem[];
  career_timeline: CareerEvent[];
  game_stats: GameSpecificStats[];
  signature_heroes?: string[];
  peak_rating?: number;
  total_earnings?: number;
  years_active?: number;
}
`;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const model = getGeminiModel();

    // Determinar si es un ID numérico o un nombre (a veces Next.js pasa strings raros, asumimos que si es numérico es un ID simulado)
    const isMockId = !isNaN(Number(id));

    // Configurar el prompt
    const prompt = `
      Actúa como una base de datos experta en esports.
      Genera un perfil detallado de jugador en formato JSON para el identificar "${id}".
      
      Si el ID corresponde a un jugador real famoso, usa sus datos reales aproximados.
      Si no, INVENTA un perfil completo, coherente y realista de un jugador profesional de alto nivel (puede ser de LOL, Dota 2, CS2, etc.).
      
      ${interfacesPrompt}
      
      REGLAS:
      1. Devuelve SOLO el JSON válido. Sin markdown.
      2. Asegúrate de que todos los campos requeridos estén presentes.
      3. Usa imágenes de placeholder (https://placehold.co/...) si no tienes una real.
      4. Los datos deben ser coherentes (ej. si es coreano, nombre coreano; si juega LOL, stats de LOL).
      5. La 'media_gallery' debe tener al menos 3 items (simulados).
      6. 'achievements' debe tener al menos 4 logros variados.
      7. 'career_timeline' debe contar una historia coherente.
      8. 'recent_matches' debe tener 5 partidas.
      
      Genera el JSON para el objeto PlayerDetail.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const playerData = JSON.parse(cleanJson);

    // Asegurar que el ID devuelto coincida con el solicitado si es posible, o que sea numérico
    if (isMockId) {
      playerData.id = Number(id);
    }

    return NextResponse.json(playerData);

  } catch (error) {
    console.error("Error generating player details with Gemini:", error);
    // Fallback de emergencia muy básico para no romper el frontend
    return NextResponse.json({
      id: Number(id) || 123,
      name: "Error Loading",
      role: "Unknown",
      title_score: 0,
      achievements: [],
      media_gallery: [],
      recent_matches: []
    }, { status: 200 }); // Retornamos 200 con datos vacíos para que no crashee la UI totalmente
  }
}

