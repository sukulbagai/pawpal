import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseServiceRole) {
  throw new Error('SUPABASE_SERVICE_ROLE environment variable is required');
}

// Server-side Supabase client with service role key
// This bypasses RLS and has full database access - use carefully!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types (basic - will expand as needed)
export interface User {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'adopter' | 'feeder' | 'shelter' | 'admin';
  locality?: string;
  created_at: string;
}

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
  microchip_id?: string;
  compatibility_kids?: boolean;
  compatibility_dogs?: boolean;
  compatibility_cats?: boolean;
  energy_level?: string;
  temperament?: string;
  playfulness?: string;
  special_needs?: string;
  personality_tag_ids?: number[];
  images?: string[];
  posted_by?: string;
  status: 'available' | 'pending' | 'adopted';
  created_at: string;
}

export interface AdoptionRequest {
  id: string;
  dog_id: string;
  adopter_id: string;
  message?: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
}

// Helper function to get user by auth_user_id
export async function getUserByAuthId(authUserId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      console.error('Error fetching user by auth ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByAuthId:', error);
    return null;
  }
}

// Helper function to create or update user (for bootstrap)
export async function upsertUser(authUserId: string, userData: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          auth_user_id: authUserId,
          ...userData,
        },
        {
          onConflict: 'auth_user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertUser:', error);
    return null;
  }
}

// Helper to verify user exists and return their ID
export async function getUserIdFromAuth(authUserId: string): Promise<string | null> {
  const user = await getUserByAuthId(authUserId);
  return user?.id || null;
}
