import Link from 'next/link';
import { SUPPORTED_GAMES } from '../../lib/gameConfig';
import type { Tournament } from '../../lib/types';

const GAMES = SUPPORTED_GAMES;

interface ActiveTournamentsSectionProps {
  loadingTournaments: boolean;
  tournaments: Tournament[];
}

const ActiveTournamentsSection = ({ loadingTournaments, tournaments }: ActiveTournamentsSectionProps) => (
  <section className="container mx-auto px-6 py-16 relative">
    {/* Fondo con gradiente */}
    <div className="absolute inset-0 bg-gradient-to-br from-card/50 via-background/30 to-card/50 rounded-3xl"></div>

    <div className="relative z-10">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 gradient-text">
          🏆 Torneos Activos
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Los torneos más importantes que están en curso en este momento
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-accent to-blue-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {loadingTournaments ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card/50 rounded-2xl p-8 animate-pulse border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-700 rounded mb-6 w-2/3"></div>
              <div className="h-8 bg-gray-700 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tournaments.map((tournament, index) => {
            const game = GAMES.find(g => g.id === tournament.game);
            return (
              <div
                key={tournament.id}
                className="animate-fadein"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link href={`/esports/tournament/${tournament.id}`}>
                  <div className="group relative overflow-hidden bg-gradient-to-br from-card to-card/80 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-border hover:border-accent/50">
                    {/* Efecto de brillo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                    {/* Header del torneo */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        {game && (
                          <div className="relative">
                            <img
                              src={game.icon}
                              alt={game.name}
                              className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        )}
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-400 group-hover:text-accent transition-colors duration-300">
                            {tournament.league}
                          </span>
                          {game && (
                            <p className="text-xs text-gray-500">{game.name}</p>
                          )}
                        </div>

                        {/* Estado activo */}
                        <div className="bg-gradient-to-r from-accent to-green-600 text-black text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg">
                          ACTIVO
                        </div>
                      </div>

                      {/* Información del torneo */}
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors duration-300 line-clamp-2">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                        {tournament.serie}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {tournament.prizepool ? (
                          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
                            <span className="text-yellow-200">💰</span>
                            {tournament.prizepool}
                          </div>
                        ) : (
                          <div className="bg-card/50 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium">
                            Prize Pool TBD
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Efecto de hover en el fondo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-info/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-12 border-border max-w-md mx-auto">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">No hay torneos activos</h3>
            <p className="text-gray-400 mb-6">
              No hay torneos en curso en este momento.
            </p>
            <Link
              href="/esports"
              className="bg-gradient-to-r from-accent to-blue-500 hover:from-accent/80 hover:to-blue-500/80 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg inline-block"
            >
              Ver Todos los Torneos
            </Link>
          </div>
        </div>
      )}
    </div>
  </section>
);

export default ActiveTournamentsSection;
