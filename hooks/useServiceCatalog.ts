import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export function useServiceCatalog() {
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      supabase
        .from('service_catalog')
        .select('id, enabled')
        .then(({ data, error }) => {
          if (!active) return;
          setServices(
            error
              ? {}
              : Object.fromEntries(
                  (data ?? []).map(row => [row.id, row.enabled === true]),
                ),
          );
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  return { enabled: (id: string) => services[id] === true, loading };
}
