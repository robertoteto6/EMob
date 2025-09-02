import GameStatsCard from './GameStatsCard';
import type { GameStats } from './GameStatsCard';
import { SUPPORTED_GAMES, type GameConfig } from '../../lib/gameConfig';

const GAMES = SUPPORTED_GAMES;

const GameStatsSection = ({ gameStats }: { gameStats: Record<string, GameStats> }) => (
  <section className="container mx-auto px-6 py-16">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold mb-4 gradient-text">
        📊 Estadísticas en Tiempo Real
      </h2>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">
        Métricas actualizadas de todos los esports más populares
      </p>
      <div className="w-24 h-1 bg-gradient-to-r from-accent to-blue-500 mx-auto mt-4 rounded-full"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {GAMES.map((game, index) => (
        <div
          key={game.id}
          className="animate-fadein"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <GameStatsCard
            game={game}
            stats={gameStats[game.id] || { totalMatches: 0, liveMatches: 0, upcomingMatches: 0, completedMatches: 0, activeTournaments: 0 }}
          />
        </div>
      ))}
    </div>
  </section>
);

export default GameStatsSection;
