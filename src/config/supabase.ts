import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize environment variables securely
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fail fast if infrastructure environment variables are missing
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('CRITICAL ERROR: Supabase environment variables are missing. Check your .env file.');
}

/**
 * Supabase Admin Client
 * 
 * WARNING: This client uses the Service Role Key. It bypasses all RLS policies.
 * Only use this on the server-side for admin tasks or when securely proxying data to the client.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false // The backend does not need to persist user sessions like a browser
  }
});

console.log('Supabase client initialized successfully.');