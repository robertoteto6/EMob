import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(
  request: Request,
  context: any
) {
  const { id } = context.params;
  const res = await fetch(
    `https://api.pandascore.co/matches/${id}?token=${PANDA_SCORE_TOKEN}`,
    { cache: "no-store", agent: getProxyAgent() }
  );
  if (!res.ok) {
    return new NextResponse("Failed to fetch match", { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
