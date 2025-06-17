import Image from "next/image";

interface Match {
  id: number;
  teams: [string, string];
  date: string;
  time: string;
  tournament: string;
  score?: [number, number];
}

const matches: Match[] = [
  {
    id: 1,
    teams: ["Team Liquid", "Fnatic"],
    date: "2024-08-01",
    time: "18:00 CET",
    tournament: "League of Legends Championship",
    score: [2, 1],
  },
  {
    id: 2,
    teams: ["NAVI", "G2"],
    date: "2024-08-03",
    time: "20:00 CET",
    tournament: "Counter-Strike Masters",
  },
  {
    id: 3,
    teams: ["Cloud9", "T1"],
    date: "2024-08-05",
    time: "17:00 CET",
    tournament: "Valorant World Series",
  },
];

export default function EsportsPage() {
  return (
    <main className="p-4 sm:p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Próximos partidos eSports</h1>
      <ul className="space-y-4">
        {matches.map((match) => (
          <li
            key={match.id}
            className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-2"
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
          </li>
        ))}
      </ul>
    </main>
  );
}
