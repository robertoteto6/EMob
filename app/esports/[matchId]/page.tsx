"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Countdown from "../../components/Countdown";
import Search from "../../components/Search";

// Icono de favorito (estrella) reutilizable
function Star({ filled, ...props }: { filled: boolean; [key: string]: any }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill={filled ? "#FFD700" : "none"}
      stroke="#FFD700"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="10,2 12.59,7.36 18.51,7.63 13.97,11.61 15.45,17.37 10,14.13 4.55,17.37 6.03,11.61 1.49,7.63 7.41,7.36" />
    </svg>
  );
}

interface GameInfo {
  id: number;
  position: number;
  status: string;
  begin_at: string | null;
  end_at: string | null;
  winner_id: number | null;
}

interface StreamInfo {
  embed_url: string;
  raw_url: string;
  language: string;
}

interface MatchDetail {
  id: number;
  name: string;
  radiant: string;
  dire: string;
  radiant_id: number | null;
  dire_id: number | null;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  end_time: number | null;
  league: string;
  serie: string;
  tournament: string;
  match_type: string;
  number_of_games: number;
  radiant_win: boolean | null;
  games: GameInfo[];
  streams: StreamInfo[];
}


async function fetchMatch(id: string): Promise<MatchDetail | null> {
  const res = await fetch(`/api/esports/match/${id}`, { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to fetch match", await res.text());
    return null;
  }
  const m = await res.json();
  const team1 = m.opponents?.[0]?.opponent;
  const team2 = m.opponents?.[1]?.opponent;
  return {
    id: m.id,
    name: m.name ?? `${team1?.name ?? "TBD"} vs ${team2?.name ?? "TBD"}`,
    radiant: team1?.name ?? "TBD",
    dire: team2?.name ?? "TBD",
    radiant_id: team1?.id ?? null,
    dire_id: team2?.id ?? null,
    radiant_score: m.results?.[0]?.score ?? 0,
    dire_score: m.results?.[1]?.score ?? 0,
    start_time: new Date(m.begin_at ?? m.scheduled_at).getTime() / 1000,
    end_time: m.end_at ? new Date(m.end_at).getTime() / 1000 : null,
    league: m.league?.name ?? "",
    serie: m.serie?.full_name ?? "",
    tournament: m.tournament?.name ?? "",
    match_type: m.match_type ?? "",
    number_of_games: m.number_of_games ?? m.games?.length ?? 0,
    radiant_win:
      m.winner?.id !== undefined && team1?.id !== undefined
        ? m.winner.id === team1.id
        : null,
    games: (m.games ?? []).map((g: any) => ({
      id: g.id,
      position: g.position,
      status: g.status,
      begin_at: g.begin_at,
      end_at: g.end_at,
      winner_id: g.winner?.id ?? null,
    })),
    streams: (m.streams_list ?? []).map((s: any) => ({
      embed_url: s.embed_url,
      raw_url: s.raw_url,
      language: s.language,
    })),
  } as MatchDetail;
}

export default function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [vodUrl, setVodUrl] = useState<string | null>(null);
  const [findingVod, setFindingVod] = useState<boolean>(false);
  const [searchedVod, setSearchedVod] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const data = await fetchMatch(matchId);
      setMatch(data);
    }
    load();
  }, [matchId]);

  useEffect(() => {
    if (!match) return;
    const now = Date.now() / 1000;
    const ended = match.end_time !== null && now > match.end_time;
    if (!ended || vodUrl || findingVod || searchedVod) return;
    const twitch =
      match.streams.find(
        (s) => s.embed_url.includes("twitch") || s.raw_url.includes("twitch")
      ) || match.streams[0];
    if (!twitch) return;
    let channel = "";
    try {
      const u = new URL(twitch.raw_url || twitch.embed_url);
      channel = u.pathname.replace(/^\//, "").split("/")[0];
    } catch {
      return;
    }
    async function searchVod() {
      setFindingVod(true);
      setSearchedVod(true);
      try {
        const res = await fetch("/api/esports/vod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchName: match!.name,
            channel,
            startTime: match!.start_time,
          }),
        });
        const data = await res.json();
        if (data.url) setVodUrl(data.url);
      } catch {
        /* ignore */
      } finally {
        setFindingVod(false);
      }
    }
    searchVod();
  }, [match, vodUrl, findingVod, searchedVod]);

  if (!match) {
    return (
      <main className="p-4 sm:p-8 font-sans min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 animate-spin rounded-full border-4 border-[var(--accent,#00FF80)] border-t-transparent" />
          <p className="text-lg text-green-400 font-semibold">Cargando partido...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 font-sans min-h-screen bg-black text-white flex flex-col items-center" style={{ background: '#000' }}>
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link href="/esports" className="text-[var(--accent,#00FF80)] hover:underline text-sm font-semibold flex items-center gap-1">
            <span className="text-lg">←</span> Volver
          </Link>
          <Search />
        </div>
        <div className="rounded-xl shadow-lg bg-[#181c24] border border-[#222] p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-6 relative">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--accent,#00FF80)] mb-1 flex items-center gap-2">
              {match.name}
            </h1>
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <span className="text-green-400 font-semibold text-base">{match.league}</span>
              <span className="text-xs text-green-800 bg-green-900 rounded px-2 py-0.5">{match.serie}</span>
              <span className="text-xs text-green-800 bg-green-900 rounded px-2 py-0.5">{match.tournament}</span>
            </div>
            <div className="text-sm text-green-400 mb-2">
              {new Date(match.start_time * 1000).toLocaleString("es-ES")}
            </div>
            {match.start_time > Date.now() / 1000 && (
              <Countdown targetTime={match.start_time} />
            )}
          </div>
          <div className="flex flex-col items-center gap-2 min-w-[120px]">
            <div className="flex items-center gap-2 text-lg font-bold text-[var(--accent,#00FF80)]">
              <span className="text-white font-semibold text-base">{match.radiant}</span>
              <span className="bg-[#23272f] rounded-lg px-3 py-1 text-2xl shadow border border-[#333]">{match.radiant_score}</span>
              <span className="text-green-900 font-bold text-xl">vs</span>
              <span className="bg-[#23272f] rounded-lg px-3 py-1 text-2xl shadow border border-[#333]">{match.dire_score}</span>
              <span className="text-white font-semibold text-base">{match.dire}</span>
            </div>
            <div className="mt-2 text-center">
              {(() => {
                const now = Date.now() / 1000;
                const started = match.start_time <= now;
                const live = started && match.radiant_win === null;
                if (live) {
                  const running = match.games.find((g) => g.status === "running");
                  let minutes = 0;
                  if (running) {
                    const begin = running.begin_at
                      ? new Date(running.begin_at).getTime()
                      : match.start_time * 1000;
                    minutes = Math.floor((Date.now() - begin) / 60000);
                    return <span className="px-2 py-1 rounded bg-green-700 text-xs text-white animate-pulse font-semibold">En directo - Juego {running.position} ({minutes}m)</span>;
                  }
                  minutes = Math.floor((Date.now() - match.start_time * 1000) / 60000);
                  return <span className="px-2 py-1 rounded bg-green-700 text-xs text-white animate-pulse font-semibold">En directo ({minutes}m)</span>;
                }
                return match.radiant_win === null
                  ? <span className="px-2 py-1 rounded bg-gray-700 text-xs text-white font-semibold">Por jugar</span>
                  : <span className={`px-2 py-1 rounded text-xs text-white font-semibold ${match.radiant_win ? 'bg-green-800' : 'bg-green-900'}`}>Ganó {match.radiant_win ? match.radiant : match.dire}</span>;
              })()}
            </div>
          </div>
        </div>
        <section className="mb-6">
          <h2 className="text-lg font-bold text-green-400 mb-2">Detalles</h2>
          <ul className="text-sm text-green-200 space-y-1">
            <li><b>Serie:</b> {match.serie}</li>
            <li><b>Torneo:</b> {match.tournament}</li>
            <li><b>Tipo de partida:</b> {match.match_type === "best_of" ? `BO${match.number_of_games}` : ` ${match.match_type}`}</li>
            {match.end_time && (
              <li><b>Finalizado:</b> {new Date(match.end_time * 1000).toLocaleString("es-ES")}</li>
            )}
          </ul>
        </section>
        {match.games.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-green-400 mb-2">Mapa a mapa</h2>
            <ul className="space-y-1 text-sm">
              {match.games.map((g) => (
                <li key={g.id} className="flex justify-between border-b border-[#222] py-1">
                  <span className="text-green-200">
                    Juego {g.position}: {g.begin_at ? new Date(g.begin_at).toLocaleString("es-ES") : ""}
                  </span>
                  <span className="font-semibold">
                    {g.status === "finished" && g.winner_id
                      ? g.winner_id === match.radiant_id
                        ? <span className="text-[var(--accent,#00FF80)]">{match.radiant}</span>
                        : <span className="text-green-400">{match.dire}</span>
                      : <span className="text-gray-400">{g.status}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {match.streams.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold text-green-400 mb-2">
              {(() => {
                const now = Date.now() / 1000;
                const ended = match.end_time !== null && now > match.end_time;
                const started = match.start_time <= now;
                return started && !ended
                  ? "Stream en directo"
                  : ended
                  ? "Ver en diferido"
                  : "Dónde ver";
              })()}
            </h2>
            {(() => {
              const now = Date.now() / 1000;
              const ended = match.end_time !== null && now > match.end_time;
              const started = match.start_time <= now;
              const showEmbed = started || ended;
              if (!showEmbed) return null;
              const twitch =
                match.streams.find(
                  (s) =>
                    s.embed_url.includes("twitch") || s.raw_url.includes("twitch")
                ) || match.streams[0];
              if (!twitch) return null;
              const embedUrl = (() => {
                if (vodUrl) {
                  const m = vodUrl.match(/videos\/(\d+)/);
                  if (m) {
                    const url = new URL("https://player.twitch.tv/");
                    url.searchParams.set("video", m[1]);
                    if (typeof window !== "undefined") {
                      if (!url.searchParams.get("parent")) {
                        url.searchParams.set("parent", window.location.hostname);
                      }
                    }
                    return url.toString();
                  }
                  return vodUrl;
                }
                try {
                  const url = new URL(twitch.embed_url);
                  if (typeof window !== "undefined") {
                    if (!url.searchParams.get("parent")) {
                      url.searchParams.set("parent", window.location.hostname);
                    }
                    return url.toString();
                  }
                } catch {
                  /* ignore */
                }
                return twitch.embed_url;
              })();
              return (
                <div className="w-full h-0 pb-[56.25%] relative rounded-xl overflow-hidden border border-[#222] shadow-lg">
                  <iframe
                    src={embedUrl}
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-xl"
                  />
                </div>
              );
            })()}
            {findingVod && (
              <p className="text-sm text-green-400 mt-2">Buscando grabación...</p>
            )}
            {searchedVod && !vodUrl && !findingVod && (
              <p className="text-sm text-red-400 mt-2">No se encontró grabación</p>
            )}
            {vodUrl && (
              <p className="text-sm mt-2">
                <a
                  href={vodUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--accent,#00FF80)] hover:underline font-semibold"
                >
                  Ver VOD
                </a>
              </p>
            )}
            <ul className="space-y-1 text-sm mt-2">
              {match.streams.map((s, idx) => (
                <li key={idx}>
                  <a
                    href={s.raw_url}
                    target="_blank"
                    rel="noopener"
                    className="text-[var(--accent,#00FF80)] hover:underline font-semibold"
                  >
                    {s.language.toUpperCase()} Stream
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
