import axios from "axios";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach verified bearer token to outgoing requests if authenticated
api.interceptors.request.use(async (config) => {
  let token =
    localStorage.getItem("revora_token") ||
    sessionStorage.getItem("revora_token");

  // Filter out and purge any stale fake tokens
  if (token && token.startsWith("local-token-")) {
    localStorage.removeItem("revora_token");
    sessionStorage.removeItem("revora_token");
    token = null;
  }

  // If not in storage, attempt to retrieve live session token from Supabase client
  if (!token && isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token || null;
      if (token && !token.startsWith("local-token-")) {
        localStorage.setItem("revora_token", token);
      }
    } catch {
      // ignore
    }
  }

  if (token && !token.startsWith("local-token-")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});