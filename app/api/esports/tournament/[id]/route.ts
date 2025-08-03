import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../lib/pandaScoreFetch";



export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await pandaScoreFetch(
    `https://api.pandascore.co/tournaments/${id}`,
    new URLSearchParams(),
    { cache: "no-store" }
  );
  if (!res.ok) {
    return new NextResponse("Failed to fetch tournament", { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
