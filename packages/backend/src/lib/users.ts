import { supabaseAdmin } from './supabase';

// Database types
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

/**
 * Get user by Supabase auth user ID
 * Returns user data from public.users table
 */
export async function getUserByAuthId(authUserId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, auth_user_id, phone, locality, created_at')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      // PGRST116 is "not found" - that's ok, user might not exist yet
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by auth ID:', error);
    return null;
  }
}

/**
 * Ensure user exists by auth ID, creating if necessary
 * This is the bootstrap function called on first login
 */
export async function ensureUserByAuth(
  authUserId: string,
  opts?: {
    name?: string | null;
    email?: string | null;
    role?: 'adopter' | 'feeder' | 'shelter' | 'admin';
    locality?: string | null;
  }
): Promise<User | null> {
  try {
    // First, try to get existing user
    const existingUser = await getUserByAuthId(authUserId);
    if (existingUser) {
      return existingUser;
    }

    // User doesn't exist, create new one
    const name = opts?.name || 
                 (opts?.email ? opts.email.split('@')[0] : null) || 
                 'User';
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authUserId,
        name,
        email: opts?.email || '',
        role: opts?.role || 'adopter',
        locality: opts?.locality || null,
      })
      .select('id, name, email, role, auth_user_id, phone, locality, created_at')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    console.log(`✅ Bootstrap: Created new user ${data.name} (${data.email})`);
    return data;
  } catch (error) {
    console.error('Error in ensureUserByAuth:', error);
    return null;
  }
}
