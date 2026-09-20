import { supabase } from './supabase';

export type Subscription = {
  id: string;
  vendor_id: string;
  library_name: string;
  plan_id: string;
  plan_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
};

// Reads/writes go through public.customer_subscriptions / the RPCs below
// rather than a table, since the real subscriptions live in
// admin.subscriptions (the schema the admin portal manages) and that schema
// isn't exposed to PostgREST.
export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('customer_subscriptions')
    .select(
      'id, vendor_id, library_name, plan_id, plan_name, start_date, end_date, total_amount, status, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as any[]).map(row => ({
    ...row,
    total_amount: Number(row.total_amount),
  })) as Subscription[];
}

export async function fetchActiveSubscription(vendorId: string): Promise<Subscription | null> {
  const subscriptions = await fetchSubscriptions();
  return subscriptions.find(s => s.vendor_id === vendorId && s.status === 'active') ?? null;
}

export async function createSubscription(vendorId: string, planId: string) {
  const { data, error } = await supabase
    .rpc('create_customer_subscription', { p_vendor_id: vendorId, p_plan_id: planId })
    .single();

  if (error) {
    throw error;
  }

  return data as { id: string; start_date: string; end_date: string };
}

export async function cancelSubscription(subscriptionId: string) {
  const { error } = await supabase.rpc('cancel_customer_subscription', {
    p_subscription_id: subscriptionId,
  });

  if (error) {
    throw error;
  }
}
