import Link from 'next/link';
import type { GameConfig } from '../../lib/gameConfig';

// Interfaces
interface GameStats {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  activeTournaments: number;
}

const GameStatsCard = ({ game, stats }: { game: GameConfig, stats: GameStats }) => {
  return (
    <Link href={`/esports/game/${game.id}`} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-border cursor-pointer block`}>
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat"></div>
      </div>

      {/* Icono flotante */}
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
        <img src={game.icon} alt={game.name} className="w-16 h-16 group-hover:scale-110 transition-transform duration-500" />
      </div>

      {/* Indicador de click */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1">
          <span>👆</span>
          <span>Explorar</span>
        </div>
      </div>

      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <img src={game.icon} alt={game.name} className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 bg-white/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold group-hover:text-white transition-colors duration-300">
              {game.name}
            </h3>
            <p className="text-sm opacity-75">Estadísticas Live</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full opacity-75"></div>
              <p className="text-sm font-medium opacity-90">Total</p>
            </div>
            <p className="text-3xl font-bold group-hover:scale-105 transition-transform duration-300">
              {stats.totalMatches}
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
              <p className="text-sm font-medium opacity-90">En Vivo</p>
            </div>
            <p className="text-3xl font-bold text-error group-hover:scale-105 transition-transform duration-300">
              {stats.liveMatches}
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-info rounded-full"></div>
              <p className="text-sm font-medium opacity-90">Próximos</p>
            </div>
            <p className="text-3xl font-bold text-info group-hover:scale-105 transition-transform duration-300">
              {stats.upcomingMatches}
            </p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 group-hover:bg-black/30 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <p className="text-sm font-medium opacity-90">Torneos</p>
            </div>
            <p className="text-3xl font-bold text-warning group-hover:scale-105 transition-transform duration-300">
              {stats.activeTournaments}
            </p>
          </div>
        </div>

        {/* Footer con indicador de actividad */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-75">Última actualización</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Ahora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Efecto de hover en el borde */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-accent/30 transition-colors duration-500"></div>
    </Link>
  );
}

export default GameStatsCard;
export type { GameStats };
