import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../../lib/proxyAgent";

const PANDA_SCORE_TOKEN = "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(
    `https://api.pandascore.co/tournaments/${id}?token=${PANDA_SCORE_TOKEN}`,
    { cache: "no-store", dispatcher: getProxyAgent() } as RequestInit & {
      dispatcher?: any;
    }
  );
  if (!res.ok) {
    return new NextResponse("Failed to fetch tournament", { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
