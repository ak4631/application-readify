import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { TouchableOpacity, View } from 'react-native';
import BookingCalendar from '../components/BookingCalendar';
import { bookingDateRange } from '../lib/bookingDates';

test('fourteen days includes the first day and ends on day fourteen across months', async () => {
  const range = bookingDateRange({
    kind: 'flex',
    booking_date: '2026-10-25',
    time_label: '09:00 daily for 14 days',
  });
  expect(range).toEqual({ start: '2026-10-25', end: '2026-11-07', days: 14 });
  let screen!: Renderer.ReactTestRenderer;
  await act(async () => {
    screen = Renderer.create(<BookingCalendar {...range!} />);
  });
  const highlighted = () =>
    screen.root
      .findAllByType(View)
      .filter(node => node.props.accessibilityLabel?.endsWith(', booked'))
      .map(node => node.props.accessibilityLabel);
  expect(highlighted()).toHaveLength(7);
  expect(highlighted()).toContain('25 Oct 2026, booked');
  const next = screen.root
    .findAllByType(TouchableOpacity)
    .find(node => node.props.accessibilityLabel === 'Next booking month')!;
  await act(async () => next.props.onPress());
  expect(highlighted()).toHaveLength(7);
  expect(highlighted()).toContain('7 Nov 2026, booked');
  expect(highlighted()).not.toContain('8 Nov 2026, booked');
  await act(async () => screen.unmount());
});

test('calendar handles leap years and never invents a missing Flex duration', () => {
  expect(
    bookingDateRange({
      kind: 'flex',
      booking_date: '2028-02-27',
      time_label: '08:00 daily for 3 days',
    })?.end,
  ).toBe('2028-02-29');
  expect(
    bookingDateRange({
      kind: 'flex',
      booking_date: '2026-10-25',
      time_label: 'Unknown',
    }),
  ).toBeNull();
  expect(
    bookingDateRange({
      kind: 'flex',
      booking_date: '2026-02-31',
      time_label: '08:00 daily for 3 days',
    }),
  ).toBeNull();
});
