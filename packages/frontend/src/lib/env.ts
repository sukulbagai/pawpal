// Environment configuration with safe defaults
export const env = {
  API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:4000',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const;

// Type for environment variables
export type EnvConfig = typeof env;
