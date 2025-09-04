"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, CustomError, ErrorType, ErrorSeverity } from '../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Usar el sistema centralizado de manejo de errores
    const customError = new CustomError(
      error.message,
      ErrorType.CLIENT,
      ErrorSeverity.HIGH,
      'REACT_ERROR_BOUNDARY',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId
      }
    );
    
    errorHandler.handleError(customError, 'React Error Boundary');
    
    // Llamar callback personalizado si se proporciona
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  private handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    const issueData = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Aquí podrías abrir un modal de reporte o enviar a un sistema de tickets
    console.log('Datos del error para reporte:', issueData);
    
    // Ejemplo: copiar al portapapeles
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(issueData, null, 2))
        .then(() => alert('Información del error copiada al portapapeles'))
        .catch(() => console.error('Error al copiar al portapapeles'));
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-4 text-red-400">¡Oops! Algo salió mal</h1>
            <p className="text-gray-300 mb-2">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado automáticamente.
            </p>
            
            {this.state.errorId && (
              <p className="text-sm text-gray-500 mb-6">
                ID del error: <code className="bg-gray-800 px-2 py-1 rounded">{this.state.errorId}</code>
              </p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button 
                onClick={this.handleRetry}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reintentar
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ir al inicio
              </button>
            </div>
            
            <button 
              onClick={this.handleReportIssue}
              className="text-sm text-gray-400 hover:text-white transition-colors underline"
            >
              Reportar este problema
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors">
                  Detalles del error (desarrollo)
                </summary>
                <div className="mt-2 p-4 bg-gray-900 rounded-lg text-xs overflow-auto max-h-60">
                  <div className="mb-4">
                    <h4 className="text-red-300 font-semibold mb-2">Error:</h4>
                    <pre className="text-red-300 whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  </div>
                  
                  {this.state.error.stack && (
                    <div className="mb-4">
                      <h4 className="text-yellow-300 font-semibold mb-2">Stack Trace:</h4>
                      <pre className="text-yellow-300 whitespace-pre-wrap text-xs">{this.state.error.stack}</pre>
                    </div>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-blue-300 font-semibold mb-2">Component Stack:</h4>
                      <pre className="text-blue-300 whitespace-pre-wrap text-xs">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para manejo de errores en componentes funcionales
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Error handled:', error, errorInfo);
    
    // Enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // Implementar logging service
    }
  };

  return { handleError };
};
