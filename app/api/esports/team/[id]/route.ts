import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../lib/pandaScoreFetch";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baseUrl = `https://api.pandascore.co/teams/${id}`;
  const searchParamsApi = new URLSearchParams();
  
  const res = await pandaScoreFetch(baseUrl, searchParamsApi, { cache: "no-store" });
  if (!res.ok) {
    return new NextResponse("Failed to fetch team", { status: res.status });
  }
  const t = await res.json();
  const data = {
    id: t.id,
    name: t.name ?? "",
    acronym: t.acronym ?? null,
    image_url: t.image_url ?? null,
    location: t.location ?? null,
    players: (t.players ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      first_name: p.first_name,
      last_name: p.last_name,
      nationality: p.nationality,
      role: p.role,
      image_url: p.image_url,
    })),
  };
  return NextResponse.json(data);
}
