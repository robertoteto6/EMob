interface Match {
  id: number;
  radiant: string;
  dire: string;
  radiant_score: number;
  dire_score: number;
  start_time: number;
  league: string;
  radiant_win: boolean;
}

export const dynamic = "force-dynamic";

const PANDA_SCORE_TOKEN =
  "_PSqzloyu4BibH0XiUvNHvm9AjjnwqcrIMfwEJou6Y0i4NAXENo";

async function getMatches(): Promise<Match[]> {
  const res = await fetch(
    `https://api.pandascore.co/dota2/matches?per_page=10&token=${PANDA_SCORE_TOKEN}`
  );
  if (!res.ok) {
    console.error("Failed to fetch matches", await res.text());
    return [];
  }
  const data = await res.json();
  return data.map((m: any) => {
    const team1 = m.opponents?.[0]?.opponent;
    const team2 = m.opponents?.[1]?.opponent;
    return {
      id: m.id,
      radiant: team1?.name ?? "TBD",
      dire: team2?.name ?? "TBD",
      radiant_score: m.results?.[0]?.score ?? 0,
      dire_score: m.results?.[1]?.score ?? 0,
      start_time: new Date(m.begin_at ?? m.scheduled_at).getTime() / 1000,
      league: m.league?.name ?? "",
      radiant_win:
        m.winner?.id !== undefined && team1?.id !== undefined
          ? m.winner.id === team1.id
          : false,
    } as Match;
  });
}

export default async function EsportsPage() {
  const matches = await getMatches();

  return (
    <main className="p-4 sm:p-8 font-sans">
      <h1 className="text-2xl font-bold text-[var(--accent)] mb-4">
        Partidos profesionales Dota 2
      </h1>
      <ul className="space-y-4">
        {matches.map((match) => (
          <li
            key={match.id}
            className="card p-4 flex flex-col sm:flex-row sm:items-center gap-2"
          >
            <div className="flex-1">
              <p className="font-semibold">
                {match.radiant} vs {match.dire}
              </p>
              <p className="text-sm text-gray-400">
                {new Date(match.start_time * 1000).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{match.league}</p>
            </div>
            <div className="text-lg font-bold text-[var(--accent)]">
              {match.radiant_score}-{match.dire_score}{" "}
              {match.radiant_win ? "(Radiant win)" : "(Dire win)"}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
