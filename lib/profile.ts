import { supabase } from './supabase';

export async function ensureProfile(userId: string, fullName: string) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, full_name: fullName }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}
