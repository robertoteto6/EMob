import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    // Obtener datos del jugador desde PandaScore
    const playerUrl = `https://api.pandascore.co/players/${id}?token=${PANDA_SCORE_TOKEN}`;
    const playerRes = await fetch(playerUrl, { 
      cache: "no-store", 
      dispatcher: getProxyAgent() 
    } as RequestInit & { dispatcher?: any });
    
    if (!playerRes.ok) {
      return new NextResponse("Player not found", { status: 404 });
    }
    
    const playerData = await playerRes.json();
    
    // Si el jugador tiene imagen, redirigir a ella
    if (playerData.image_url) {
      const imageRes = await fetch(playerData.image_url, {
        dispatcher: getProxyAgent()
      } as RequestInit & { dispatcher?: any });
      
      if (imageRes.ok) {
        const imageData = await imageRes.arrayBuffer();
        return new NextResponse(imageData, {
          headers: {
            "Content-Type": imageRes.headers.get("content-type") || "image/jpeg",
            "Cache-Control": "public, max-age=86400", // Cache por 24 horas
          },
        });
      }
    }
    
    // Si no tiene imagen o falla, generar una imagen de fallback con las iniciales
    const playerName = playerData.name || "Player";
    const initials = playerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    
    // SVG simple con las iniciales del jugador
    const svg = `
      <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00FF80;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0080FF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" fill="url(#grad1)" rx="64"/>
        <text x="64" y="74" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              text-anchor="middle" fill="white">${initials}</text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
    
  } catch (error) {
    console.error("Error fetching player image:", error);
    
    // Imagen de fallback en caso de error
    const fallbackSvg = `
      <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
        <rect width="128" height="128" fill="#374151" rx="64"/>
        <circle cx="64" cy="48" r="20" fill="#9CA3AF"/>
        <path d="M64 76c-20 0-36 16-36 36v16h72v-16c0-20-16-36-36-36z" fill="#9CA3AF"/>
      </svg>
    `;
    
    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
