import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export function useAsyncState<T>(initialValue: T) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialValue,
    loading: false,
    error: null
  });

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialValue,
      loading: false,
      error: null
    });
  }, [initialValue]);

  return { ...state, setData, setLoading, setError, reset };
}