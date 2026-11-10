import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import CategoryPicker from '../components/CategoryPicker';
import PurchasePicker from '../components/PurchasePicker';
import { fetchPlans } from '../lib/plans';

let mockCategory = 'gym';
let mockCatalogError = false;
let mockEnabledCategories = ['library'];
const mockRetry = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({
    params: {
      libraryId: 'venue',
      libraryName: 'Venue',
      category: mockCategory,
    },
  }),
}));
jest.mock('../hooks/useServiceCatalog', () => ({
  useServiceCatalog: () => ({
    loading: false,
    error: mockCatalogError,
    enabled: (id: string) => mockEnabledCategories.includes(id),
    retry: mockRetry,
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

beforeEach(() => {
  jest.clearAllMocks();
  mockCategory = 'gym';
  mockCatalogError = false;
  mockEnabledCategories = ['library'];
});

test('all four categories are discoverable and unlaunched categories are clearly identified', async () => {
  const select = jest.fn();
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(
      <CategoryPicker
        selected="all"
        onSelect={select}
        enabled={id => id === 'library'}
        loading={false}
      />,
    );
  });
  const tabs = screen.root.findAllByType(TouchableOpacity);
  expect(tabs.map(tab => tab.props.accessibilityLabel)).toEqual([
    'All spaces',
    'Libraries',
    'Gyms, coming soon',
    'Co-working Spaces, coming soon',
    'Exam Hubs, coming soon',
  ]);
  await act(async () => {
    tabs[2].props.onPress();
  });
  expect(select).toHaveBeenCalledWith('gym');
  await act(async () => screen.unmount());
});

test.each(['gym', 'co_working_space', 'exam_hub'])(
  'unlaunched %s does not load purchase plans or expose checkout',
  async category => {
    mockCategory = category;
    let screen!: Renderer.ReactTestRenderer;
    await act(async () => {
      screen = Renderer.create(<PurchasePicker kind="flex" />);
    });
    const text = screen.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat()
      .join(' ');
    expect(text).toContain('coming soon');
    expect(text).not.toContain('Review booking');
    expect(fetchPlans).not.toHaveBeenCalled();
    await act(async () => screen.unmount());
  },
);

test('catalog failure shows retry instead of incorrectly claiming a service is coming soon', async () => {
  mockCatalogError = true;
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<PurchasePicker kind="flex" />);
  });
  const retry = screen.root
    .findAllByType(TouchableOpacity)
    .find(button =>
      button
        .findAllByType(Text)
        .some(text => text.props.children === 'Try again'),
    )!;
  await act(async () => retry.props.onPress());
  expect(mockRetry).toHaveBeenCalledTimes(1);
  expect(fetchPlans).not.toHaveBeenCalled();
  await act(async () => screen.unmount());
});

test.each(['library', 'gym', 'co_working_space', 'exam_hub'])(
  'enabled %s uses the shared plan flow',
  async category => {
    mockCategory = category;
    mockEnabledCategories = [category];
    let screen!: Renderer.ReactTestRenderer;
    await act(async () => {
      screen = Renderer.create(<PurchasePicker kind="flex" />);
    });
    expect(fetchPlans).toHaveBeenCalledWith('venue');
    const texts = screen.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat()
      .join(' ');
    expect(texts).toContain('Review booking');
    expect(texts).not.toContain('coming soon');
    await act(async () => screen.unmount());
  },
);
