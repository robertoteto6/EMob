import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../lib/pandaScoreFetch";

type PandaScorePlayer = {
  id: number;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nationality?: string | null;
  role?: string | null;
  image_url?: string | null;
};

type PandaScoreTeam = {
  id: number;
  name?: string | null;
  acronym?: string | null;
  image_url?: string | null;
  location?: string | null;
  players?: PandaScorePlayer[] | null;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = id?.trim();
  if (!teamId) {
    return NextResponse.json({ error: "Missing team id" }, { status: 400 });
  }

  const baseUrl = `https://api.pandascore.co/teams/${encodeURIComponent(teamId)}`;
  const searchParamsApi = new URLSearchParams();

  try {
    const res = await pandaScoreFetch(baseUrl, searchParamsApi, { cache: "no-store" });
    if (!res.ok) {
      return new NextResponse("Failed to fetch team", { status: res.status });
    }
    const t = (await res.json()) as PandaScoreTeam;
    const players = Array.isArray(t.players) ? t.players : [];
    const data = {
      id: t.id,
      name: t.name ?? "",
      acronym: t.acronym ?? null,
      image_url: t.image_url ?? null,
      location: t.location ?? null,
      players: players.map((p) => ({
        id: p.id,
        name: p.name ?? "",
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        nationality: p.nationality ?? null,
        role: p.role ?? null,
        image_url: p.image_url ?? null,
      })),
    };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 503 });
  }
}
