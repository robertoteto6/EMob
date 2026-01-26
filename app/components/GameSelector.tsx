"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useGameContext } from "../contexts/GameContext";
import { SUPPORTED_GAMES, type GameConfig } from "../lib/gameConfig";
import { useRouter } from "next/navigation";

interface GameSelectorProps {
  onComplete?: () => void;
}

export default function GameSelector({ onComplete }: GameSelectorProps) {
  const { selectedGames, toggleGame, setSelectedGames } = useGameContext();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedGames);
  const router = useRouter();

  const handleToggle = useCallback((gameId: string) => {
    setLocalSelection(prev => {
      if (prev.includes(gameId)) {
        // Solo permitir remover si hay más de uno seleccionado
        if (prev.length > 1) {
          return prev.filter(id => id !== gameId);
        }
        return prev;
      } else {
        return [...prev, gameId];
      }
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (localSelection.length > 0) {
      setSelectedGames(localSelection);
      if (onComplete) {
        onComplete();
      } else {
        // Recargar la página para que se actualicen los datos
        router.refresh();
      }
    }
  }, [localSelection, setSelectedGames, onComplete, router]);

  const handleSelectAll = useCallback(() => {
    setLocalSelection(SUPPORTED_GAMES.map(game => game.id));
  }, []);

  const handleClearAll = useCallback(() => {
    // Mantener al menos un juego seleccionado
    if (localSelection.length > 1) {
      setLocalSelection([SUPPORTED_GAMES[0].id]);
    }
  }, [localSelection.length]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Selecciona tus Juegos
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            Elige uno o varios juegos para personalizar tu experiencia
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Puedes cambiar tu selección en cualquier momento desde el menú
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {SUPPORTED_GAMES.map((game) => {
            const isSelected = localSelection.includes(game.id);
            return (
              <button
                key={game.id}
                onClick={() => handleToggle(game.id)}
                disabled={isSelected && localSelection.length === 1}
                className={`
                  relative group p-6 rounded-2xl border-2 transition-all duration-300
                  ${isSelected
                    ? 'bg-gradient-to-br from-emerald-500/20 to-transparent shadow-lg shadow-emerald-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }
                  ${isSelected && localSelection.length === 1 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                  transform hover:scale-105 active:scale-95
                `}
                style={isSelected ? { borderColor: game.color, boxShadow: `0 0 20px ${game.color}40` } : undefined}
              >
                {/* Checkbox indicator */}
                <div className="absolute top-4 right-4">
                  <div 
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                    style={isSelected ? { borderColor: game.color, backgroundColor: game.color } : undefined}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Game Icon */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`
                    w-20 h-20 rounded-xl flex items-center justify-center transition-all
                    ${isSelected ? 'scale-110' : 'scale-100'}
                  `}>
                    <Image
                      src={game.icon}
                      alt={game.name}
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
                    {game.description && (
                      <p className="text-sm text-gray-400">{game.description}</p>
                    )}
                  </div>
                </div>

                {/* Glow effect when selected */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/20"
            >
              Seleccionar Todos
            </button>
            <button
              onClick={handleClearAll}
              disabled={localSelection.length <= 1}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          </div>

          <button
            onClick={handleContinue}
            disabled={localSelection.length === 0}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            Continuar ({localSelection.length} {localSelection.length === 1 ? 'juego' : 'juegos'})
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {localSelection.length === 0 && "Selecciona al menos un juego para continuar"}
            {localSelection.length > 0 && `Has seleccionado ${localSelection.length} ${localSelection.length === 1 ? 'juego' : 'juegos'}`}
          </p>
        </div>
      </div>
    </div>
  );
}
