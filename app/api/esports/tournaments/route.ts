import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";
import { getGameApiName } from "../../../lib/gameConfig";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameParam = searchParams.get("game") || "dota2";
    
    // Mapear el juego al nombre correcto de la API usando la configuración centralizada
    const game = getGameApiName(gameParam);
    
    const res = await fetch(
      `https://api.pandascore.co/${game}/tournaments?per_page=50&token=${PANDA_SCORE_TOKEN}`,
      { 
        cache: "no-store", 
        dispatcher: getProxyAgent(),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EMob-Esports/1.0'
        }
      } as RequestInit & { dispatcher?: any }
    );
    
    if (!res.ok) {
      console.error(`API Error for game ${game}: ${res.status} ${res.statusText}`);
      return NextResponse.json([]);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json([]);
  }
}
