import { supabase } from './supabase';

export type Membership = {
  id: string;
  plan: 'daily' | 'monthly';
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at: string;
};

export async function fetchActiveMembership(userId: string): Promise<Membership | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('id, plan, status, started_at, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const membership = data as Membership;
  const isExpired = new Date(membership.expires_at).getTime() < Date.now();

  if (isExpired && membership.status === 'active') {
    return { ...membership, status: 'expired' };
  }

  return membership;
}

export async function choosePlan(userId: string, plan: 'daily' | 'monthly') {
  const startedAt = new Date();
  const expiresAt = new Date(startedAt);

  if (plan === 'daily') {
    expiresAt.setDate(expiresAt.getDate() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  const { error } = await supabase.from('memberships').upsert(
    {
      user_id: userId,
      plan,
      status: 'active',
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    throw error;
  }
}
