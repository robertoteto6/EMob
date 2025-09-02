import Link from 'next/link';
import { SUPPORTED_GAMES } from '../../lib/gameConfig';
import type { Match } from '../../lib/types';

const GAMES = SUPPORTED_GAMES;

interface FiltersSectionProps {
  selectedTimeframe: "today" | "week" | "all";
  setSelectedTimeframe: (timeframe: "today" | "week" | "all") => void;
  selectedGame: string;
  setSelectedGame: (game: string) => void;
  filteredMatches: Match[];
  matches: Match[];
  featuredMatches: Match[];
  currentTime: number;
}

const FiltersSection = ({
  selectedTimeframe,
  setSelectedTimeframe,
  selectedGame,
  setSelectedGame,
  filteredMatches,
  matches,
  featuredMatches,
  currentTime,
}: FiltersSectionProps) => {
  return (
    <section className="container mx-auto px-6 mb-12">
      <div className="glass-effect rounded-3xl p-8 border">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-3 gradient-text">
            🎛️ Filtros Avanzados
          </h3>
          <p className="text-gray-400 text-sm">Personaliza tu experiencia seleccionando período de tiempo y juegos</p>
        </div>

        {/* Filtros de Tiempo */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-info">⏰</span>
            Período de Tiempo
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "today", label: "Hoy", emoji: "📅", description: "Partidos de hoy", count: filteredMatches.filter(m => {
                const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
                const matchTime = m.start_time * 1000;
                return matchTime >= todayStart.getTime() && matchTime <= todayEnd.getTime();
              }).length },
              { id: "week", label: "Esta Semana", emoji: "🗓️", description: "Próximos 7 días", count: filteredMatches.filter(m => {
                const weekStart = currentTime * 1000;
                const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000);
                const matchTime = m.start_time * 1000;
                return matchTime >= weekStart && matchTime <= weekEnd;
              }).length },
              { id: "all", label: "Todos", emoji: "🌐", description: "Sin filtro de tiempo", count: matches.length },
            ].map((option, index) => (
              <button
                key={option.id}
                onClick={() => setSelectedTimeframe(option.id as typeof selectedTimeframe)}
                className={`group relative overflow-hidden px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                  selectedTimeframe === option.id
                    ? "bg-info text-white border-info/50 shadow-lg shadow-info/25"
                    : "bg-card text-white border-border hover:border-info/50 hover:bg-card/50"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                <div className="relative z-10 text-center">
                  <div className="text-2xl mb-2">{option.emoji}</div>
                  <div className="font-bold text-base mb-1">{option.label}</div>
                  <div className={`text-xs mb-2 ${selectedTimeframe === option.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {option.description}
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                    selectedTimeframe === option.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {selectedGame === "all" ? option.count : filteredMatches.length} partidos
                  </div>
                </div>

                {/* Indicador de selección */}
                {selectedTimeframe === option.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-info to-cyan-500 rounded-b-xl"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros de Juegos */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-accent">🎮</span>
            Seleccionar Juegos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Opción "Todos los juegos" */}
            <button
              onClick={() => setSelectedGame("all")}
              className={`group relative overflow-hidden px-4 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                selectedGame === "all"
                  ? "bg-accent text-black border-accent/50 shadow-lg shadow-accent/25"
                  : "bg-card text-white border-border hover:border-accent/50 hover:bg-card/50"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

              <div className="relative z-10 text-center">
                <div className="text-3xl mb-3">🌟</div>
                <div className="font-bold text-sm mb-2">Todos</div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  selectedGame === "all"
                    ? 'bg-black/20 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {matches.length} partidos
                </div>
              </div>

              {selectedGame === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-blue-500 rounded-b-xl"></div>
              )}
            </button>

            {/* Opciones de juegos individuales */}
            {GAMES.map((game, index) => {
              const gameMatches = matches.filter(m => m.game === game.id);
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`group relative overflow-hidden px-4 py-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-2 ${
                    selectedGame === game.id
                      ? `bg-gradient-to-r ${game.gradient} text-white border-white/30 shadow-lg`
                      : "bg-card text-white border-border hover:border-accent/50 hover:bg-card/50"
                  }`}
                  style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                  <div className="relative z-10 text-center">
                    <div className="mb-3">
                      <img
                        src={game.icon}
                        alt={game.name}
                        className="w-8 h-8 mx-auto group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="font-bold text-sm mb-2 line-clamp-1" title={game.name}>
                      {game.name}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      selectedGame === game.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {gameMatches.length} partidos
                    </div>
                  </div>

                  {selectedGame === game.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-blue-500 rounded-b-xl"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Información de resultados y acciones */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-xl text-sm text-gray-300">
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Actualización automática cada 30s
            </div>

            <div className="bg-gradient-to-r from-info/20 to-accent/20 px-4 py-2 rounded-xl text-sm text-white border border-info/30">
              <span className="font-bold">{filteredMatches.length}</span> partidos encontrados
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedTimeframe("today");
                setSelectedGame("all");
              }}
              className="bg-card/50 hover:bg-card/80 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restablecer
            </button>

            {featuredMatches.length > 0 && (
              <Link
                href="/esports"
                className="bg-gradient-to-r from-accent to-blue-500 hover:from-accent/80 hover:to-blue-500/80 text-black px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Ver Todos
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiltersSection;
