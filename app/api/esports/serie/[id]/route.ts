import { NextResponse } from "next/server";
import { pandaScoreFetch } from "../../../../lib/pandaScoreFetch";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const res = await pandaScoreFetch(
      `https://api.pandascore.co/series/${id}`,
      new URLSearchParams(),
      { cache: "no-store" },
      {
        ttl: 10 * 60 * 1000,
        priority: 'medium',
        tags: ['serie', id]
      }
    );
    
    if (!res.ok) {
      return new NextResponse("Failed to fetch serie", { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching serie:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
