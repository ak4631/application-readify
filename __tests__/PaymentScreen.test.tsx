import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import PaymentScreen from '../screens/PaymentScreen';
import { prepareCheckout, fetchCheckoutStatus } from '../lib/checkout';

const mockNavigation = {
  reset: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
};
const mockParams = {
  kind: 'flex',
  libraryId: 'library',
  libraryName: 'Study Library',
  planId: 'day',
  planName: 'Day pass',
  selectedDate: '2030-01-01',
  startTime: '09:00',
  selectedTimeLabel: '09:00 - 13:00 daily',
  days: 2,
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('../lib/checkout', () => ({
  prepareCheckout: jest.fn(),
  fetchCheckoutStatus: jest.fn(),
  newCheckoutKey: () => 'stable-key',
  verifyPayment: jest.fn(),
}));

const prepared = {
  id: 'order',
  status: 'CREATED',
  amountPaise: 10600,
  razorpay: { keyId: 'key', orderId: 'gateway-order', verifyToken: 'verify' },
};
beforeEach(() => {
  jest.clearAllMocks();
  (prepareCheckout as jest.Mock).mockResolvedValue(prepared);
  (fetchCheckoutStatus as jest.Mock).mockResolvedValue({ status: 'CREATED' });
});

test('shows the server total and fee before opening the payment sheet', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<PaymentScreen />);
  });
  const texts = screen.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat()
    .join(' ');
  expect(texts).toContain('106.00');
  expect(texts).toContain('Booking fee');
  expect(texts).toContain('6.00');
  expect(texts).not.toContain('Check payment status');
  expect(fetchCheckoutStatus).toHaveBeenCalledWith('order');
  expect(RazorpayCheckout.open).not.toHaveBeenCalled();
  expect(prepareCheckout).toHaveBeenCalledWith(
    expect.objectContaining({ days: 2, vendorId: 'library' }),
    'stable-key',
  );
  await act(async () => {
    screen.unmount();
  });
});

test('blocks payment when preparation fails and allows a retry', async () => {
  (prepareCheckout as jest.Mock).mockRejectedValueOnce(
    new Error('No seats available'),
  );
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<PaymentScreen />);
  });
  expect(
    screen.root
      .findAllByType(TouchableOpacity)
      .some(node => node.props.disabled === true),
  ).toBe(true);
  const retryButton = screen.root
    .findAllByType(TouchableOpacity)
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => text.props.children === 'Try again'),
    )!;
  await act(async () => {
    retryButton.props.onPress();
  });
  expect(prepareCheckout).toHaveBeenCalledTimes(2);
  expect(RazorpayCheckout.open).not.toHaveBeenCalled();
  await act(async () => {
    screen.unmount();
  });
});
