'use client';

import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// Tipos para el estado global
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'es' | 'en';
    notifications: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  favoriteTeams: string[];
  favoritePlayers: string[];
}

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'upcoming' | 'live' | 'finished';
  startTime: string;
  tournament: string;
  game: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  game: string;
  ranking: number;
  wins: number;
  losses: number;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  game: string;
  avatar?: string;
  stats: Record<string, number>;
}

export interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

export interface AppState {
  // Estado de la aplicación
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;

  // Usuario
  user: User | null;
  isAuthenticated: boolean;

  // Datos de esports
  matches: Match[];
  teams: Team[];
  players: Player[];

  // UI State
  sidebarOpen: boolean;
  chatOpen: boolean;
  notificationsOpen: boolean;

  // Cache
  cache: Map<string, CacheEntry>;
}

export interface AppActions {
  // Acciones de usuario
  setUser: (user: User | null) => void;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void;
  addFavoriteTeam: (teamId: string) => void;
  removeFavoriteTeam: (teamId: string) => void;
  addFavoritePlayer: (playerId: string) => void;
  removeFavoritePlayer: (playerId: string) => void;

  // Acciones de datos
  setMatches: (matches: Match[]) => void;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  setTeams: (teams: Team[]) => void;
  setPlayers: (players: Player[]) => void;

  // Acciones de UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;

  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateLastUpdated: () => void;

  // Cache
  setCache: (key: string, data: unknown, ttl?: number) => void;
  getCache: (key: string) => unknown | null;
  clearCache: (key?: string) => void;

  // Utilidades
  reset: () => void;
}

export type AppStore = AppState & AppActions;

// Estado inicial
const initialState: AppState = {
  isLoading: false,
  error: null,
  lastUpdated: 0,
  user: null,
  isAuthenticated: false,
  matches: [],
  teams: [],
  players: [],
  sidebarOpen: false,
  chatOpen: false,
  notificationsOpen: false,
  cache: new Map()
};

// Store principal con middleware
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Acciones de usuario
          setUser: (user) => set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
          }),

          updateUserPreferences: (preferences) => set((state) => {
            if (state.user) {
              state.user.preferences = { ...state.user.preferences, ...preferences };
            }
          }),

          addFavoriteTeam: (teamId) => set((state) => {
            if (state.user && !state.user.favoriteTeams.includes(teamId)) {
              state.user.favoriteTeams.push(teamId);
            }
          }),

          removeFavoriteTeam: (teamId) => set((state) => {
            if (state.user) {
              state.user.favoriteTeams = state.user.favoriteTeams.filter((id: string) => id !== teamId);
            }
          }),

          addFavoritePlayer: (playerId) => set((state) => {
            if (state.user && !state.user.favoritePlayers.includes(playerId)) {
              state.user.favoritePlayers.push(playerId);
            }
          }),

          removeFavoritePlayer: (playerId) => set((state) => {
            if (state.user) {
              state.user.favoritePlayers = state.user.favoritePlayers.filter((id: string) => id !== playerId);
            }
          }),

          // Acciones de datos
          setMatches: (matches) => set((state) => {
            state.matches = matches;
            state.lastUpdated = Date.now();
          }),

          updateMatch: (matchId, updates) => set((state) => {
            const matchIndex = state.matches.findIndex((m: Match) => m.id === matchId);
            if (matchIndex !== -1) {
              state.matches[matchIndex] = { ...state.matches[matchIndex], ...updates };
            }
          }),

          setTeams: (teams) => set((state) => {
            state.teams = teams;
            state.lastUpdated = Date.now();
          }),

          setPlayers: (players) => set((state) => {
            state.players = players;
            state.lastUpdated = Date.now();
          }),

          // Acciones de UI
          toggleSidebar: () => set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          }),

          setSidebarOpen: (open) => set((state) => {
            if (state.sidebarOpen === open) {
              return;
            }

            state.sidebarOpen = open;
          }),

          toggleChat: () => set((state) => {
            state.chatOpen = !state.chatOpen;
          }),

          setChatOpen: (open) => set((state) => {
            if (state.chatOpen === open) {
              return;
            }

            state.chatOpen = open;
          }),

          toggleNotifications: () => set((state) => {
            state.notificationsOpen = !state.notificationsOpen;
          }),

          setNotificationsOpen: (open) => set((state) => {
            if (state.notificationsOpen === open) {
              return;
            }

            state.notificationsOpen = open;
          }),

          // Acciones de estado
          setLoading: (loading) => set((state) => {
            state.isLoading = loading;
          }),

          setError: (error) => set((state) => {
            state.error = error;
          }),

          updateLastUpdated: () => set((state) => {
            state.lastUpdated = Date.now();
          }),

          // Cache
          setCache: (key, data, ttl = 300000) => set((state) => {
            state.cache.set(key, {
              data,
              timestamp: Date.now(),
              ttl
            });
          }),

          getCache: (key) => {
            const cached = get().cache.get(key);
            if (!cached) return null;

            const now = Date.now();
            if (now - cached.timestamp > cached.ttl) {
              get().clearCache(key);
              return null;
            }

            return cached.data;
          },

          clearCache: (key) => set((state) => {
            if (key) {
              state.cache.delete(key);
            } else {
              state.cache.clear();
            }
          }),

          // Utilidades
          reset: () => set(() => ({ ...initialState, cache: new Map() }))
        }))
      ),
      {
        name: 'emob-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sidebarOpen: state.sidebarOpen,
        }),
        version: 1,
      }
    ),
    {
      name: 'emob-store'
    }
  )
);

// Selectores optimizados
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useMatches = () => useAppStore((state) => state.matches);
export const useTeams = () => useAppStore((state) => state.teams);
export const usePlayers = () => useAppStore((state) => state.players);
export const useUIState = () => useAppStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  chatOpen: state.chatOpen,
  notificationsOpen: state.notificationsOpen
}), shallow);
export const useAppStatus = () => useAppStore((state) => ({
  isLoading: state.isLoading,
  error: state.error,
  lastUpdated: state.lastUpdated
}), shallow);

// Selectores derivados
export const useLiveMatches = () => useAppStore((state) =>
  state.matches.filter(match => match.status === 'live')
);

export const useUpcomingMatches = () => useAppStore((state) =>
  state.matches.filter(match => match.status === 'upcoming')
);

export const useFavoriteTeams = () => useAppStore((state) => {
  if (!state.user) return [];
  return state.teams.filter(team => state.user!.favoriteTeams.includes(team.id));
});

export const useFavoritePlayers = () => useAppStore((state) => {
  if (!state.user) return [];
  return state.players.filter(player => state.user!.favoritePlayers.includes(player.id));
});

// Hook para acciones
export const useAppActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  updateUserPreferences: state.updateUserPreferences,
  addFavoriteTeam: state.addFavoriteTeam,
  removeFavoriteTeam: state.removeFavoriteTeam,
  addFavoritePlayer: state.addFavoritePlayer,
  removeFavoritePlayer: state.removeFavoritePlayer,
  setMatches: state.setMatches,
  updateMatch: state.updateMatch,
  setTeams: state.setTeams,
  setPlayers: state.setPlayers,
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  toggleChat: state.toggleChat,
  setChatOpen: state.setChatOpen,
  toggleNotifications: state.toggleNotifications,
  setNotificationsOpen: state.setNotificationsOpen,
  setLoading: state.setLoading,
  setError: state.setError,
  updateLastUpdated: state.updateLastUpdated,
  setCache: state.setCache,
  getCache: state.getCache,
  clearCache: state.clearCache,
  reset: state.reset
}), shallow);

// Middleware personalizado para logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  useAppStore.subscribe(
    (state) => state,
    (state, prevState) => {
      console.group('🏪 Store Update');
      console.log('Previous:', prevState);
      console.log('Current:', state);
      console.groupEnd();
    }
  );
}

// Suscripciones para efectos secundarios
useAppStore.subscribe(
  (state) => state.user?.preferences.theme,
  (theme) => {
    if (theme && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
);

// Optimización: Limpiar cache automáticamente cada 5 minutos
setInterval(() => {
  const store = useAppStore.getState();
  const now = Date.now();

  const cleanupCache = () => {
    store.cache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        store.clearCache(key);
      }
    });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(cleanupCache);
  } else {
    cleanupCache();
  }
}, 300000); // Cada 5 minutos
