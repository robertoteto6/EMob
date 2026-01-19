// Enhanced error reporter for server-side API calls
// Logs structured errors to console and external services in production

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ApiErrorReport {
  service: string; // e.g., 'pandascore'
  url: string;
  status?: number;
  ok?: boolean;
  method?: string;
  params?: Record<string, string> | string;
  message: string;
  bodySnippet?: string;
  tokenTail?: string; // last 4 chars of token used, if applicable
  timestamp: string;
  userAgent?: string;
  ip?: string;
  duration?: number; // request duration in ms
  retryCount?: number;
}

// External logging service (can be configured for production)
async function sendToExternalLogger(entry: any): Promise<void> {
  // In production, you might want to send to services like:
  // - Vercel Analytics
  // - Sentry
  // - DataDog
  // - Custom logging service

  if (process.env.LOGGING_ENDPOINT && typeof window === 'undefined') {
    try {
      await fetch(process.env.LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOGGING_TOKEN || ''}`,
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Silently fail to avoid cascading errors
      console.warn('Failed to send log to external service:', error);
    }
  }
}

export function reportApiError(report: ApiErrorReport) {
  const entry = {
    level: 'error',
    category: 'external_api',
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version || 'unknown',
    ...report,
  };

  // Always log to console for visibility
  try {
    // eslint-disable-next-line no-console
    console.error('[API ERROR]', JSON.stringify(entry, null, 2));
  } catch {
    // Fallback if JSON stringify fails
    // eslint-disable-next-line no-console
    console.error('[API ERROR]', entry);
  }

  // Send to external logging service in production
  if (process.env.NODE_ENV === 'production') {
    sendToExternalLogger(entry).catch(() => {
      // Ignore errors to avoid cascading failures
    });
  }

  // In development, persist locally to aid debugging
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path') as typeof import('path');
      const logsDir = path.join(process.cwd(), 'logs');
      const filePath = path.join(logsDir, 'api-errors.log');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
      fs.appendFileSync(filePath, `${new Date().toISOString()} ${JSON.stringify(entry)}\n`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to write API error log file:', e);
    }
  }
}

// Success logging for monitoring API health
export function reportApiSuccess(service: string, url: string, duration: number, status: number) {
  const entry = {
    level: 'info',
    category: 'external_api_success',
    service,
    url,
    status,
    duration,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  };

  // Log successful requests in development or with verbose logging
  if (process.env.NODE_ENV === 'development' || process.env.API_VERBOSE_LOGGING === 'true') {
    // eslint-disable-next-line no-console
    console.log('[API SUCCESS]', JSON.stringify(entry));
  }

  // Send to external logging in production for monitoring
  if (process.env.NODE_ENV === 'production' && process.env.LOGGING_ENDPOINT) {
    sendToExternalLogger(entry).catch(() => {
      // Ignore errors
    });
  }
}

