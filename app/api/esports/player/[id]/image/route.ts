import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../../lib/pandaScoreFetch";
import { getProxyAgent } from "../../../../../lib/proxyAgent";
import { buildMonogramSvg } from "../../../../../lib/iconGenerator";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const nameParam = searchParams.get("name");
  const labelParam = searchParams.get("label");

  try {
    // Obtener datos del jugador desde PandaScore
    const baseUrl = `https://api.pandascore.co/players/${id}`;
    const searchParamsApi = new URLSearchParams();
    const playerRes = await pandaScoreFetch(baseUrl, searchParamsApi, { cache: "no-store" });

    if (!playerRes.ok) {
      const fallbackName = nameParam || "Player";
      const fallbackSvg = buildMonogramSvg({
        name: fallbackName,
        label: labelParam,
        size: 128,
        shape: "circle",
        maxLen: 4,
      });

      return new NextResponse(fallbackSvg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
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

    // Si no tiene imagen o falla, generar una imagen de fallback con un monograma
    const playerName = playerData.name || nameParam || "Player";
    const svg = buildMonogramSvg({
      name: playerName,
      label: labelParam,
      size: 128,
      shape: "circle",
      maxLen: 4,
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });

  } catch (error) {
    console.error("Error fetching player image:", error);

    const playerName = nameParam || "Player";
    const fallbackSvg = buildMonogramSvg({
      name: playerName,
      label: labelParam,
      size: 128,
      shape: "circle",
      maxLen: 4,
    });

    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
