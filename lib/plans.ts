import { supabase } from './supabase';

export type Plan = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_value: number;
  duration_unit: 'DAYS' | 'MONTHS' | 'YEARS' | 'SESSIONS';
};

const DURATION_LABEL: Record<Plan['duration_unit'], (value: number) => string> = {
  DAYS: value => (value === 1 ? '1 day' : `${value} days`),
  MONTHS: value => (value === 1 ? '1 month' : `${value} months`),
  YEARS: value => (value === 1 ? '1 year' : `${value} years`),
  SESSIONS: value => (value === 1 ? '1 session' : `${value} sessions`),
};

export function formatPlanDuration(plan: Plan) {
  return DURATION_LABEL[plan.duration_unit](plan.duration_value);
}

export async function fetchPlans(vendorId: string): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('listing_plans')
    .select('id, vendor_id, name, description, price, currency, duration_value, duration_unit')
    .eq('vendor_id', vendorId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as any[]).map(plan => ({ ...plan, price: Number(plan.price) })) as Plan[];
}
