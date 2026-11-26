import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ApiResourceState<T> = {
  loading: boolean;
  data: T | null;
  error: string | null;
};

export function useApiResource<T>(path: string): ApiResourceState<T> {
  const [state, setState] = useState<ApiResourceState<T>>({ loading: true, data: null, error: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: null });

    getJson<T>(path)
      .then((data) => {
        if (active) setState({ loading: false, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ loading: false, data: null, error: error instanceof Error ? error.message : String(error) });
      });

    return () => {
      active = false;
    };
  }, [path]);

  return state;
}
