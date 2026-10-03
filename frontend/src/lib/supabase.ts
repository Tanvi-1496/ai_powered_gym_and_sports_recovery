import { createClient } from "@supabase/supabase-js";

const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ufhilskaryeittfqblwc.supabase.co";

const supabaseUrl =
  rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
    ? rawUrl
    : `https://${rawUrl}.supabase.co`;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmaGlsc2thcnllaXR0ZnFibHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTY0OTksImV4cCI6MjEwNjQzMjQ5OX0.lBdWJMH9TvyjNEZ4qkcUl-c1L_7QJQS-XHtUJTh-Ci0";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "YOUR_SUPABASE_PROJECT_URL" &&
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
