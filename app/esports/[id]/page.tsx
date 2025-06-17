import { notFound } from "next/navigation";
import type { Match } from "../../../data/matches";
import { matches } from "../../../data/matches";

export default function MatchPage({ params }: any) {
  const matchId = parseInt(params.id, 10);
  const match: Match | undefined = matches.find((m) => m.id === matchId);

  if (!match) {
    notFound();
  }

  return (
    <main className="p-4 sm:p-8 font-sans max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">
        {match!.teams[0]} vs {match!.teams[1]}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {match!.date} • {match!.time} • {match!.tournament}
      </p>
      {match!.venue && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Sede: {match!.venue}
        </p>
      )}
      {match!.description && <p>{match!.description}</p>}
      {match!.score && (
        <p className="text-lg font-bold">
          Marcador final: {match!.score[0]}-{match!.score[1]}
        </p>
      )}
    </main>
  );
}
