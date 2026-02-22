/* ============================================================
   Votamin – Supabase Client
   ============================================================ */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
}

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Слушай за промени в auth state
 * @param {Function} callback – (user) => void
 */
export function onAuthStateChange(callback) {
  const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return data.subscription;
}
