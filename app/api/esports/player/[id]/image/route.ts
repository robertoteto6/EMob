import { NextResponse } from "next/server";
import { buildMonogramSvg } from "../../../../../lib/iconGenerator";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const nameParam = searchParams.get("name");
  const labelParam = searchParams.get("label");

  try {
    // Ya no usamos PandaScore para imágenes reales para cumplir con el requerimiento de "Todo generado por IA"
    // (o en este caso, fallback generado localmente, ya que la IA generó los datos en el endpoint principal)

    // Generar una imagen de fallback con un monograma
    const playerName = nameParam || `Player ${id}`;
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
    console.error("Error generating player image:", error);

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
        "Content-Type": "image/svg+xml", // Corregido el typo en el original si lo hubiera
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
