import { supabase } from './supabase';

export const saveUserSupabase = async (user: any) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || 'Conector User',
      photo_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}`,
      updated_at: new Date().toISOString(),
      connections: [],
      muted_users: [],
      blocked_users: [],
    }, { onConflict: 'id', ignoreDuplicates: true }); // Using ignoreDuplicates: true or careful upsert

  if (error) {
    console.error("Error saving user to Supabase:", error);
    throw error;
  }
  return data;
};

export const getUserProfileSupabase = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is not found
    console.error("Error fetching user profile from Supabase:", error);
    throw error;
  }
  return data;
};
