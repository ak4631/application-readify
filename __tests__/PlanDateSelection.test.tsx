import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import PurchasePicker from '../components/PurchasePicker';
import { darkColors } from '../constants/colors';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({
    params: { libraryId: 'venue', libraryName: 'Venue', category: 'library' },
  }),
}));
jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    mode: 'dark',
    colors: require('../constants/colors').darkColors,
  }),
}));
jest.mock('../hooks/useServiceCatalog', () => ({
  useServiceCatalog: () => ({
    loading: false,
    error: false,
    enabled: () => true,
  }),
}));
jest.mock('../lib/plans', () => ({
  fetchPlans: jest.fn(async () => []),
  formatPlanDuration: jest.fn(),
}));
jest.mock('../lib/libraryAvailability', () => ({
  toLocalDateId: (date: Date) => date.toISOString().slice(0, 10),
  fetchPurchaseOptions: jest.fn(),
}));

test('selected date has a solid contrasting fill, white text and selected accessibility state in dark mode', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<PurchasePicker kind="flex" />);
  });
  const dates = () =>
    screen.root
      .findAllByType(TouchableOpacity)
      .filter(button =>
        button.props.accessibilityLabel?.startsWith('Start date'),
      );
  const first = dates()[0];
  expect(first.props.accessibilityState.selected).toBe(true);
  expect(StyleSheet.flatten(first.props.style).backgroundColor).toBe(
    darkColors.primary,
  );
  expect(StyleSheet.flatten(first.findByType(Text).props.style).color).toBe(
    darkColors.onPrimary,
  );
  await act(async () => dates()[1].props.onPress());
  expect(dates()[0].props.accessibilityState.selected).toBe(false);
  expect(dates()[1].props.accessibilityState.selected).toBe(true);
  expect(StyleSheet.flatten(dates()[1].props.style).backgroundColor).toBe(
    darkColors.primary,
  );
  await act(async () => screen.unmount());
});
