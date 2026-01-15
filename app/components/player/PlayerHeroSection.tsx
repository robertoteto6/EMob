'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayerDetail, getPlayerRank } from '../../lib/types/player';
import { getPlayerImageUrl, getTeamImageUrl } from '../../lib/imageFallback';

interface PlayerHeroSectionProps {
  player: PlayerDetail;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export default function PlayerHeroSection({ player, onToggleFavorite, isFavorite }: PlayerHeroSectionProps) {
  const playerImageSrc = getPlayerImageUrl(player);
  const rank = getPlayerRank(player.title_score);
  const isLegendary = player.title_score >= 150;
  const isVeteran = player.is_veteran;

  const teamLogoSrc = player.team_data
    ? getTeamImageUrl({
        id: player.team_data.id,
        name: player.team_data.name,
        acronym: player.team_data.acronym,
        image_url: player.team_data.image_url,
      })
    : null;

  // Top achievements for hero section (max 3)
  const topAchievements = player.achievements?.filter(a => a.rarity === 'legendary' || a.rarity === 'epic').slice(0, 3) || [];

  return (
    <section className="relative mb-12 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      
      {/* Animated gradient overlay for legends */}
      {isLegendary && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 via-orange-600/10 to-red-600/10"
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {/* Glow effect behind player image */}
      <div className={`absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 ${
        isLegendary ? 'bg-yellow-500' : isVeteran ? 'bg-purple-500' : 'bg-green-500'
      }`} />
      
      {/* Border glow */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${rank.gradient} rounded-3xl opacity-30 blur-sm`} />

      <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 rounded-3xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
        {/* Top banner for legends/veterans */}
        {(isLegendary || isVeteran) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`py-2 px-6 text-center text-sm font-bold ${
              isLegendary 
                ? 'bg-gradient-to-r from-yellow-600/30 via-orange-600/30 to-red-600/30 text-yellow-300' 
                : 'bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 text-purple-300'
            }`}
          >
            <span className="mr-2">{rank.icon}</span>
            {isLegendary ? '🌟 JUGADOR LEGENDARIO 🌟' : '⭐ JUGADOR VETERANO ⭐'}
            <span className="ml-2">{rank.icon}</span>
          </motion.div>
        )}

        <div className="p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Player Avatar Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Avatar with effects */}
              <div className="relative group">
                {/* Animated ring for legends */}
                {isLegendary && (
                  <motion.div 
                    className="absolute -inset-3 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ opacity: 0.6, filter: 'blur(4px)' }}
                  />
                )}
                
                {/* Static glow */}
                <div className={`absolute -inset-2 bg-gradient-to-r ${rank.gradient} rounded-full opacity-50 group-hover:opacity-75 transition-opacity blur-sm`} />
                
                {/* Image container */}
                <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-4 border-gray-600 group-hover:border-green-400 transition-colors shadow-2xl">
                  <Image
                    src={playerImageSrc}
                    alt={player.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 160px, 192px"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Rank badge */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className={`absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-gradient-to-br ${rank.bgGradient} border-2 border-gray-600 flex items-center justify-center text-2xl shadow-lg`}
                  title={`${rank.name} - ${player.title_score} puntos`}
                >
                  {rank.icon}
                </motion.div>
              </div>

              {/* Rank label */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`mt-4 px-4 py-1 rounded-full bg-gradient-to-r ${rank.bgGradient} border border-gray-700`}
              >
                <span className={`text-sm font-bold bg-gradient-to-r ${rank.gradient} bg-clip-text text-transparent`}>
                  {rank.name} • {player.title_score} pts
                </span>
              </motion.div>
            </motion.div>

            {/* Player Info Section */}
            <div className="flex-1 text-center lg:text-left">
              {/* Name and real name */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className={`text-4xl lg:text-6xl font-extrabold mb-2 ${
                  isLegendary 
                    ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg'
                    : 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent'
                }`}>
                  {player.name}
                </h1>
                
                {(player.first_name || player.last_name) && (
                  <p className="text-xl text-gray-300 mb-4">
                    {player.first_name} {player.last_name}
                  </p>
                )}
              </motion.div>

              {/* Badges row */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6"
              >
                {player.role && (
                  <span className="px-4 py-2 bg-blue-600/80 text-white rounded-full text-sm font-semibold shadow-lg shadow-blue-500/20">
                    🎮 {player.role}
                  </span>
                )}
                
                <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                  player.professional_status === "Activo" 
                    ? "bg-green-600/80 text-white shadow-green-500/20" 
                    : "bg-yellow-600/80 text-white shadow-yellow-500/20"
                }`}>
                  {player.professional_status === "Activo" ? '🟢' : '🟡'} {player.professional_status}
                </span>
                
                {player.region_info && (
                  <span className="px-4 py-2 bg-purple-600/80 text-white rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20">
                    <span className="text-lg">{player.region_info.flag}</span>
                    <span>{player.region_info.name}</span>
                  </span>
                )}

                {player.years_active && player.years_active > 5 && (
                  <span className="px-4 py-2 bg-orange-600/80 text-white rounded-full text-sm font-semibold shadow-lg shadow-orange-500/20">
                    🏅 {player.years_active}+ años activo
                  </span>
                )}
              </motion.div>

              {/* Top Achievements Badges (prominent display) */}
              {topAchievements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <span className="text-yellow-500">🏆</span> LOGROS DESTACADOS
                  </h3>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    {topAchievements.map((achievement, idx) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                          achievement.rarity === 'legendary'
                            ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                            : 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/50 shadow-lg shadow-purple-500/20'
                        }`}
                      >
                        <span className="text-xl">{achievement.icon}</span>
                        <div>
                          <p className={`text-sm font-bold ${achievement.rarity === 'legendary' ? 'text-yellow-300' : 'text-purple-300'}`}>
                            {achievement.title}
                          </p>
                          {achievement.tournament && (
                            <p className="text-xs text-gray-400">{achievement.tournament}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
              >
                <div className="text-center p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <p className="text-2xl font-bold text-green-400">{player.win_rate}%</p>
                  <p className="text-xs text-gray-400">Win Rate</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <p className="text-2xl font-bold text-blue-400">{player.total_matches}</p>
                  <p className="text-xs text-gray-400">Partidos</p>
                </div>
                {player.total_earnings && player.total_earnings > 0 && (
                  <div className="text-center p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <p className="text-2xl font-bold text-yellow-400">
                      ${(player.total_earnings / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-400">Ganancias</p>
                  </div>
                )}
                {player.achievements && (
                  <div className="text-center p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                    <p className="text-2xl font-bold text-purple-400">{player.achievements.length}</p>
                    <p className="text-xs text-gray-400">Logros</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Team Card & Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col gap-4 min-w-[280px]"
            >
              {/* Current Team */}
              {player.team_data && (
                <Link 
                  href={`/esports/team/${player.team_data.id}`}
                  className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-5 border border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
                >
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <span>🏠</span> EQUIPO ACTUAL
                  </h3>
                  
                  <div className="flex items-center gap-4">
                    {teamLogoSrc && (
                      <div className="relative">
                        <Image
                          src={teamLogoSrc}
                          alt={player.team_data.name}
                          width={56}
                          height={56}
                          className="rounded-xl object-cover border-2 border-gray-600 group-hover:border-green-500/50 transition-colors"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                        {player.team_data.name}
                      </h4>
                      {player.team_data.acronym && (
                        <p className="text-green-400 font-semibold text-sm">{player.team_data.acronym}</p>
                      )}
                      {player.team_data.location && (
                        <p className="text-xs text-gray-400">{player.team_data.location}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-green-400 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={onToggleFavorite}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isFavorite
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorite ? 'Siguiendo' : 'Seguir'}
                </button>
                
                <button 
                  onClick={() => navigator.share?.({
                    title: `${player.name} - Perfil de jugador`,
                    url: window.location.href
                  })}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
