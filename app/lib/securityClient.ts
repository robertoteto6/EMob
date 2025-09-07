"use client";

import { useEffect, useState } from "react";

// Hook para obtener token CSRF en el cliente
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCSRFToken(data.token))
      .catch(err => console.error('Error getting CSRF token:', err));
  }, []);

  return csrfToken;
}

// Función para hacer requests seguros con CSRF desde el cliente
export async function secureRequest(url: string, options: RequestInit = {}) {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
