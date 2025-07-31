import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";
import { getGameApiName } from "../../../lib/gameConfig";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game") || "dota2";
    const tournamentId = searchParams.get("tournamentId");
    
    // Mapear el juego al nombre correcto de la API usando la configuración centralizada
    const game = getGameApiName(gameParam);
    
    let url = `https://api.pandascore.co/${game}/matches?per_page=50`;
    if (tournamentId) {
      url += `&filter[tournament_id]=${tournamentId}`;
    }
    url += `&token=${PANDA_SCORE_TOKEN}`;
    
    const res = await fetch(
      url,
      // Use a proxy when running in environments that require it.
      { 
        cache: "no-store", 
        dispatcher: getProxyAgent(),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EMob-Esports/1.0'
        }
      } as RequestInit & {
        dispatcher?: any;
      }
    );
    
    if (!res.ok) {
      console.error(`API Error for game ${game}: ${res.status} ${res.statusText}`);
      // En lugar de devolver error, devolvemos array vacío para que no se rompa la aplicación
      return NextResponse.json([]);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching matches:', error);
    // Devolver array vacío en caso de error para mantener la aplicación funcionando
    return NextResponse.json([]);
  }
}
