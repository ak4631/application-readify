import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearUserLocation,
  fetchSavedLocation,
  isLocationCleared,
  saveUserLocation,
} from '../lib/location';
import { supabase } from '../lib/supabase';

const storage = new Map<string, string>();
const upsert = jest.fn();
const from = jest.fn(() => ({ upsert }));
beforeEach(() => {
  jest.clearAllMocks();
  storage.clear();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async key => storage.get(key) ?? null,
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    storage.set(key, value);
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async key => {
    storage.delete(key);
  });
  Object.assign(supabase, { from });
  upsert.mockResolvedValue({ error: null });
});

test('clearing a selected location prevents the saved account row being used on this device', async () => {
  await clearUserLocation('customer');
  expect(await fetchSavedLocation('customer')).toBeNull();
  expect(from).not.toHaveBeenCalled();
  expect(await isLocationCleared('another-customer')).toBe(false);
});

test('selecting another location restores discovery after clearing', async () => {
  await clearUserLocation('customer');
  await saveUserLocation('customer', {
    latitude: 28.7,
    longitude: 77.1,
    address: 'Rohini',
    source: 'manual',
    permissionStatus: 'undetermined',
  });
  expect(upsert).toHaveBeenCalledWith(
    expect.objectContaining({ user_id: 'customer', address: 'Rohini' }),
  );
  expect(await isLocationCleared('customer')).toBe(false);
});
