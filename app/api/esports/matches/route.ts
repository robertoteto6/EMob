import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "dota2";
  const res = await fetch(
    `https://api.pandascore.co/${game}/matches?per_page=50&token=${PANDA_SCORE_TOKEN}`,
    // Use a proxy when running in environments that require it.
    { cache: "no-store", dispatcher: getProxyAgent() } as RequestInit & {
      dispatcher?: any;
    }
  );
  if (!res.ok) {
    return new NextResponse("Failed to fetch matches", { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
