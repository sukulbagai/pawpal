declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      CORS_ORIGIN?: string;
      SUPABASE_URL?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {};
