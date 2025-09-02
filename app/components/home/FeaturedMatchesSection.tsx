import Link from 'next/link';
import FeaturedMatch from './FeaturedMatch';
import type { Match } from '../../lib/types';

interface FeaturedMatchesSectionProps {
  loading: boolean;
  featuredMatches: Match[];
  currentTime: number;
}

const FeaturedMatchesSection = ({ loading, featuredMatches, currentTime }: FeaturedMatchesSectionProps) => (
  <section className="container mx-auto px-6 py-16">
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold mb-4 gradient-text">
        ⚡ Partidos Destacados
      </h2>
      <p className="text-gray-400 text-lg max-w-2xl mx-auto">
        Los enfrentamientos más emocionantes en vivo y próximos a comenzar
      </p>
      <div className="w-24 h-1 bg-gradient-to-r from-accent to-blue-500 mx-auto mt-4 rounded-full"></div>
    </div>

    {loading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card/50 rounded-2xl p-8 animate-pulse border border-border">
            <div className="flex justify-between items-center mb-6">
              <div className="h-4 bg-gray-700 rounded w-32"></div>
              <div className="h-6 bg-gray-700 rounded-full w-20"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-10 bg-gray-700 rounded w-16 mx-auto"></div>
              </div>
              <div className="text-center px-6">
                <div className="h-6 bg-gray-700 rounded w-8 mx-auto"></div>
              </div>
              <div className="text-center flex-1">
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-10 bg-gray-700 rounded w-16 mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : featuredMatches.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {featuredMatches.map((match, index) => (
          <div
            key={match.id}
            className="animate-fadein"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <FeaturedMatch match={match} currentTime={currentTime} />
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-12 border border-border max-w-md mx-auto">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-bold text-white mb-2">No hay partidos destacados</h3>
          <p className="text-gray-400 mb-6">
            No hay partidos en vivo o próximos en este momento.
          </p>
          <Link
            href="/esports"
            className="bg-gradient-to-r from-accent to-blue-500 hover:from-accent/80 hover:to-blue-500/80 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg inline-block"
          >
            Ver Todos los Partidos
          </Link>
        </div>
      </div>
    )}

    {/* Acciones rápidas */}
    {featuredMatches.length > 0 && (
      <div className="mt-12 text-center">
        <div className="glass-effect rounded-2xl p-6 border">
          <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/esports"
              className="bg-gradient-to-r from-info to-blue-700 hover:from-info/80 hover:to-blue-700/80 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
            >
              🎯 Ver Todos los Partidos
            </Link>
            <button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700/80 hover:to-purple-800/80 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2">
              ⭐ Mis Favoritos
            </button>
            <button className="bg-gradient-to-r from-error to-red-700 hover:from-error/80 hover:to-red-700/80 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2">
              🔴 Solo En Vivo
            </button>
          </div>
        </div>
      </div>
    )}
  </section>
);

export default FeaturedMatchesSection;
