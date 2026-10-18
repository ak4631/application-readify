import { supabase } from './supabase';

// Customers never see individual seats: the server assigns one when they book.
// They only see how many seats are free for each start time.
export type SlotOption = {
  // Library-local "HH:MM" strings straight from the server (no timezone math here).
  start_time: string;
  end_time: string;
  seats_available: number;
};

export type SlotOptions = {
  // 0 = the library has no individually-tracked seats (legacy time-bucket flow).
  totalSeats: number;
  options: SlotOption[];
};

function parseOptions(rows: any[] | null): SlotOptions {
  if (!rows || rows.length === 0) {
    return { totalSeats: 0, options: [] };
  }
  return {
    totalSeats: Number(rows[0].total_seats),
    // A single row with a NULL start = library has seats but none are bookable.
    options: rows
      .filter(row => row.start_time != null)
      .map(row => ({
        start_time: row.start_time,
        end_time: row.end_time,
        seats_available: Number(row.seats_available),
      })),
  };
}

export async function fetchPurchaseOptions(
  vendorId: string,
  planId: string,
  date: string,
  days?: number,
): Promise<SlotOptions> {
  const { data, error } = await supabase.rpc('get_purchase_options', {
    p_vendor_id: vendorId,
    p_plan_id: planId,
    p_date: date,
    p_days: days ?? null,
  });
  if (error) throw error;
  return parseOptions(data as any[] | null);
}

// Local calendar date as YYYY-MM-DD. (toISOString() converts to UTC first,
// which is the previous day for local midnight east of UTC, e.g. IST.)
export function toLocalDateId(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime12(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

