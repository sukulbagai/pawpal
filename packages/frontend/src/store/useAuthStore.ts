import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'adopter' | 'feeder' | 'shelter' | 'admin';
}

interface AuthState {
  session: Session | null;
  userRow: UserRow | null;
  loading: boolean;
}

interface AuthActions {
  setSession: (session: Session | null) => void;
  setUserRow: (userRow: UserRow | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // State
  session: null,
  userRow: null,
  loading: true,

  // Actions
  setSession: (session) => set({ session }),
  setUserRow: (userRow) => set({ userRow }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ session: null, userRow: null, loading: false }),
}));
