import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const q = searchParams.get("q") || "";
  const url = new URL(`https://api.pandascore.co/${game}/teams`);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("token", PANDA_SCORE_TOKEN);
  if (q) {
    url.searchParams.set("search[name]", q);
  }
  const res = await fetch(url.toString(), {
    cache: "no-store",
    dispatcher: getProxyAgent(),
  } as RequestInit & { dispatcher?: any });
  if (!res.ok) {
    return new NextResponse("Failed to fetch teams", { status: res.status });
  }
  const data = await res.json();
  const list = (data as any[]).map((t) => ({
    id: t.id,
    name: t.name,
    image_url: t.image_url ?? null,
  }));
  return NextResponse.json(list);
}
