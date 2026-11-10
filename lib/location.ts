import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { supabase } from './supabase';
import { reverseGeocode } from './geocoding';
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearedLocationKey = (userId: string) =>
  `vriddhora:location-cleared:${userId}`;

// Clearing is a device preference; it does not erase the account's saved row.
export async function isLocationCleared(userId: string) {
  return (await AsyncStorage.getItem(clearedLocationKey(userId))) === 'true';
}

export async function clearUserLocation(userId: string) {
  await AsyncStorage.setItem(clearedLocationKey(userId), 'true');
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function requestLocationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);
    return Object.values(result).some(
      value => value === PermissionsAndroid.RESULTS.GRANTED,
    )
      ? 'granted'
      : 'denied';
  }

  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve('granted'),
      () => resolve('denied'),
    );
  });
}

export function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const checks = await Promise.all([
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ),
    PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ),
  ]);
  return checks.some(Boolean);
}

export async function detectAndSaveLocation(
  userId: string,
  isActive = () => true,
): Promise<SavedLocation | null> {
  const permission = await requestLocationPermission();
  if (!isActive()) return null;
  if (permission !== 'granted')
    throw new Error(
      'Location access is off. Choose an area manually or enable location in Settings.',
    );
  const position = await getCurrentPosition();
  const address = await reverseGeocode(
    position.latitude,
    position.longitude,
  ).catch(() => null);
  if (!isActive()) return null;
  await saveUserLocation(userId, {
    ...position,
    address,
    source: 'gps',
    permissionStatus: 'granted',
  });
  return {
    ...position,
    address,
    source: 'gps',
    permission_status: 'granted',
    updated_at: new Date().toISOString(),
  };
}

export function locationLabel(location: SavedLocation | null): string {
  return (
    location?.address?.split(',').slice(0, 2).join(',').trim() ||
    (location ? 'Current location' : 'Choose your location')
  );
}

export type SavedLocation = {
  latitude: number;
  longitude: number;
  address: string | null;
  source: 'gps' | 'manual';
  permission_status: PermissionStatus;
  updated_at: string;
};

export async function fetchSavedLocation(
  userId: string,
): Promise<SavedLocation | null> {
  if (await isLocationCleared(userId)) return null;
  const { data, error } = await supabase
    .from('user_locations')
    .select(
      'latitude, longitude, address, source, permission_status, updated_at',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
  } as SavedLocation;
}

export async function saveUserLocation(
  userId: string,
  input: {
    latitude: number;
    longitude: number;
    address?: string | null;
    source: 'gps' | 'manual';
    permissionStatus: PermissionStatus;
  },
) {
  const { error } = await supabase.from('user_locations').upsert({
    user_id: userId,
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address ?? null,
    source: input.source,
    permission_status: input.permissionStatus,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
  await AsyncStorage.removeItem(clearedLocationKey(userId));
}
