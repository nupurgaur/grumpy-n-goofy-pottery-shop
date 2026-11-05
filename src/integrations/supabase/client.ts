import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables, fallback to hardcoded values if env vars are not available
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mpdmdzzjjjqrrwrbrjti.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZG1kenpqampxcnJ3cmJyanRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTgzMTAsImV4cCI6MjA3MjczNDMxMH0.nHmK7ORTfe24Zaomw8XaLzpDqOz9gfVXiOFHvmtA2gM";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});