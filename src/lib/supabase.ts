import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vugbjesmqtwwjkqeklui.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Z2JqZXNtcXR3d2prcWVrbHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNzcxMDcsImV4cCI6MjA5MzY1MzEwN30.cWC_DZquZ51_RhGtcdlV57gdm6uLn863rKhg5qaCHnU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
