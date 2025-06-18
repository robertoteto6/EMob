import { NextResponse } from "next/server";
import { getProxyAgent } from "../../../lib/proxyAgent";

const GEMINI_API_KEY = "AIzaSyDegDWFj78Gl2zrk1CiKO_dJtRNbB2sdGs";

const GEMINI_MODEL = "models/gemini-2.5-flash";

export async function POST(req: Request) {
  const { matchName, channel, startTime } = await req.json();
  if (!matchName || !channel) {
    return new NextResponse("Missing matchName or channel", { status: 400 });
  }

  const date = new Date(startTime * 1000).toLocaleDateString("en-US");
  const prompt = `Find the highlights video link on Youtube for the esports match "${matchName}" from channel R6 Video Replays: : Unofficial Highlights Library that took place around ${date}. Respond with only the direct URL if available, otherwise say "Not found".`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      dispatcher: getProxyAgent(),
    } as RequestInit & { dispatcher?: any }
  );

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text || "Failed", { status: res.status });
  }

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const match = text.match(/https?:\/\/\S+/);
  const url = match ? match[0] : null;

  return NextResponse.json({ url, raw: text });
}
