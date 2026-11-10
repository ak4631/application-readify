import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import BookingsScreen from '../screens/BookingsScreen';
import BookingCalendar from '../components/BookingCalendar';

const mockSession = { user: { id: 'customer' } };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: mockSession }),
}));
jest.mock('../lib/bookings', () => ({
  fetchBookings: jest.fn(async () => [
    {
      id: 'pass',
      library_name: 'Study Space',
      total_amount: 106,
      kind: 'flex',
      booking_date: '2030-01-01',
      date_label: '1 Jan 2030',
      time_label: '09:00 daily for 14 days',
      seat_label: 'Day pass',
      seat_number: 'S1',
      booking_code: 'PASS1',
      status: 'confirmed',
      payment_status: 'CAPTURED',
    },
  ]),
  cancelBooking: jest.fn(),
}));

test('pass summary reveals the calendar and entry pass only when expanded', async () => {
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<BookingsScreen embedded />);
  });
  const toggle = () =>
    screen.root
      .findAllByType(TouchableOpacity)
      .find(
        button =>
          button.props.accessibilityLabel === 'Booking details for Study Space',
      )!;
  expect(toggle().props.accessibilityState.expanded).toBe(false);
  expect(screen.root.findAllByType(BookingCalendar)).toHaveLength(0);
  await act(async () => toggle().props.onPress());
  expect(toggle().props.accessibilityState.expanded).toBe(true);
  expect(screen.root.findByType(BookingCalendar).props.end).toBe('2030-01-14');
  await act(async () => toggle().props.onPress());
  expect(screen.root.findAllByType(BookingCalendar)).toHaveLength(0);
  await act(async () => screen.unmount());
});
