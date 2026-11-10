import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainTabs from '../navigation/MainTabs';
import type { MainTabParamList } from '../navigation/types';

const mockMount = jest.fn();
jest.mock('../screens/ExploreScreen', () => {
  const ReactModule = require('react');
  const Native = require('react-native');
  return function ExploreFixture() {
    const [search, setSearch] = ReactModule.useState('');
    ReactModule.useEffect(() => {
      mockMount();
    }, []);
    return ReactModule.createElement(Native.TextInput, {
      value: search,
      onChangeText: setSearch,
    });
  };
});
jest.mock('../screens/BookingsHubScreen', () => 'BookingsFixture');
jest.mock('../screens/ProfileScreen', () => 'ProfileFixture');

test('switching tabs preserves the existing discovery screen and its search', async () => {
  jest.useFakeTimers();
  const navigation = createNavigationContainerRef<MainTabParamList>();
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(
      <SafeAreaProvider>
        <NavigationContainer ref={navigation}>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>,
    );
  });
  await act(async () =>
    screen.root.findByType(TextInput).props.onChangeText('Rohini'),
  );
  await act(async () => {
    navigation.navigate('Bookings');
  });
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  await act(async () => {
    navigation.navigate('Home');
  });
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  expect(screen.root.findByType(TextInput).props.value).toBe('Rohini');
  expect(mockMount).toHaveBeenCalledTimes(1);
  await act(async () => screen.unmount());
  jest.useRealTimers();
});
