import type { Booking } from './bookings';

export function dateAtDay(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function bookingDateRange(
  booking: Pick<Booking, 'kind' | 'booking_date' | 'time_label'> & {
    days?: number;
  },
) {
  const start = booking.booking_date?.slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start ?? '') ||
    !Number.isFinite(Date.parse(`${start}T12:00:00Z`))
  )
    return null;
  if (dateAtDay(start, 0) !== start) return null;
  // The current bridge exposes Flex duration in its server-generated time label.
  const days =
    booking.kind === 'flex'
      ? booking.days ??
        Number(booking.time_label?.match(/daily for (\d+) days$/)?.[1])
      : 1;
  if (!Number.isInteger(days) || days < 1 || days > 14) return null;
  return { start, end: dateAtDay(start, days - 1), days };
}
