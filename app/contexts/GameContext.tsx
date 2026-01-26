'use client';

import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { SUPPORTED_GAMES, type GameConfig } from '../lib/gameConfig';

export interface GameState {
  selectedGames: string[];
}

export interface GameActions {
  setSelectedGames: (games: string[]) => void;
  addGame: (gameId: string) => void;
  removeGame: (gameId: string) => void;
  toggleGame: (gameId: string) => void;
  hasGame: (gameId: string) => boolean;
  clearGames: () => void;
}

export type GameStore = GameState & GameActions;

// Validar que un juego existe en los juegos soportados
function isValidGame(gameId: string): boolean {
  return SUPPORTED_GAMES.some(game => game.id === gameId);
}

// Filtrar solo juegos válidos
function filterValidGames(gameIds: string[]): string[] {
  return gameIds.filter(isValidGame);
}

// Estado inicial
const initialState: GameState = {
  selectedGames: [],
};

// Store de juegos con persistencia
export const useGameStore = createWithEqualityFn<GameStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setSelectedGames: (games) => set((state) => {
          // Validar y filtrar solo juegos válidos
          const validGames = filterValidGames(games);
          // Asegurar que al menos hay un juego si se intenta establecer
          if (validGames.length > 0) {
            state.selectedGames = validGames;
          } else {
            state.selectedGames = [];
          }
        }),

        addGame: (gameId) => set((state) => {
          if (isValidGame(gameId) && !state.selectedGames.includes(gameId)) {
            state.selectedGames.push(gameId);
          }
        }),

        removeGame: (gameId) => set((state) => {
          state.selectedGames = state.selectedGames.filter(id => id !== gameId);
        }),

        toggleGame: (gameId) => set((state) => {
          if (!isValidGame(gameId)) return;
          
          const index = state.selectedGames.indexOf(gameId);
          if (index > -1) {
            // Si hay más de un juego, permitir remover
            if (state.selectedGames.length > 1) {
              state.selectedGames.splice(index, 1);
            }
            // Si solo hay uno, no permitir remover (debe haber al menos uno)
          } else {
            state.selectedGames.push(gameId);
          }
        }),

        hasGame: (gameId) => {
          return get().selectedGames.includes(gameId);
        },

        clearGames: () => set((state) => {
          state.selectedGames = [];
        }),
      })),
      {
        name: 'emob-selected-games',
        storage: createJSONStorage(() => localStorage),
        version: 1,
      }
    ),
    {
      name: 'game-store'
    }
  )
);

// Hook para usar el contexto de juegos
export const useGameContext = () => {
  const store = useGameStore();
  return {
    selectedGames: store.selectedGames,
    setSelectedGames: store.setSelectedGames,
    addGame: store.addGame,
    removeGame: store.removeGame,
    toggleGame: store.toggleGame,
    hasGame: store.hasGame,
    clearGames: store.clearGames,
    // Helpers
    hasAnyGame: store.selectedGames.length > 0,
    getSelectedGamesConfig: (): GameConfig[] => {
      return store.selectedGames
        .map(id => SUPPORTED_GAMES.find(game => game.id === id))
        .filter((game): game is GameConfig => game !== undefined);
    },
  };
};
