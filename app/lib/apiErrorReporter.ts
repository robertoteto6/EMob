// Simple error reporter for server-side API calls
// Logs structured errors to console and, in development, appends to a local file.

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
}

export function reportApiError(report: ApiErrorReport) {
  const entry = {
    level: 'error',
    category: 'external_api',
    ...report,
  };

  // Always log to console for visibility
  try {
    // eslint-disable-next-line no-console
    console.error('[API ERROR]', JSON.stringify(entry));
  } catch {
    // Fallback if JSON stringify fails
    // eslint-disable-next-line no-console
    console.error('[API ERROR]', entry);
  }

  // In development, try to persist locally to aid debugging
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

