import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in environment variables.");
}

/**
 * Client standard di Supabase per query pubbliche ed azioni utente standard.
 * Rispetta le regole di Row Level Security (RLS) definite su Supabase.
 */
export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);

/**
 * Client privilegiato (Admin) di Supabase. 
 * Utilizza la Service Role Key per scavalcare le regole RLS.
 * DA USARE ESCLUSIVAMENTE lato server (es. all'interno dei Webhook o delle API protette).
 */
export const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceKey || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
