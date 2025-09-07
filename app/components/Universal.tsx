"use client";

import React, { useState, useEffect } from 'react';

interface UniversalLoaderProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse' | 'wave';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  message?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

// Componente universal de carga para toda la aplicación
export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  type = 'spinner',
  size = 'md',
  color = '#00FF80',
  message,
  showProgress = false,
  progress = 0,
  className = ''
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (type === 'dots') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [type]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div 
            className={`animate-spin rounded-full border-2 border-transparent ${sizeClasses[size]}`}
            style={{ 
              borderTopColor: color,
              borderRightColor: color,
              filter: `drop-shadow(0 0 4px ${color}30)`
            }}
          >
            <div
              className="absolute inset-2 animate-ping rounded-full opacity-40"
              style={{ backgroundColor: color }}
            />
          </div>
        );

      case 'skeleton':
        return (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            <div className="h-4 bg-gray-600 rounded w-5/6"></div>
          </div>
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full animate-bounce`}
                style={{ 
                  backgroundColor: color,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div 
            className={`animate-pulse rounded-full ${sizeClasses[size]}`}
            style={{ backgroundColor: color, opacity: 0.6 }}
          />
        );

      case 'wave':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 h-8 animate-pulse rounded"
                style={{ 
                  backgroundColor: color,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        {renderLoader()}
      </div>
      
      {message && (
        <div className="text-center">
          <p className="text-gray-300 text-sm">
            {message}
            {type === 'dots' && dots}
          </p>
        </div>
      )}
      
      {showProgress && (
        <div className="w-full max-w-xs">
          <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full transition-all duration-300 ease-out rounded-full"
              style={{ 
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: color
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
};

// Componente de error universal
interface UniversalErrorProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const UniversalError: React.FC<UniversalErrorProps> = ({
  title = "Error",
  message = "Algo salió mal. Por favor, intenta de nuevo.",
  actionLabel = "Reintentar",
  onAction,
  icon,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
        {icon || (
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{message}</p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Componente de estado vacío universal
interface UniversalEmptyProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const UniversalEmpty: React.FC<UniversalEmptyProps> = ({
  title = "Sin resultados",
  message = "No se encontraron elementos.",
  actionLabel,
  onAction,
  icon,
  className = ''
}) => {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/50 rounded-2xl flex items-center justify-center">
        {icon || (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">{message}</p>
      
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Hook para manejo de estados universales
export const useUniversalState = <T,>(initialData?: T) => {
  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const execute = async (asyncFn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);
    
    try {
      const result = await asyncFn();
      setData(result);
      
      // Verificar si está vacío (para arrays o objetos)
      if (Array.isArray(result)) {
        setIsEmpty(result.length === 0);
      } else if (typeof result === 'object' && result !== null) {
        setIsEmpty(Object.keys(result).length === 0);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setLoading(false);
    setError(null);
    setIsEmpty(false);
  };

  return {
    data,
    loading,
    error,
    isEmpty,
    execute,
    reset,
    setData,
    setError
  };
};
