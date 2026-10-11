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
  let token: string | null = null;

  // 1. If Supabase is configured, retrieve the active/refreshed session token
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        token = data.session.access_token;
        localStorage.setItem("revora_token", token);
      }
    } catch {
      // Fallback to local storage if network retrieval fails
    }
  }

  // 2. Fallback to storage if not obtained from active Supabase session
  if (!token) {
    token =
      localStorage.getItem("revora_token") ||
      sessionStorage.getItem("revora_token");
  }

  // 3. Filter out and purge any stale legacy fake tokens
  if (token && token.startsWith("local-token-")) {
    localStorage.removeItem("revora_token");
    sessionStorage.removeItem("revora_token");
    token = null;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clear stale tokens on 401 unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("revora_token");
      sessionStorage.removeItem("revora_token");
    }
    return Promise.reject(error);
  }
);