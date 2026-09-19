import { supabase } from './supabase';

export function generateBookingCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `RI-${datePart}-${randomPart}`;
}

export type CreateBookingInput = {
  userId: string;
  libraryId: string;
  libraryName: string;
  planId: string;
  bookingDate: string;
  dateLabel: string;
  timeSlot: string;
  timeLabel: string;
};

export type Booking = {
  id: string;
  booking_code: string;
  booking_date: string;
  date_label: string;
  time_label: string;
  seat_label: string;
  total_amount: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'confirmed' | 'expired';
  created_at: string;
  library_name: string;
};

// Reads/writes go through public.customer_bookings / the RPCs below rather
// than a table, since the real bookings live in admin.bookings (the schema
// the admin portal manages) and that schema isn't exposed to PostgREST.
export async function fetchBookings(_userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('customer_bookings')
    .select(
      'id, booking_code, booking_date, date_label, time_label, seat_label, total_amount, status, created_at, library_name',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as Booking[];
}

export async function cancelBooking(bookingId: string) {
  const { error } = await supabase.rpc('cancel_customer_booking', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw error;
  }
}

export async function createBooking(input: CreateBookingInput) {
  const bookingCode = generateBookingCode();

  const { data, error } = await supabase
    .rpc('create_customer_booking', {
      p_vendor_id: input.libraryId,
      p_plan_id: input.planId,
      p_booking_code: bookingCode,
      p_booking_date: input.bookingDate,
      p_date_label: input.dateLabel,
      p_time_slot: input.timeSlot,
      p_time_label: input.timeLabel,
    })
    .single();

  if (error) {
    throw error;
  }

  return data as { id: string; booking_code: string };
}
