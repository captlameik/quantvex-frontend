/**
 * Custom hooks for API data fetching with proper error handling and loading states
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/apiClient';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseApiOptions {
  immediate?: boolean;
  refreshInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApiData<T>(
  endpoint: string,
  options: UseApiOptions = {}
): ApiState<T> & {
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
} {
  const { immediate = true, refreshInterval } = options;

  // Use refs for callbacks to avoid re-render loops.
  // This is the critical fix: putting onSuccess/onError in the useCallback
  // dependency array caused infinite re-renders because every render created
  // new callback references, which triggered fetchData to change, which
  // triggered useEffect, which called fetchData, which set state, repeat.
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  onSuccessRef.current = options.onSuccess;
  onErrorRef.current = options.onError;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
    lastUpdated: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiFetch<T>(endpoint);
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
      onSuccessRef.current?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      onErrorRef.current?.(errorMessage);
    }
  }, [endpoint]);

  const refetch = useCallback(() => fetchData(), [fetchData]);
  
  const mutate = useCallback((newData: T) => {
    setState({
      data: newData,
      loading: false,
      error: null,
      lastUpdated: new Date(),
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchData]);

  return {
    ...state,
    refetch,
    mutate,
  };
}

export function usePaginatedApiData<T>(
  endpoint: string,
  initialPage = 1,
  pageSize = 10
) {
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  
  const paginatedEndpoint = `${endpoint}?page=${page}&limit=${pageSize}`;
  const { data, loading, error, refetch } = useApiData<{
    items: T[];
    page: number;
    totalPages: number;
    total: number;
  }>(paginatedEndpoint);

  useEffect(() => {
    if (data) {
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
  }, [data]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const goToPage = useCallback((targetPage: number) => {
    if (targetPage >= 1 && targetPage <= totalPages) {
      setPage(targetPage);
    }
  }, [totalPages]);

  return {
    items: data?.items || [],
    page,
    totalPages,
    total,
    loading,
    error,
    refetch,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function useRealtimeData<T>(
  endpoint: string,
  enabled = true
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // For now, use polling. In production, replace with WebSocket
    const interval = setInterval(async () => {
      try {
        const newData = await apiFetch<T>(endpoint);
        setData(newData);
        setError(null);
        setIsConnected(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection error';
        setError(errorMessage);
        setIsConnected(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [endpoint, enabled]);

  return {
    data,
    error,
    isConnected,
  };
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
