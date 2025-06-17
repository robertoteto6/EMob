export interface Match {
  id: number;
  teams: [string, string];
  date: string;
  time: string;
  tournament: string;
  venue?: string;
  score?: [number, number];
  description?: string;
}

export const matches: Match[] = [
  {
    id: 1,
    teams: ["Team Liquid", "Fnatic"],
    date: "2024-08-01",
    time: "18:00 CET",
    tournament: "League of Legends Championship",
    venue: "Berlin Arena",
    score: [2, 1],
    description: "Semifinal intensa con remontada de Team Liquid." ,
  },
  {
    id: 2,
    teams: ["NAVI", "G2"],
    date: "2024-08-03",
    time: "20:00 CET",
    tournament: "Counter-Strike Masters",
    venue: "Cologne Stadium",
    description: "Partido de cuartos con mucha expectativa." ,
  },
  {
    id: 3,
    teams: ["Cloud9", "T1"],
    date: "2024-08-05",
    time: "17:00 CET",
    tournament: "Valorant World Series",
    venue: "Paris Expo Hall",
    description: "Enfrentamiento decisivo por la fase de grupos." ,
  },
];
