import { supabase } from './supabase';
import { useAuthStore } from '../store/useAuthStore';
import { api } from './api';

// Track which sessions we've already bootstrapped to avoid duplicates
const bootstrappedSessions = new Set<string>();

export function attachAuthListener() {
  if (!supabase) {
    console.warn('Supabase not configured, skipping auth listener');
    return;
  }

  const { setSession, setLoading, clear } = useAuthStore.getState();

  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    // Don't call handleSessionStart here - let onAuthStateChange handle it
    setLoading(false);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    
    setSession(session);
    
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
      handleSessionStart(session);
    } else if (event === 'SIGNED_OUT') {
      clear();
      bootstrappedSessions.clear();
    }
    
    setLoading(false);
  });
}

async function handleSessionStart(session: any) {
  const sessionId = session.access_token.substring(0, 20); // Use part of token as ID
  
  // Avoid duplicate bootstrap calls for the same session
  if (bootstrappedSessions.has(sessionId)) {
    return;
  }

  try {
    console.log('🔄 Bootstrapping user...');
    
    const response = await api.post('/auth/bootstrap-user');
    
    if (response.data.ok && response.data.user) {
      useAuthStore.getState().setUserRow(response.data.user);
      bootstrappedSessions.add(sessionId);
      console.log('✅ User bootstrapped:', response.data.user.name);
    }
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    // Don't clear session on bootstrap failure - user is still authenticated
  }
}
