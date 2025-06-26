import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = `https://api.pandascore.co/players/${id}?token=${PANDA_SCORE_TOKEN}`;
  const res = await fetch(url, { cache: "no-store", dispatcher: getProxyAgent() } as RequestInit & { dispatcher?: any });
  if (!res.ok) {
    return new NextResponse("Failed to fetch player", { status: res.status });
  }
  const p = await res.json();
  const data = {
    id: p.id,
    name: p.name ?? "",
    first_name: p.first_name ?? null,
    last_name: p.last_name ?? null,
    nationality: p.nationality ?? null,
    role: p.role ?? null,
    image_url: p.image_url ?? null,
    current_team: p.current_team?.name ?? null,
  };
  return NextResponse.json(data);
}
