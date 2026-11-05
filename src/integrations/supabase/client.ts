// Supabase client configured exclusively through this app public environment variables.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function isLegacyAnonKey(value: string): boolean {
  try {
    const payload = value.split(".")[1];
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role === "anon";
  } catch {
    return false;
  }
}

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env?.["VITE_SUPABASE_URL"]?.trim();
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim();

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "[Supabase] Configuration manquante. Définis VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY pour ton propre projet."
    );
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL)) {
    throw new Error("[Supabase] VITE_SUPABASE_URL doit être l'URL HTTPS de ton projet Supabase.");
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") &&
    !isLegacyAnonKey(SUPABASE_PUBLISHABLE_KEY)
  ) {
    throw new Error(
      "[Supabase] Utilise une clé publishable sb_publishable_ ou une ancienne clé anon. Une clé secret/service_role est interdite dans le navigateur.",
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
