"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary específico para componentes de imagen
 * 
 * Captura errores en componentes hijos y muestra un fallback
 * en lugar de crashar toda la aplicación
 */
export default class ImageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error para debugging
    console.warn("ImageErrorBoundary capturó un error:", error, errorInfo);
    
    // Callback opcional para tracking de errores
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado o default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto para imágenes
      return (
        <div className="flex items-center justify-center bg-gray-800 rounded-lg p-4 min-h-[100px]">
          <div className="text-center">
            <svg 
              className="w-8 h-8 mx-auto text-gray-500 mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-xs text-gray-400">Error al cargar imagen</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para usar el Error Boundary de forma declarativa
 */
export function withImageErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ImageErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ImageErrorBoundary>
    );
  };
}
