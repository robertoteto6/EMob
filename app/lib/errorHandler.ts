// Sistema centralizado de manejo de errores

import { ApiResponse } from './types';

// ============================================================================
// TIPOS DE ERROR
// ============================================================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string | number;
  details?: any;
  timestamp: number;
  stack?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

// ============================================================================
// CLASE DE ERROR PERSONALIZADA
// ============================================================================

export class CustomError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string | number;
  public readonly details?: any;
  public readonly timestamp: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string | number,
    details?: any
  ) {
    super(message);
    this.name = 'CustomError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Mantener el stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }

  toJSON(): AppError {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    };
  }
}

// ============================================================================
// UTILIDADES DE ERROR
// ============================================================================

/**
 * Determina el tipo de error basado en el error original
 */
export function determineErrorType(error: any): ErrorType {
  if (error instanceof CustomError) {
    return error.type;
  }

  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return ErrorType.NETWORK;
  }

  if (error?.status === 401 || error?.code === 'UNAUTHORIZED') {
    return ErrorType.AUTHENTICATION;
  }

  if (error?.status === 403 || error?.code === 'FORBIDDEN') {
    return ErrorType.AUTHORIZATION;
  }

  if (error?.status === 404 || error?.code === 'NOT_FOUND') {
    return ErrorType.NOT_FOUND;
  }

  if (error?.status === 429 || error?.code === 'RATE_LIMIT') {
    return ErrorType.RATE_LIMIT;
  }

  if (error?.status >= 400 && error?.status < 500) {
    return ErrorType.CLIENT;
  }

  if (error?.status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Determina la severidad del error
 */
export function determineErrorSeverity(error: any): ErrorSeverity {
  if (error instanceof CustomError) {
    return error.severity;
  }

  const type = determineErrorType(error);

  switch (type) {
    case ErrorType.AUTHENTICATION:
    case ErrorType.AUTHORIZATION:
    case ErrorType.SERVER:
      return ErrorSeverity.HIGH;
    
    case ErrorType.NETWORK:
    case ErrorType.API:
      return ErrorSeverity.MEDIUM;
    
    case ErrorType.VALIDATION:
    case ErrorType.NOT_FOUND:
      return ErrorSeverity.LOW;
    
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Normaliza cualquier error a nuestro formato estándar
 */
export function normalizeError(error: any): AppError {
  if (error instanceof CustomError) {
    return error.toJSON();
  }

  const type = determineErrorType(error);
  const severity = determineErrorSeverity(error);
  const message = error?.message || error?.toString() || 'Error desconocido';
  const code = error?.status || error?.code;

  return {
    type,
    severity,
    message,
    code,
    details: error,
    timestamp: Date.now(),
    stack: error?.stack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  };
}

// ============================================================================
// MANEJADOR GLOBAL DE ERRORES
// ============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;
  private reportingEndpoint = '/api/errors';
  private enableReporting = process.env.NODE_ENV === 'production';

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Configura los manejadores globales de errores
   */
  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Errores de JavaScript no capturados
    window.addEventListener('error', (event) => {
      const error = new CustomError(
        event.message,
        ErrorType.CLIENT,
        ErrorSeverity.HIGH,
        undefined,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
      this.handleError(error);
    });

    // Promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      const error = new CustomError(
        event.reason?.message || 'Promesa rechazada no manejada',
        ErrorType.CLIENT,
        ErrorSeverity.HIGH,
        undefined,
        event.reason
      );
      this.handleError(error);
    });
  }

  /**
   * Maneja un error de forma centralizada
   */
  public handleError(error: any, context?: string): void {
    const normalizedError = normalizeError(error);
    
    // Agregar contexto si se proporciona
    if (context) {
      normalizedError.details = {
        ...normalizedError.details,
        context
      };
    }

    // Agregar a la cola
    this.addToQueue(normalizedError);

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('Error capturado:', normalizedError);
    }

    // Reportar si está habilitado
    if (this.enableReporting) {
      this.reportError(normalizedError);
    }
  }

  /**
   * Agrega un error a la cola
   */
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    // Mantener el tamaño de la cola
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Reporta un error al servidor
   */
  private async reportError(error: AppError): Promise<void> {
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (reportingError) {
      console.warn('Error al reportar error:', reportingError);
    }
  }

  /**
   * Obtiene los errores de la cola
   */
  public getErrors(): AppError[] {
    return [...this.errorQueue];
  }

  /**
   * Limpia la cola de errores
   */
  public clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * Configura las opciones del manejador
   */
  public configure(options: {
    enableReporting?: boolean;
    reportingEndpoint?: string;
    maxQueueSize?: number;
  }): void {
    if (options.enableReporting !== undefined) {
      this.enableReporting = options.enableReporting;
    }
    if (options.reportingEndpoint) {
      this.reportingEndpoint = options.reportingEndpoint;
    }
    if (options.maxQueueSize) {
      this.maxQueueSize = options.maxQueueSize;
    }
  }
}

// ============================================================================
// UTILIDADES PARA MANEJO DE ERRORES EN APIS
// ============================================================================

/**
 * Wrapper para manejar errores en llamadas a APIs
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<ApiResponse<T>> {
  const errorHandler = ErrorHandler.getInstance();
  
  try {
    const data = await operation();
    return {
      data,
      success: true,
      timestamp: Date.now()
    };
  } catch (error) {
    const normalizedError = normalizeError(error);
    errorHandler.handleError(error, context);
    
    return {
      data: null as any,
      success: false,
      error: normalizedError.message,
      timestamp: Date.now()
    };
  }
}

/**
 * Hook para usar el manejador de errores en componentes React
 */
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();
  
  return {
    handleError: (error: any, context?: string) => errorHandler.handleError(error, context),
    getErrors: () => errorHandler.getErrors(),
    clearErrors: () => errorHandler.clearErrors()
  };
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export const errorHandler = ErrorHandler.getInstance();

export default {
  ErrorType,
  ErrorSeverity,
  CustomError,
  errorHandler,
  withErrorHandling,
  useErrorHandler,
  normalizeError,
  determineErrorType,
  determineErrorSeverity
};