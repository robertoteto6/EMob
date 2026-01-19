'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { RecentMatch } from '../../lib/types/player';

interface PlayerMatchesProps {
  recentMatches: RecentMatch[];
  historicalMatches: RecentMatch[];
  isVeteran: boolean;
  playerTeamId?: number | null;
}

function RecentMatchCard({ match, playerTeamId }: { match: RecentMatch; playerTeamId?: number | null }) {
  const matchDate = new Date(match.begin_at);
  const isWin = match.winner && playerTeamId && match.winner.id === playerTeamId;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-r ${isWin ? 'from-green-900/30 to-green-800/20' : 'from-red-900/30 to-red-800/20'} rounded-xl p-4 border ${isWin ? 'border-green-500/30' : 'border-red-500/30'} transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.league.image_url && (
            <Image
              src={match.league.image_url}
              alt={match.league.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded"
            />
          )}
          <span className="text-sm font-medium text-gray-300">{match.league.name}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold ${isWin ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {isWin ? 'VICTORIA' : 'DERROTA'}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-white text-sm">{match.name}</h4>
        <span className="text-xs text-gray-400">
          {matchDate.toLocaleDateString('es-ES')}
        </span>
      </div>
      
      <div className="text-xs text-gray-400">
        {match.tournament.name}
      </div>
    </motion.div>
  );
}

function HistoricalMatchCard({ match, playerTeamId }: { match: RecentMatch; playerTeamId?: number | null }) {
  const matchDate = new Date(match.begin_at);
  const isWin = match.winner && playerTeamId && match.winner.id === playerTeamId;
  
  const matchName = match.name?.toLowerCase() || '';
  const tournamentName = match.tournament?.name?.toLowerCase() || '';
  const isGrandFinal = matchName.includes('grand final') || matchName.includes('final');
  const isMajor = tournamentName.includes('major') || tournamentName.includes('championship') || tournamentName.includes('world');
  
  let importanceLevel = 'Importante';
  let importanceColor = 'border-blue-500/40 bg-gradient-to-r from-blue-900/30 to-blue-800/20';
  let importanceIcon = '📌';
  
  if (isGrandFinal && isMajor) {
    importanceLevel = 'Legendario';
    importanceColor = 'border-yellow-500/40 bg-gradient-to-r from-yellow-900/30 to-orange-800/20';
    importanceIcon = '👑';
  } else if (isGrandFinal) {
    importanceLevel = 'Épico';
    importanceColor = 'border-purple-500/40 bg-gradient-to-r from-purple-900/30 to-purple-800/20';
    importanceIcon = '⭐';
  } else if (isMajor) {
    importanceLevel = 'Notable';
    importanceColor = 'border-cyan-500/40 bg-gradient-to-r from-cyan-900/30 to-cyan-800/20';
    importanceIcon = '🏆';
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`${importanceColor} rounded-xl p-4 border transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.league.image_url && (
            <Image
              src={match.league.image_url}
              alt={match.league.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded"
            />
          )}
          <span className="text-sm font-medium text-gray-300">{match.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 font-medium flex items-center gap-1">
            <span>{importanceIcon}</span>
            {importanceLevel}
          </span>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${isWin ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {isWin ? 'VICTORIA' : 'DERROTA'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-white text-sm">{match.name}</h4>
        <span className="text-xs text-gray-400">
          {matchDate.toLocaleDateString('es-ES')}
        </span>
      </div>
      
      <div className="text-xs text-gray-400 mb-2">
        {match.tournament.name}
      </div>
      
      {importanceLevel === 'Legendario' && (
        <div className="flex items-center gap-1 text-xs text-yellow-400 mt-2 pt-2 border-t border-yellow-500/20">
          <span className="text-lg">🏆</span>
          <span className="font-bold">Momento histórico en la carrera</span>
        </div>
      )}
      
      {importanceLevel === 'Épico' && (
        <div className="flex items-center gap-1 text-xs text-purple-400 mt-2 pt-2 border-t border-purple-500/20">
          <span className="text-lg">⭐</span>
          <span className="font-bold">Partido destacado</span>
        </div>
      )}
    </motion.div>
  );
}

export default function PlayerMatches({ recentMatches, historicalMatches, isVeteran, playerTeamId }: PlayerMatchesProps) {
  if (recentMatches.length === 0 && historicalMatches.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      {/* Partidos Recientes */}
      {recentMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-900/40 to-emerald-900/40 border border-green-500/30">
              <span className="text-4xl">📅</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Partidos Recientes</h2>
              <p className="text-gray-400">Últimos {recentMatches.length} partidos registrados</p>
            </div>
          </div>

          <div className="grid gap-4">
            {recentMatches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <RecentMatchCard match={match} playerTeamId={playerTeamId} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Partidos Históricos - Solo para veteranos */}
      {isVeteran && historicalMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30">
              <span className="text-4xl">🏆</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Momentos Históricos de la Carrera
              </h2>
              <p className="text-gray-400">Partidos importantes y memorables</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl opacity-20 blur-sm"></div>
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 rounded-2xl p-6 backdrop-blur-sm border border-yellow-500/30">
              <p className="text-yellow-300 text-sm mb-4 flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span>Como jugador veterano, estos son sus partidos más importantes y destacados</span>
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                {historicalMatches.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <HistoricalMatchCard match={match} playerTeamId={playerTeamId} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
