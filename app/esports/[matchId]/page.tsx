"use client";

import { useEffect, useState, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Countdown from "../../components/Countdown";
import Search from "../../components/Search";

// Icono de favorito (estrella) reutilizable con tooltip y animación
function Star({ filled, ...props }: { filled: boolean; [key: string]: any }) {
  return (
    <span title={filled ? "Quitar de favoritos" : "Añadir a favoritos"}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={filled ? "#FFD700" : "none"}
        stroke="#FFD700"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ cursor: "pointer", transition: "transform 0.2s", transform: filled ? "scale(1.2)" : "scale(1)" }}
        {...props}
      >
        <polygon points="12,2 15.11,8.83 22.22,9.27 17,14.02 18.54,21.02 12,17.27 5.46,21.02 7,14.02 1.78,9.27 8.89,8.83" />
      </svg>
    </span>
  );
}

// Componente para mostrar banderas de idioma
function LangFlag({ code }: { code: string }) {
  const src = code === "es-ES"
    ? "/file.svg"
    : code === "en-US"
    ? "/globe.svg"
    : "/globe.svg";
  const alt = code === "es-ES" ? "Español" : code === "en-US" ? "English" : code;
  return <img src={src} alt={alt} title={alt} className="inline w-5 h-5 mr-1 align-middle" />;
}

// Componente para mostrar el embed de stream/VOD
function StreamEmbed({ twitch, vodUrl }: { twitch: StreamInfo; vodUrl: string | null }) {
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
  // Miniatura del stream si es Twitch
  let thumbnail = null;
  if (twitch.raw_url.includes("twitch.tv")) {
    const channel = twitch.raw_url.split("twitch.tv/")[1]?.split("/")[0];
    if (channel) {
      thumbnail = (
        <img
          src={`https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-640x360.jpg`}
          alt={`Miniatura de ${channel}`}
          className="rounded-lg border border-[#222] mb-2 w-full max-w-lg mx-auto"
          style={{ objectFit: "cover" }}
        />
      );
    }
  }
  return (
    <div className="w-full h-0 pb-[56.25%] relative rounded-xl overflow-hidden border border-[#222] shadow-lg">
      {thumbnail && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          {thumbnail}
        </div>
      )}
      <iframe
        src={embedUrl}
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full rounded-xl"
        title="Stream del partido"
        aria-label="Stream del partido"
      />
    </div>
  );
}

// Componente para mostrar la lista de streams
function StreamList({ streams }: { streams: StreamInfo[] }) {
  return (
    <ul className="space-y-1 text-sm mt-2">
      {streams.map((s, idx) => (
        <li key={idx} className="flex items-center gap-2">
          <LangFlag code={s.language} />
          <a
            href={s.raw_url}
            target="_blank"
            rel="noopener"
            className="text-[var(--accent,#00FF80)] hover:underline font-semibold"
            title={`Ver stream en ${s.language.toUpperCase()}`}
          >
            {s.language.toUpperCase()} Stream
          </a>
        </li>
      ))}
    </ul>
  );
}

// Componente para copiar resultado
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      onClick={handleCopy}
      aria-label={label}
      className="ml-2 px-2 py-1 rounded bg-[#222] text-green-400 hover:bg-green-700 transition-colors text-xs font-semibold relative"
      title={label}
    >
      {copied ? "Copiado!" : "Copiar resultado"}
    </button>
  );
}

// Componente para mostrar loading spinner
function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-[var(--accent,#00FF80)] border-t-transparent"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Cargando"
    />
  );
}

// Componente para mostrar el estado del partido
function MatchStatus({ match }: { match: MatchDetail }) {
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
      return <span className="px-2 py-1 rounded bg-green-700 text-xs text-white animate-pulse font-semibold" title={`Juego ${running.position} en directo`}>En directo - Juego {running.position} ({minutes}m)</span>;
    }
    minutes = Math.floor((Date.now() - match.start_time * 1000) / 60000);
    return <span className="px-2 py-1 rounded bg-green-700 text-xs text-white animate-pulse font-semibold" title="Partido en directo">En directo ({minutes}m)</span>;
  }
  return match.radiant_win === null
    ? <span className="px-2 py-1 rounded bg-gray-700 text-xs text-white font-semibold" title="Por jugar">Por jugar</span>
    : <span className={`px-2 py-1 rounded text-xs text-white font-semibold ${match.radiant_win ? 'bg-green-800' : 'bg-green-900'}`} title={`Ganó ${match.radiant_win ? match.radiant : match.dire}`}>Ganó {match.radiant_win ? match.radiant : match.dire}</span>;
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

// Idiomas soportados
const LANGS = [
  { code: "es-ES", label: "Español" },
  { code: "en-US", label: "English" },
];

export default function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [vodUrl, setVodUrl] = useState<string | null>(null);
  const [findingVod, setFindingVod] = useState<boolean>(false);
  const [searchedVod, setSearchedVod] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [lang, setLang] = useState<string>(LANGS[0].code);
  // El tema se gestiona globalmente, no local aquí
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMatch(matchId);
      setMatch(data);
      setLoading(false);
    }
    load();
  }, [matchId]);

  // Guardar idioma y tema en localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("match_lang");
    if (savedLang && LANGS.some(l => l.code === savedLang)) setLang(savedLang);
  }, []);

  // Favoritos en localStorage
  useEffect(() => {
    if (!match) return;
    const favs = JSON.parse(localStorage.getItem("favorites_matches") || "[]");
    setIsFavorite(favs.includes(match.id));
  }, [match]);

  function toggleFavorite() {
    if (!match) return;
    const favs = JSON.parse(localStorage.getItem("favorites_matches") || "[]");
    let newFavs;
    if (favs.includes(match.id)) {
      newFavs = favs.filter((id: number) => id !== match.id);
    } else {
      newFavs = [...favs, match.id];
    }
    localStorage.setItem("favorites_matches", JSON.stringify(newFavs));
    setIsFavorite(newFavs.includes(match.id));
  }

  function handleLangChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLang = e.target.value;
    setLang(newLang);
    localStorage.setItem("match_lang", newLang);
    // Aquí deberías llamar a la función global de cambio de idioma si usas i18n
    // Por ejemplo: i18n.changeLanguage(newLang)
    // Si usas context, puedes disparar el cambio aquí
  }

  // El tema se gestiona globalmente

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: match?.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      window.alert("Enlace copiado");
    }
  }

  // Compartir en Twitter y WhatsApp
  function handleShareSocial(network: "twitter" | "whatsapp") {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(match?.name ?? "Partido");
    if (network === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    } else if (network === "whatsapp") {
      window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
    }
  }

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
      } catch (err) {
        console.error("Error buscando VOD:", err);
      } finally {
        setFindingVod(false);
      }
    }
    searchVod();
  }, [match, vodUrl, findingVod, searchedVod]);

  // Skeleton loader
  if (loading) {
    return (
      <main className="p-4 sm:p-8 font-sans min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-3xl animate-pulse">
          <div className="h-8 bg-[#222] rounded w-2/3 mb-4" />
          <div className="h-6 bg-[#222] rounded w-1/2 mb-2" />
          <div className="h-4 bg-[#222] rounded w-1/3 mb-6" />
          <div className="h-32 bg-[#181c24] rounded-xl mb-6" />
          <div className="h-6 bg-[#222] rounded w-1/2 mb-2" />
          <div className="h-6 bg-[#222] rounded w-1/2 mb-2" />
        </div>
      </main>
    );
  }
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

  // Helper para logo de equipo con fallback
  function TeamLogo({ id, name }: { id: number | null; name: string }) {
    const [error, setError] = useState(false);
    if (!id || error) {
      return (
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs text-gray-300" title={name}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="1.5"><circle cx="10" cy="10" r="8" /><text x="10" y="14" textAnchor="middle" fontSize="10" fill="#888">?</text></svg>
        </div>
      );
    }
    return (
      <Image
        src={`/api/esports/team/${id}/logo`}
        alt={`Logo de ${name}`}
        width={32}
        height={32}
        className="rounded-full border border-[#333] bg-white"
        title={name}
        onError={() => setError(true)}
        unoptimized
      />
    );
  }

  // MVP y jugadores destacados (mock)
  const mvp = match ? (match.radiant_score > match.dire_score ? match.radiant : match.dire) : "";
  const destacados = match ? [match.radiant, match.dire] : [];

  // Animación de transición para el contenedor principal
  const transitionClass = "transition-all duration-500 ease-in-out hover:scale-[1.01] hover:shadow-2xl";

  return (
    <main className={`p-4 sm:p-8 font-sans min-h-screen flex flex-col items-center`} role="main">
      <div className={`w-full max-w-3xl`}>
        <div className="flex items-center justify-between mb-4">
          <Link href="/esports" className="text-[var(--accent,#00FF80)] hover:underline text-sm font-semibold flex items-center gap-1" aria-label="Volver a la lista de partidos">
            <span className="text-lg">←</span> Volver
          </Link>
          <div className="flex gap-2 items-center">
            <Search />
            <button onClick={handleShare} aria-label="Compartir partido" className="ml-2 px-2 py-1 rounded bg-[#222] text-green-400 hover:bg-green-700 transition-colors text-xs font-semibold" title="Compartir por enlace">Compartir</button>
            <button onClick={() => handleShareSocial("twitter")} aria-label="Compartir en Twitter" className="ml-2 px-2 py-1 rounded bg-[#222] text-blue-400 hover:bg-blue-700 transition-colors text-xs font-semibold" title="Compartir en Twitter">Twitter</button>
            <button onClick={() => handleShareSocial("whatsapp")} aria-label="Compartir en WhatsApp" className="ml-2 px-2 py-1 rounded bg-[#222] text-green-500 hover:bg-green-700 transition-colors text-xs font-semibold" title="Compartir en WhatsApp">WhatsApp</button>
            <select value={lang} onChange={handleLangChange} aria-label="Seleccionar idioma" className="ml-2 px-2 py-1 rounded bg-[#222] text-green-400 text-xs font-semibold flex items-center">
              {LANGS.map(l => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <span className="ml-1"> <LangFlag code={lang} /> </span>
          </div>
        </div>
        <div className={`rounded-xl shadow-lg bg-[#181c24] border border-[#222] p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-6 relative ${transitionClass}`}> 
          <div className="absolute top-4 right-4 z-10">
            <button aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"} onClick={toggleFavorite} className="focus:outline-none" title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}>
              <Star filled={isFavorite} />
            </button>
          </div>
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
              {new Date(match.start_time * 1000).toLocaleString(lang)}
            </div>
            {match.start_time > Date.now() / 1000 && (
              <Countdown targetTime={match.start_time} />
            )}
            <div className="mt-2 flex gap-4 items-center">
              <span className="text-xs font-semibold text-green-400">MVP: <span className="text-[var(--accent,#00FF80)]">{mvp}</span></span>
              <span className="text-xs font-semibold text-green-400">Destacados: {destacados.join(", ")}</span>
              <CopyButton text={`${match.radiant} ${match.radiant_score} - ${match.dire_score} ${match.dire}`} label="Copiar resultado" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 min-w-[120px]">
            <div className="flex items-center gap-2 text-lg font-bold text-[var(--accent,#00FF80)]">
              <Link href={`/esports/team/${match.radiant_id}`} aria-label={`Ver equipo ${match.radiant}`} className="hover:scale-105 transition-transform">
                <TeamLogo id={match.radiant_id} name={match.radiant} />
              </Link>
              <span className="text-white font-semibold text-base">{match.radiant}</span>
              <span className="bg-[#23272f] rounded-lg px-3 py-1 text-2xl shadow border border-[#333]">{match.radiant_score}</span>
              <span className="text-green-900 font-bold text-xl">vs</span>
              <span className="bg-[#23272f] rounded-lg px-3 py-1 text-2xl shadow border border-[#333]">{match.dire_score}</span>
              <span className="text-white font-semibold text-base">{match.dire}</span>
              <Link href={`/esports/team/${match.dire_id}`} aria-label={`Ver equipo ${match.dire}`} className="hover:scale-105 transition-transform">
                <TeamLogo id={match.dire_id} name={match.dire} />
              </Link>
            </div>
            <div className="mt-2 text-center">
              <MatchStatus match={match} />
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
              return <StreamEmbed twitch={twitch} vodUrl={vodUrl} />;
            })()}
            {findingVod && (
              <div className="flex items-center gap-2 text-green-400 mt-2">
                <Spinner size={18} />
                <span>Buscando grabación...</span>
              </div>
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
                  title="Ver VOD completo"
                >
                  Ver VOD
                </a>
              </p>
            )}
            <StreamList streams={match.streams} />
          </section>
        )}
      </div>
    </main>
  );
}
