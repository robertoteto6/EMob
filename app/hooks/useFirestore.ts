'use client';

import { useState, useEffect, useCallback } from 'react';
import { FirestoreService, FirestoreDocument } from '../lib/firestore';

interface UseFirestoreState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

interface UseFirestoreDocumentState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook para manejar colecciones
export const useFirestoreCollection = <T extends FirestoreDocument>(
  service: FirestoreService<T>,
  realtime: boolean = false
) => {
  const [state, setState] = useState<UseFirestoreState<T>>({
    data: [],
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const documents = await service.getAll();
      setState({ data: documents, loading: false, error: null });
    } catch (error: any) {
      setState({ data: [], loading: false, error: error.message });
    }
  }, [service]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (realtime) {
      const unsubscribe = service.onSnapshot(
        (documents) => {
          setState({ data: documents, loading: false, error: null });
        },
        (error) => {
          setState(prev => ({ ...prev, error: error.message, loading: false }));
        }
      );

      return unsubscribe;
    } else {
      fetchData();
    }
  }, [service, realtime, fetchData]);

  const create = useCallback(async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await service.create(data);
      if (!realtime) {
        refetch();
      }
      return id;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [service, realtime, refetch]);

  const update = useCallback(async (id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>) => {
    try {
      await service.update(id, data);
      if (!realtime) {
        refetch();
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [service, realtime, refetch]);

  const remove = useCallback(async (id: string) => {
    try {
      await service.delete(id);
      if (!realtime) {
        refetch();
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [service, realtime, refetch]);

  return {
    ...state,
    refetch,
    create,
    update,
    remove
  };
};

// Hook para manejar un documento específico
export const useFirestoreDocument = <T extends FirestoreDocument>(
  service: FirestoreService<T>,
  id: string | null,
  realtime: boolean = false
) => {
  const [state, setState] = useState<UseFirestoreDocumentState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const document = await service.getById(id);
      setState({ data: document, loading: false, error: null });
    } catch (error: any) {
      setState({ data: null, loading: false, error: error.message });
    }
  }, [service, id]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    if (realtime) {
      const unsubscribe = service.onDocumentSnapshot(
        id,
        (document) => {
          setState({ data: document, loading: false, error: null });
        },
        (error) => {
          setState(prev => ({ ...prev, error: error.message, loading: false }));
        }
      );

      return unsubscribe;
    } else {
      fetchData();
    }
  }, [service, id, realtime, fetchData]);

  const update = useCallback(async (data: Partial<Omit<T, 'id' | 'createdAt'>>) => {
    if (!id) return;
    
    try {
      await service.update(id, data);
      if (!realtime) {
        refetch();
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [service, id, realtime, refetch]);

  const remove = useCallback(async () => {
    if (!id) return;
    
    try {
      await service.delete(id);
      setState({ data: null, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [service, id]);

  return {
    ...state,
    refetch,
    update,
    remove
  };
};

// Hook para consultas personalizadas
export const useFirestoreQuery = <T extends FirestoreDocument>(
  service: FirestoreService<T>,
  field: string,
  operator: any,
  value: any,
  limitCount?: number,
  enabled: boolean = true
) => {
  const [state, setState] = useState<UseFirestoreState<T>>({
    data: [],
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const documents = await service.getWhere(field, operator, value, limitCount);
      setState({ data: documents, loading: false, error: null });
    } catch (error: any) {
      setState({ data: [], loading: false, error: error.message });
    }
  }, [service, field, operator, value, limitCount, enabled]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch
  };
};
