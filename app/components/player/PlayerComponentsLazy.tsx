"use client";

import { lazy, Suspense } from "react";
import { Spinner } from "../LoadingOptimized";
import { PlayerDetail, RecentMatch, Achievement, MediaItem } from "../../lib/types/player";

// Lazy load player components
const PlayerHeroSection = lazy(() => import("./PlayerHeroSection"));
const PlayerStatsProgressive = lazy(() => import("./PlayerStatsProgressive"));
const PlayerMatches = lazy(() => import("./PlayerMatches"));
const PlayerAchievements = lazy(() => import("./PlayerAchievements"));
const PlayerMediaGallery = lazy(() => import("./PlayerMediaGallery"));

interface PlayerHeroSectionLazyProps {
  player: PlayerDetail;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

interface PlayerStatsProgressiveLazyProps {
  player: PlayerDetail;
}

interface PlayerMatchesLazyProps {
  recentMatches: RecentMatch[];
  historicalMatches: RecentMatch[];
  isVeteran: boolean;
  playerTeamId?: number | null;
}

interface PlayerAchievementsLazyProps {
  achievements: Achievement[];
  playerName: string;
  isVeteran?: boolean;
}

interface PlayerMediaGalleryLazyProps {
  media: MediaItem[];
  playerName: string;
}

export function PlayerHeroSectionLazy(props: PlayerHeroSectionLazyProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <PlayerHeroSection {...props} />
    </Suspense>
  );
}

export function PlayerStatsProgressiveLazy(props: PlayerStatsProgressiveLazyProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <PlayerStatsProgressive {...props} />
    </Suspense>
  );
}

export function PlayerMatchesLazy(props: PlayerMatchesLazyProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <PlayerMatches {...props} />
    </Suspense>
  );
}

export function PlayerAchievementsLazy(props: PlayerAchievementsLazyProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <PlayerAchievements {...props} />
    </Suspense>
  );
}

export function PlayerMediaGalleryLazy(props: PlayerMediaGalleryLazyProps) {
  return (
    <Suspense fallback={<Spinner />}>
      <PlayerMediaGallery {...props} />
    </Suspense>
  );
}