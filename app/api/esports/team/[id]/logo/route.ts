import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../../lib/pandaScoreFetch";
import { getProxyAgent } from "../../../../../lib/proxyAgent";
import { buildMonogramSvg } from "../../../../../lib/iconGenerator";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const nameParam = searchParams.get("name");
  const acronymParam = searchParams.get("acronym");

  try {
    const baseUrl = `https://api.pandascore.co/teams/${id}`;
    const teamRes = await pandaScoreFetch(baseUrl, new URLSearchParams(), { cache: "no-store" });

    if (teamRes.ok) {
      const teamData = await teamRes.json();

      if (teamData.image_url) {
        const imageRes = await fetch(teamData.image_url, {
          dispatcher: getProxyAgent(),
        } as RequestInit & { dispatcher?: any });

        if (imageRes.ok) {
          const imageData = await imageRes.arrayBuffer();
          return new NextResponse(imageData, {
            headers: {
              "Content-Type": imageRes.headers.get("content-type") || "image/png",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }

      const teamName = teamData.name || nameParam || "Team";
      const svg = buildMonogramSvg({
        name: teamName,
        label: acronymParam || teamData.acronym,
        size: 128,
        shape: "rounded",
        maxLen: 4,
      });

      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const fallbackName = nameParam || "Team";
    const fallbackSvg = buildMonogramSvg({
      name: fallbackName,
      label: acronymParam,
      size: 128,
      shape: "rounded",
      maxLen: 4,
    });

    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error fetching team logo:", error);
    const fallbackName = nameParam || "Team";
    const fallbackSvg = buildMonogramSvg({
      name: fallbackName,
      label: acronymParam,
      size: 128,
      shape: "rounded",
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
