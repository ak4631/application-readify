import { supabase } from './supabase';
import { cancelPurchase } from './checkout';

export type Booking = {
  kind?: 'visit' | 'flex';
  payment_status?: string;
  vendor_id?: string;
  id: string;
  booking_code: string;
  booking_date: string;
  date_label: string;
  time_label: string;
  seat_label: string;
  // The seat the server assigned (library vendors only) -- shown so the
  // customer knows where to sit, never something they picked themselves.
  seat_number: string | null;
  total_amount: number;
  status:
    | 'upcoming'
    | 'completed'
    | 'cancelled'
    | 'pending'
    | 'confirmed'
    | 'expired';
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
      'id, booking_code, booking_date, date_label, time_label, seat_label, seat_number, total_amount, status, created_at, library_name',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const flex = await supabase
    .from('customer_flex_bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (flex.error) throw flex.error;
  const payments = await supabase
    .from('customer_payment_orders')
    .select('target_id,status,vendor_id');
  if (payments.error) throw payments.error;
  return [
    ...(data ?? []).map(row => ({ ...row, kind: 'visit' })),
    ...(flex.data ?? []).map(row => ({ ...row, kind: 'flex' })),
  ]
    .map(row => ({
      ...row,
      payment_status: payments.data?.find(
        payment => payment.target_id === row.id,
      )?.status,
      vendor_id: payments.data?.find(payment => payment.target_id === row.id)
        ?.vendor_id,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at)) as Booking[];
}

export async function cancelBooking(bookingId: string) {
  await cancelPurchase(bookingId);
}
