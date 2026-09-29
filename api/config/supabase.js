import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// This API performs privileged reads and writes. A publishable/anon key cannot
// stand in for a server-only secret key, and must never be used as a fallback.
const supabaseKey = process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Server-side Supabase credentials not found. Persistent features are unavailable.');
}

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export default supabase;
