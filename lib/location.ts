import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { supabase } from './supabase';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function requestLocationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  }

  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve('granted'),
      () => resolve('denied'),
    );
  });
}

export function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

export type SavedLocation = {
  latitude: number;
  longitude: number;
  address: string | null;
  source: 'gps' | 'manual';
  permission_status: PermissionStatus;
  updated_at: string;
};

export async function fetchSavedLocation(userId: string): Promise<SavedLocation | null> {
  const { data, error } = await supabase
    .from('user_locations')
    .select('latitude, longitude, address, source, permission_status, updated_at')
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
}
