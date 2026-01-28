import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../../lib/pandaScoreFetch";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const perPage = searchParams.get("per_page") || "50";
  
  try {
    const searchParamsApi = new URLSearchParams();
    searchParamsApi.set('per_page', perPage);
    
    const res = await pandaScoreFetch(
      `https://api.pandascore.co/leagues/${id}/series`,
      searchParamsApi,
      { cache: "no-store" },
      {
        ttl: 10 * 60 * 1000,
        priority: 'medium',
        tags: ['league-series', id]
      }
    );
    
    if (!res.ok) {
      return new NextResponse("Failed to fetch league series", { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching league series:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
