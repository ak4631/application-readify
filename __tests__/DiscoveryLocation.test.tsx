import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDiscoveryLocation } from '../hooks/useDiscoveryLocation';
import {
  detectAndSaveLocation,
  fetchSavedLocation,
  isLocationCleared,
  type SavedLocation,
} from '../lib/location';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('../lib/location', () => ({
  fetchSavedLocation: jest.fn(),
  detectAndSaveLocation: jest.fn(),
  hasLocationPermission: jest.fn(async () => true),
  isLocationCleared: jest.fn(async () => false),
}));
const gps: SavedLocation = {
  latitude: 28.7,
  longitude: 77.1,
  address: 'Rohini, Delhi',
  source: 'gps',
  permission_status: 'granted',
  updated_at: new Date().toISOString(),
};
let latest: ReturnType<typeof useDiscoveryLocation>;
function Probe() {
  latest = useDiscoveryLocation('customer');
  return null;
}
beforeEach(() => {
  jest.clearAllMocks();
  (isLocationCleared as jest.Mock).mockResolvedValue(false);
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (fetchSavedLocation as jest.Mock).mockResolvedValue(null);
  (detectAndSaveLocation as jest.Mock).mockResolvedValue(gps);
});

test('first landing detects and stores the current locality', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<Probe />);
  });
  expect(detectAndSaveLocation).toHaveBeenCalledWith(
    'customer',
    expect.any(Function),
  );
  expect(latest.location?.address).toBe('Rohini, Delhi');
  expect(latest.loading).toBe(false);
  await act(async () => screen.unmount());
});

test('a manually selected location survives landing without GPS overwriting it', async () => {
  (fetchSavedLocation as jest.Mock).mockResolvedValue({
    ...gps,
    source: 'manual',
  });
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<Probe />);
  });
  expect(latest.location?.source).toBe('manual');
  expect(detectAndSaveLocation).not.toHaveBeenCalled();
  await act(async () => screen.unmount());
});

test('declined location access does not repeatedly prompt on the next landing', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<Probe />);
  });
  expect(detectAndSaveLocation).not.toHaveBeenCalled();
  expect(latest.location).toBeNull();
  expect(latest.loading).toBe(false);
  await act(async () => screen.unmount());
});

test('GPS failure preserves the last known locality and offers manual selection', async () => {
  (fetchSavedLocation as jest.Mock).mockResolvedValue({
    ...gps,
    updated_at: '2020-01-01T00:00:00Z',
  });
  (detectAndSaveLocation as jest.Mock).mockRejectedValue(
    new Error('GPS timeout'),
  );
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<Probe />);
  });
  expect(latest.location?.address).toBe('Rohini, Delhi');
  expect(latest.message).toContain('Choose an area manually');
  await act(async () => screen.unmount());
});

test('cleared location stays empty without automatic GPS restoring it', async () => {
  (isLocationCleared as jest.Mock).mockResolvedValue(true);
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<Probe />);
  });
  expect(latest.location).toBeNull();
  expect(detectAndSaveLocation).not.toHaveBeenCalled();
  await act(async () => screen.unmount());
});
