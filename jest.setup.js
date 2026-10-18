/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('@maplibre/maplibre-react-native', () => ({
  Map: 'Map',
  Camera: 'Camera',
  Marker: 'Marker',
  PointAnnotation: 'PointAnnotation',
}));
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(),
  setRNConfiguration: jest.fn(),
}));
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));
