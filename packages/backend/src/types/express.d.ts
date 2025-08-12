// Express Request type augmentation for PawPal
// Adds authentication-related properties to req object

declare namespace Express {
  interface Request {
    // Supabase auth user ID (from JWT token)
    authUserId?: string;
    
    // Email from Supabase auth
    authEmail?: string | null;
    
    // Internal user ID from public.users table
    userId?: string | null;
    
    // User role from public.users table
    userRole?: 'adopter' | 'feeder' | 'shelter' | 'admin' | null;
  }
}
