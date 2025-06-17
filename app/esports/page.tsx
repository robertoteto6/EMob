import Link from "next/link";
import type { Match } from "../../data/matches";
import { matches } from "../../data/matches";


export default function EsportsPage() {
  return (
    <main className="p-4 sm:p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Próximos partidos eSports</h1>
      <ul className="space-y-4">
        {matches.map((match) => (
          <li key={match.id}>
            <Link
              href={`/esports/${match.id}`}
              className="block border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="flex-1">
                <p className="font-semibold">
                  {match.teams[0]} vs {match.teams[1]}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {match.date} • {match.time}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {match.tournament}
                </p>
              </div>
              {match.score && (
                <div className="text-lg font-bold">
                  {match.score[0]}-{match.score[1]}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
