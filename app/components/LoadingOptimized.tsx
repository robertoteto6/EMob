'use client';

import React, { memo } from 'react';
import { cn } from '../lib/utils';

// Componente base de skeleton
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton = memo<SkeletonProps>(({ 
  className, 
  variant = 'text', 
  width, 
  height, 
  animation = 'pulse' 
}) => {
  const baseClasses = 'bg-gray-300 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };
  
  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Skeleton para tarjetas de partidos
export const MatchCardSkeleton = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-3">
      <Skeleton variant="text" width={80} height={16} />
      <Skeleton variant="circular" width={24} height={24} />
    </div>
    
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={100} height={20} />
      </div>
      
      <div className="text-center">
        <Skeleton variant="text" width={60} height={24} />
        <Skeleton variant="text" width={80} height={14} className="mt-1" />
      </div>
      
      <div className="flex items-center space-x-3">
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </div>
    
    <div className="flex justify-between items-center">
      <Skeleton variant="text" width={120} height={16} />
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  </div>
));

MatchCardSkeleton.displayName = 'MatchCardSkeleton';

// Skeleton para lista de equipos
export const TeamListSkeleton = memo(() => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width={150} height={20} />
          <Skeleton variant="text" width={100} height={16} className="mt-2" />
        </div>
        <div className="text-right">
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="text" width={80} height={14} className="mt-1" />
        </div>
      </div>
    ))}
  </div>
));

TeamListSkeleton.displayName = 'TeamListSkeleton';

// Skeleton para perfil de jugador
export const PlayerProfileSkeleton = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-start space-x-6 mb-6">
      <Skeleton variant="circular" width={80} height={80} />
      <div className="flex-1">
        <Skeleton variant="text" width={200} height={28} />
        <Skeleton variant="text" width={150} height={20} className="mt-2" />
        <Skeleton variant="text" width={120} height={16} className="mt-2" />
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="text-center">
          <Skeleton variant="text" width={60} height={24} className="mx-auto" />
          <Skeleton variant="text" width={80} height={16} className="mt-1 mx-auto" />
        </div>
      ))}
    </div>
    
    <div className="space-y-3">
      <Skeleton variant="text" width={120} height={20} />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex justify-between items-center">
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="text" width={60} height={16} />
        </div>
      ))}
    </div>
  </div>
));

PlayerProfileSkeleton.displayName = 'PlayerProfileSkeleton';

// Skeleton para tabla de torneos
export const TournamentTableSkeleton = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton variant="text" width={150} height={24} />
    </div>
    
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" width={32} height={32} />
            <div>
              <Skeleton variant="text" width={120} height={18} />
              <Skeleton variant="text" width={80} height={14} className="mt-1" />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Skeleton variant="text" width={60} height={16} />
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="rounded" width={70} height={28} />
          </div>
        </div>
      ))}
    </div>
  </div>
));

TournamentTableSkeleton.displayName = 'TournamentTableSkeleton';

// Skeleton para estadísticas
export const StatsSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={40} height={16} />
        </div>
        <Skeleton variant="text" width={80} height={28} />
        <Skeleton variant="text" width={100} height={14} className="mt-1" />
      </div>
    ))}
  </div>
));

StatsSkeleton.displayName = 'StatsSkeleton';

// Componente de loading con diferentes variantes
interface LoadingProps {
  variant?: 'matches' | 'teams' | 'player' | 'tournament' | 'stats' | 'custom';
  count?: number;
  className?: string;
  children?: React.ReactNode;
}

export const LoadingOptimized = memo<LoadingProps>(({ 
  variant = 'matches', 
  count = 3, 
  className,
  children 
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'matches':
        return Array.from({ length: count }).map((_, index) => (
          <MatchCardSkeleton key={index} />
        ));
      
      case 'teams':
        return <TeamListSkeleton />;
      
      case 'player':
        return <PlayerProfileSkeleton />;
      
      case 'tournament':
        return <TournamentTableSkeleton />;
      
      case 'stats':
        return <StatsSkeleton />;
      
      case 'custom':
        return children;
      
      default:
        return Array.from({ length: count }).map((_, index) => (
          <MatchCardSkeleton key={index} />
        ));
    }
  };

  return (
    <div className={cn('animate-pulse', className)} role="status" aria-label="Cargando contenido">
      {renderSkeleton()}
    </div>
  );
});

LoadingOptimized.displayName = 'LoadingOptimized';

// Spinner optimizado
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner = memo<SpinnerProps>(({ 
  size = 'md', 
  color = 'primary', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
});

Spinner.displayName = 'Spinner';

// Loading con overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LoadingOverlay = memo<LoadingOverlayProps>(({ 
  isLoading, 
  children, 
  className,
  spinnerSize = 'lg'
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Spinner size={spinnerSize} />
        </div>
      )}
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

export { Skeleton };
export default LoadingOptimized;