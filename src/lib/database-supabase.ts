import { supabase } from './supabase';

export const saveUserSupabase = async (user: any) => {
  const userId = user.id || user.uid;
  const profileData: any = {
    id: userId,
    email: user.email,
    display_name: user.user_metadata?.full_name || user.display_name || 'Conector User',
    photo_url: user.user_metadata?.avatar_url || user.photo_url || `https://ui-avatars.com/api/?name=${user.email}`,
    updated_at: new Date().toISOString(),
  };

  // Only add these if they don't exist yet to avoid overwriting existing data on login
  // We'll perform a select first or rely on a safer upsert if we knew the schema
  const { data, error } = await supabase
    .from('users')
    .upsert(profileData, { onConflict: 'id', ignoreDuplicates: false });

  if (error) {
    console.error("Error saving user to Supabase:", error);
    // If it's a column missing error, users might need to run the SQL setup
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
