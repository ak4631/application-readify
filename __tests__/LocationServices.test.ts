import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  requestLocationPermission,
  detectAndSaveLocation,
} from '../lib/location';
import { searchAddress, reverseGeocode } from '../lib/geocoding';

const request = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = request;
  jest.replaceProperty(Platform, 'OS', 'android');
});
afterEach(() => jest.restoreAllMocks());

test('Android approximate location is sufficient for locality discovery', async () => {
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
    [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]:
      PermissionsAndroid.RESULTS.DENIED,
    [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]:
      PermissionsAndroid.RESULTS.GRANTED,
  } as Awaited<ReturnType<typeof PermissionsAndroid.requestMultiple>>);
  expect(await requestLocationPermission()).toBe('granted');
});

test('denied permission does not request GPS or write a location', async () => {
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockResolvedValue({
    [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]:
      PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
    [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]:
      PermissionsAndroid.RESULTS.DENIED,
  } as Awaited<ReturnType<typeof PermissionsAndroid.requestMultiple>>);
  await expect(detectAndSaveLocation('customer')).rejects.toThrow(
    'Location access is off',
  );
  expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
  expect(request).not.toHaveBeenCalled();
});

test('locality names are shown ahead of the broader city and state', async () => {
  request.mockResolvedValue({
    ok: true,
    json: async () => ({
      display_name: 'A long street address',
      address: {
        neighbourhood: 'Sector 7',
        suburb: 'Rohini',
        city: 'Delhi',
        state: 'Delhi',
      },
    }),
  });
  expect(await reverseGeocode(28.7, 77.1)).toBe('Sector 7, Delhi');
});

test('manual address matches closest to the selected location come first', async () => {
  request.mockResolvedValue({
    ok: true,
    json: async () => [
      { display_name: 'Mumbai match', lat: '19.07', lon: '72.87' },
      { display_name: 'Delhi match', lat: '28.7', lon: '77.1' },
    ],
  });
  const results = await searchAddress('area', {
    latitude: 28.71,
    longitude: 77.11,
  });
  expect(results.map(result => result.label)).toEqual([
    'Delhi match',
    'Mumbai match',
  ]);
});
