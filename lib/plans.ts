import { supabase } from './supabase';

export type Plan = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_value: number;
  duration_unit: 'DAYS' | 'MONTHS' | 'YEARS' | 'SESSIONS' | 'HOURS';
  // Hours/day a subscription plan holds its seat; null = whole opening window.
  daily_hours: number | null;
  // When true, `price` is a per-hour rate and the customer picks 1-14 days
  // at purchase time (a stepper), instead of the plan having one fixed
  // duration/price. Always paired with duration_unit HOURS and a set
  // daily_hours.
  is_flexible: boolean;
};

const DURATION_LABEL: Record<Plan['duration_unit'], (value: number) => string> = {
  DAYS: value => (value === 1 ? '1 day' : `${value} days`),
  MONTHS: value => (value === 1 ? '1 month' : `${value} months`),
  YEARS: value => (value === 1 ? '1 year' : `${value} years`),
  SESSIONS: value => (value === 1 ? '1 session' : `${value} sessions`),
  HOURS: value => (value === 1 ? '1 hour' : `${value} hours`),
};

export function formatPlanDuration(plan: Plan) {
  if (plan.is_flexible) {
    return `₹${plan.price}/hr · pick 1-14 days`;
  }
  const label = DURATION_LABEL[plan.duration_unit](plan.duration_value);
  return plan.daily_hours && plan.duration_unit !== 'HOURS' ? `${label} · ${plan.daily_hours}h/day` : label;
}

export async function fetchPlans(vendorId: string): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('listing_plans')
    .select(
      'id, vendor_id, name, description, price, currency, duration_value, duration_unit, daily_hours, is_flexible',
    )
    .eq('vendor_id', vendorId);

  if (error) {
    throw error;
  }

  return ((data ?? []) as any[]).map(plan => ({ ...plan, price: Number(plan.price) })) as Plan[];
}
