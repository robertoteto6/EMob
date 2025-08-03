import { NextResponse } from "next/server";
import { getProxyAgent } from "../../lib/proxyAgent";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "models/gemini-2.5-flash";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      dispatcher: getProxyAgent(),
    } as RequestInit & { dispatcher?: any }
  );

  if (!GEMINI_API_KEY) {
    return new NextResponse("GEMINI_API_KEY not configured", { status: 500 });
  }

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text || "Failed", { status: res.status });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return NextResponse.json({ text });
}
