// Frontend Supabase Client - Browser-side only
// This file is safe to import in frontend code

import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Check if Supabase is configured
const isSupabaseConfigured = env.SUPABASE_URL && env.SUPABASE_ANON_KEY;

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Create Supabase client with anonymous key (respects RLS)
// Use dummy values if not configured to prevent errors
export const supabase = createClient(
  env.SUPABASE_URL || 'https://dummy.supabase.co', 
  env.SUPABASE_ANON_KEY || 'dummy-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper to get current session
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
}

// Helper to get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// Helper to sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in signOut:', error);
    return false;
  }
}

// Database types (basic - will expand as needed)
export interface Dog {
  id: string;
  name?: string;
  age_years?: number;
  gender?: 'male' | 'female' | 'unknown';
  description?: string;
  area?: string;
  location_lat?: number;
  location_lng?: number;
  health_sterilised?: boolean;
  health_vaccinated?: boolean;
  health_dewormed?: boolean;
  compatibility_kids?: boolean;
  compatibility_dogs?: boolean;
  compatibility_cats?: boolean;
  energy_level?: string;
  temperament?: string;
  playfulness?: string;
  special_needs?: string;
  personality_tag_ids?: number[];
  images?: string[];
  videos?: string[];
  status: 'available' | 'pending' | 'adopted';
  created_at: string;
}

export interface PersonalityTag {
  id: number;
  tag_name: string;
  description?: string;
}

export interface AdoptionRequest {
  id: string;
  dog_id: string;
  adopter_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
}
