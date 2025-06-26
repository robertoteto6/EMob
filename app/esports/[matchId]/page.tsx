"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Countdown from "../../components/Countdown";
import Search from "../../components/Search";

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
      <main className="p-4 sm:p-8 font-sans">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 font-sans space-y-4">
      <Link href="/esports" className="text-[var(--accent)] hover:underline">
        ← Volver
      </Link>
      <Search />
      <h1 className="text-2xl font-bold">{match.name}</h1>
      <p className="text-sm text-gray-500">{match.league}</p>
      <p className="text-sm text-gray-400">
        {new Date(match.start_time * 1000).toLocaleString("es-ES")}
      </p>
      {match.start_time > Date.now() / 1000 && (
        <Countdown targetTime={match.start_time} />
      )}
      <div className="card p-4 space-y-2">
        <div className="flex justify-between">
          <span>{match.radiant}</span>
          <span className="font-semibold">{match.radiant_score}</span>
        </div>
        <div className="flex justify-between">
          <span>{match.dire}</span>
          <span className="font-semibold">{match.dire_score}</span>
        </div>
        <p className="text-center font-semibold mt-2">
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
                return `Partido en directo - Juego ${running.position} (${minutes}m)`;
              }
              minutes = Math.floor((Date.now() - match.start_time * 1000) / 60000);
              return `Partido en directo (${minutes}m)`;
            }
            return match.radiant_win === null
              ? "Partido aún no jugado"
              : `Ganó ${match.radiant_win ? match.radiant : match.dire}`;
          })()}
        </p>
      </div>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold mt-4">Detalles</h2>
        <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
          <li>Serie: {match.serie}</li>
          <li>Torneo: {match.tournament}</li>
          <li>
            Tipo de partida:
            {match.match_type === "best_of"
              ? `BO${match.number_of_games}`
              : ` ${match.match_type}`}
          </li>
          {match.end_time && (
            <li>
              Finalizado: {new Date(match.end_time * 1000).toLocaleString("es-ES")}
            </li>
          )}
        </ul>
      </section>
      {match.games.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold mt-4">Mapa a mapa</h2>
          <ul className="space-y-1 text-sm">
            {match.games.map((g) => (
              <li key={g.id} className="flex justify-between border-b border-gray-700 py-1">
                <span>
                  Juego {g.position}: {g.begin_at ? new Date(g.begin_at).toLocaleString("es-ES") : ""}
                </span>
                <span>
                  {g.status === "finished" && g.winner_id
                    ? g.winner_id === match.radiant_id
                      ? match.radiant
                      : match.dire
                    : g.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {match.streams.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold mt-4">
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
              <div className="w-full h-0 pb-[56.25%] relative">
                <iframe
                  src={embedUrl}
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            );
          })()}
          {findingVod && (
            <p className="text-sm text-gray-400">Buscando grabación...</p>
          )}
          {searchedVod && !vodUrl && !findingVod && (
            <p className="text-sm text-gray-400">No se encontró grabación</p>
          )}
          {vodUrl && (
            <p className="text-sm">
              <a
                href={vodUrl}
                target="_blank"
                rel="noopener"
                className="text-[var(--accent)] hover:underline"
              >
                Ver VOD
              </a>
            </p>
          )}
          <ul className="space-y-1 text-sm">
            {match.streams.map((s, idx) => (
              <li key={idx}>
                <a
                  href={s.raw_url}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--accent)] hover:underline"
                >
                  {s.language.toUpperCase()} Stream
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
