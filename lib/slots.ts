import { supabase } from './supabase';

export type SlotAvailability = {
  time_slot: string;
  start_time: string;
  end_time: string;
  capacity: number;
  available_capacity: number;
};

export async function fetchSlotAvailability(
  vendorId: string,
  slotDate: string,
): Promise<SlotAvailability[]> {
  const { data, error } = await supabase.rpc('get_slot_availability', {
    p_vendor_id: vendorId,
    p_slot_date: slotDate,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as SlotAvailability[];
}
