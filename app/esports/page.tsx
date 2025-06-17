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

async function getMatches(): Promise<Match[]> {
  const res = await fetch(
    "https://api.opendota.com/api/proMatches?less_than_match_id=9999999999"
  );
  if (!res.ok) {
    console.error("Failed to fetch matches", await res.text());
    return [];
  }
  const data = await res.json();
  return data.slice(0, 10).map((m: any) => ({
    id: m.match_id,
    radiant: m.radiant_name,
    dire: m.dire_name,
    radiant_score: m.radiant_score,
    dire_score: m.dire_score,
    start_time: m.start_time,
    league: m.league_name,
    radiant_win: m.radiant_win,
  }));
}

export default async function EsportsPage() {
  const matches = await getMatches();

  return (
    <main className="p-4 sm:p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Partidos profesionales Dota 2</h1>
      <ul className="space-y-4">
        {matches.map((match) => (
          <li
            key={match.id}
            className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-2"
          >
            <div className="flex-1">
              <p className="font-semibold">
                {match.radiant} vs {match.dire}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(match.start_time * 1000).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {match.league}
              </p>
            </div>
            <div className="text-lg font-bold">
              {match.radiant_score}-{match.dire_score}{" "}
              {match.radiant_win ? "(Radiant win)" : "(Dire win)"}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
