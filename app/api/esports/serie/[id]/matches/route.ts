import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../../lib/pandaScoreFetch";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const perPage = searchParams.get("per_page") || "50";
  const status = searchParams.get("status");
  
  try {
    const searchParamsApi = new URLSearchParams();
    searchParamsApi.set('per_page', perPage);
    
    if (status) {
      searchParamsApi.set('filter[status]', status);
    }
    
    const res = await pandaScoreFetch(
      `https://api.pandascore.co/series/${id}/matches`,
      searchParamsApi,
      { cache: "no-store" },
      {
        ttl: 5 * 60 * 1000,
        priority: 'high',
        tags: ['serie-matches', id]
      }
    );
    
    if (!res.ok) {
      return new NextResponse("Failed to fetch serie matches", { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching serie matches:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
