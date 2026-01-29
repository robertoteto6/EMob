// ============================================================================
// Barrel File - Exportación Centralizada de Componentes EMob
// ============================================================================

// Componentes de Imagen y Assets Visuales (Nuevos y Mejorados)
export { default as GameIcon, GameIconSmall } from './GameIcon';
export { default as ImageErrorBoundary, withImageErrorBoundary } from './ImageErrorBoundary';
export { default as OptimizedImage, LazyImage, OptimizedAvatar, useImagePreloader } from './OptimizedImage';
export { default as OptimizedImageAdvanced, OptimizedImageGallery, useImagePreloader as useImagePreloaderAdvanced } from './OptimizedImageAdvanced';
export { default as TeamLogo } from './TeamLogo';

// Componentes de Juego y Estadísticas
export { default as GameSelector } from './GameSelector';
export { default as GameStatsCard } from './GameStatsCard';
export { default as MatchCard } from './MatchCard';
export { default as MatchGames } from './MatchGames';
export { default as MatchHeader } from './MatchHeader';
export { default as MatchLineups } from './MatchLineups';
export { default as MatchStatus } from './MatchStatus';
export { default as MatchStreams } from './MatchStreams';
export { default as LiveBadge } from './LiveBadge';
export { default as LiveScoreTicker } from './LiveScoreTicker';
export { default as Countdown } from './Countdown';
export { default as PredictionSystem } from './PredictionSystem';

// Componentes de UI y Layout
export { default as Header } from './Header';
export { default as Footer } from './Footer';
export { default as ThemeToggle } from './ThemeToggle';
export { default as ScrollToTop } from './ScrollToTop';
export { default as Spinner } from './Spinner';
export { default as Star } from './Star';
export { default as Tooltip } from './Tooltip';

// Componentes de Búsqueda
export { default as Search } from './Search';
export { default as SearchLazy } from './SearchLazy';
export { default as TeamSearch } from './TeamSearch';

// Componentes de Autenticación y Usuario
export { default as AuthComponent } from './AuthComponent';
export { default as TeamFollowSystem } from './TeamFollowSystem';

// Componentes de Notificaciones y Chat
export { default as NotificationSystem } from './NotificationSystem';
export { default as ChatBot } from './ChatBot';

// Componentes de Optimización
export { default as SEOOptimizer } from './SEOOptimizer';
export { default as LoadingOptimized } from './LoadingOptimized';

// Componentes de Skeleton
export { MatchSkeleton, TournamentSkeleton, TeamSkeleton, PlayerSkeleton } from './Skeleton';

// ============================================================================
// Re-exports de Subdirectorios
// ============================================================================

// Componentes de Jugador (Player)
export {
  PlayerHeroSectionLazy,
  PlayerAchievementsLazy,
  PlayerMediaGalleryLazy,
  PlayerStatsProgressiveLazy,
  PlayerMatchesLazy,
  PlayerProfileSkeleton,
} from './player';
