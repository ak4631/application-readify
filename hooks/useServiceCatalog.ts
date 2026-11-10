import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export function useServiceCatalog() {
  const hasData = useRef(false);
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [catalogError, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(!hasData.current);
      setError(false);
      Promise.resolve(supabase.from('service_catalog').select('id, enabled'))
        .then(({ data, error }) => {
          if (!active) return;
          hasData.current = !error;
          setError(!!error);
          setServices(
            error
              ? {}
              : Object.fromEntries(
                  (data ?? []).map(row => [row.id, row.enabled === true]),
                ),
          );
          setLoading(false);
        })
        .catch(() => {
          if (active) {
            hasData.current = false;
            setError(true);
            setLoading(false);
            setServices({});
          }
        });
      return () => {
        active = false;
      };
      // Retrying must restart the focused request without changing its query.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt]),
  );
  return {
    enabled: (id: string) => services[id] === true,
    loading,
    error: catalogError,
    retry: () => setAttempt(value => value + 1),
  };
}
