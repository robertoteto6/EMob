import Link from 'next/link';
import { SUPPORTED_GAMES } from '../../lib/gameConfig';
import type { Match } from '../../lib/types';

const GAMES = SUPPORTED_GAMES;

const FeaturedMatch = ({ match, currentTime }: { match: Match; currentTime: number }) => {
  const game = GAMES.find(g => g.id === match.game);
  const isLive = match.start_time <= currentTime && match.radiant_win === null;
  const isUpcoming = match.start_time > currentTime;
  const isFinished = match.radiant_win !== null;

  return (
    <Link href={`/esports/${match.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/80 to-card border border-border hover:border-accent/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
        {/* Efecto de brillo animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

        {/* Indicador de estado */}
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-error to-red-600 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-error/80 to-red-500 animate-pulse"></div>
          </div>
        )}

        {/* Header del partido */}
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {game && (
                <div className="relative">
                  <img
                    src={game.icon}
                    alt={game.name}
                    className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-300">{match.league}</span>
                {game && (
                  <p className="text-xs text-gray-500">{game.name}</p>
                )}
              </div>
            </div>

            {/* Estado del partido */}
            {isLive && (
              <div className="relative">
                <span className="bg-gradient-to-r from-error to-red-600 text-white text-xs font-bold px-3 py-2 rounded-full animate-pulse shadow-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  EN VIVO
                </span>
                <div className="absolute inset-0 bg-error/30 rounded-full blur-xl animate-pulse"></div>
              </div>
            )}

            {isUpcoming && (
              <span className="bg-gradient-to-r from-info to-blue-700 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                PRÓXIMO
              </span>
            )}

            {isFinished && (
              <span className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg">
                FINALIZADO
              </span>
            )}
          </div>

          {/* Equipos y marcador */}
          <div className="flex items-center justify-between mb-6">
            {/* Equipo 1 */}
            <div className="text-center flex-1 group/team">
              <div className="bg-card/50 rounded-xl p-4 group-hover/team:bg-card/80 transition-colors duration-300">
                <p className="font-bold text-lg text-white mb-2 group-hover/team:text-accent transition-colors duration-300">
                  {match.radiant}
                </p>
                {typeof match.radiant_score === "number" ? (
                  <p className="text-4xl font-bold text-accent group-hover/team:scale-110 transition-transform duration-300">
                    {match.radiant_score}
                  </p>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <div className="w-8 h-8 bg-gray-700 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-xs font-bold">?</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* VS y tiempo */}
            <div className="text-center px-6">
              <div className="relative">
                <span className="text-gray-400 font-bold text-xl group-hover:text-white transition-colors duration-300">
                  VS
                </span>
                <div className="absolute -inset-2 bg-gradient-to-r from-accent/20 to-info/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              </div>
              {typeof match.radiant_score !== "number" && (
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {new Date(match.start_time * 1000).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              )}
            </div>

            {/* Equipo 2 */}
            <div className="text-center flex-1 group/team">
              <div className="bg-card/50 rounded-xl p-4 group-hover/team:bg-card/80 transition-colors duration-300">
                <p className="font-bold text-lg text-white mb-2 group-hover/team:text-accent transition-colors duration-300">
                  {match.dire}
                </p>
                {typeof match.dire_score === "number" ? (
                  <p className="text-4xl font-bold text-accent group-hover/team:scale-110 transition-transform duration-300">
                    {match.dire_score}
                  </p>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <div className="w-8 h-8 bg-gray-700 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-xs font-bold">?</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer con fecha y acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-left">
              <p className="text-sm text-gray-400 font-medium">
                {new Date(match.start_time * 1000).toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short"
                })}
              </p>
              {isLive && (
                <p className="text-xs text-error font-semibold mt-1">
                  {(() => {
                    const duration = Math.floor(currentTime - match.start_time);
                    const minutes = Math.floor(duration / 60);
                    return `${minutes} min en curso`;
                  })()}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-card/50 hover:bg-card/80 text-gray-400 hover:text-white transition-all duration-300 group/btn">
                <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-lg bg-card/50 hover:bg-card/80 text-gray-400 hover:text-white transition-all duration-300 group/btn">
                <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              <div className="bg-gradient-to-r from-accent/20 to-info/20 p-2 rounded-lg">
                <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Efecto de hover en el fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-info/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
    </Link>
  );
}

export default FeaturedMatch;
