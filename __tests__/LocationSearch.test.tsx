import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import LocationPermissionScreen from '../screens/LocationPermissionScreen';
import { searchAddress } from '../lib/geocoding';
import {
  detectAndSaveLocation,
  clearUserLocation,
  fetchSavedLocation,
  saveUserLocation,
} from '../lib/location';

const mockSession = { user: { id: 'customer' } };
const mockNavigation = {
  goBack: jest.fn(),
  replace: jest.fn(),
  canGoBack: () => true,
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: { returnTo: 'Home' } }),
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: mockSession }),
}));
jest.mock('../lib/geocoding', () => ({ searchAddress: jest.fn() }));
jest.mock('../lib/location', () => ({
  fetchSavedLocation: jest.fn(),
  saveUserLocation: jest.fn(),
  detectAndSaveLocation: jest.fn(),
  clearUserLocation: jest.fn(),
  locationLabel: () => 'Rohini, Delhi',
}));
const saved = {
  latitude: 28.7,
  longitude: 77.1,
  source: 'manual',
  address: 'Rohini, Delhi',
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (fetchSavedLocation as jest.Mock).mockResolvedValue(saved);
  (saveUserLocation as jest.Mock).mockResolvedValue(undefined);
  (searchAddress as jest.Mock).mockResolvedValue([]);
  (detectAndSaveLocation as jest.Mock).mockResolvedValue({
    ...saved,
    source: 'gps',
  });
});
afterEach(() => jest.useRealTimers());

test('debounces address search, ignores stale responses, and saves the selected area', async () => {
  let oldResponse!: (value: unknown) => void;
  (searchAddress as jest.Mock).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        oldResponse = resolve;
      }),
  );
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<LocationPermissionScreen />);
  });
  const input = screen.root.findByType(TextInput);
  await act(async () => input.props.onChangeText('Rohini'));
  expect(searchAddress).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(350));
  const result = {
    label: 'Pitampura, Delhi',
    latitude: 28.69,
    longitude: 77.13,
  };
  (searchAddress as jest.Mock).mockResolvedValueOnce([result]);
  await act(async () => input.props.onChangeText('Pitampura'));
  await act(async () => jest.advanceTimersByTime(350));
  await act(async () =>
    oldResponse([{ label: 'Old response', latitude: 1, longitude: 1 }]),
  );
  expect(
    screen.root
      .findAllByType(Text)
      .some(text => text.props.children === 'Old response'),
  ).toBe(false);
  const resultButton = screen.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === result.label),
    )!;
  await act(async () => resultButton.props.onPress());
  expect(saveUserLocation).toHaveBeenCalledWith(
    'customer',
    expect.objectContaining({
      address: result.label,
      source: 'manual',
      latitude: result.latitude,
    }),
  );
  expect(mockNavigation.goBack).toHaveBeenCalled();
  await act(async () => screen.unmount());
});

test('reset replaces a manual location with a fresh GPS location', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<LocationPermissionScreen />);
  });
  const reset = screen.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Reset to current location'),
    )!;
  await act(async () => reset.props.onPress());
  expect(detectAndSaveLocation).toHaveBeenCalledWith(
    'customer',
    expect.any(Function),
  );
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  await act(async () => screen.unmount());
});

test('clear selected location removes the device selection and returns to discovery', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<LocationPermissionScreen />);
  });
  const clear = screen.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Clear selected location'),
    )!;
  await act(async () => clear.props.onPress());
  expect(clearUserLocation).toHaveBeenCalledWith('customer');
  expect(detectAndSaveLocation).not.toHaveBeenCalled();
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  await act(async () => screen.unmount());
});

test('map discovery is available inside the location picker', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<LocationPermissionScreen />);
  });
  const map = screen.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'View map'),
    )!;
  await act(async () => map.props.onPress());
  expect(mockNavigation.replace).toHaveBeenCalledWith('Map', {
    initialCategory: 'all',
  });
  await act(async () => screen.unmount());
});
