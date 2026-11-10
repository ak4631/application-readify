import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  detectAndSaveLocation,
  fetchSavedLocation,
  hasLocationPermission,
  isLocationCleared,
  type SavedLocation,
} from '../lib/location';

export const locationPromptKey = (userId: string) =>
  `vriddhora:location-prompt:${userId}`;

export function shouldDetectLocation(
  saved: SavedLocation | null,
  prompted: boolean,
  now = Date.now(),
) {
  if (saved?.source === 'manual') return false;
  if (!saved) return !prompted;
  const age = now - Date.parse(saved.updated_at);
  return !Number.isFinite(age) || age > 10 * 60 * 1000;
}

export function useDiscoveryLocation(userId?: string) {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const attempted = useRef(false);
  const loaded = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setLoading(false);
        return;
      }
      let active = true;
      if (!loaded.current) setLoading(true);
      setMessage('');
      (async () => {
        const saved = await fetchSavedLocation(userId);
        if (!active) return;
        setLocation(previous =>
          previous?.latitude === saved?.latitude &&
          previous?.longitude === saved?.longitude &&
          previous?.address === saved?.address &&
          previous?.source === saved?.source
            ? previous
            : saved,
        );
        if (await isLocationCleared(userId)) return;
        if (attempted.current) return;
        attempted.current = true;
        const prompted = await AsyncStorage.getItem(locationPromptKey(userId));
        if (!active || !shouldDetectLocation(saved, !!prompted)) return;
        if (prompted && !(await hasLocationPermission())) return;
        await AsyncStorage.setItem(locationPromptKey(userId), 'true');
        const detected = await detectAndSaveLocation(userId, () => active);
        if (active && detected) setLocation(detected);
      })()
        .catch((error: Error) => {
          if (active)
            setMessage(
              error.message.startsWith('Location access')
                ? error.message
                : 'Could not detect your location. Choose an area manually or try GPS again.',
            );
        })
        .finally(() => {
          if (active) {
            loaded.current = true;
            setLoading(false);
          }
        });
      return () => {
        active = false;
      };
    }, [userId]),
  );
  return { location, loading, message };
}
