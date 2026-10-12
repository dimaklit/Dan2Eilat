import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
	|| import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase = url && publishableKey ? createClient(url, publishableKey) : null;
export const supabaseConfigured = supabase !== null;
export const TRAIL_PHOTOS_BUCKET = 'trail-photos';