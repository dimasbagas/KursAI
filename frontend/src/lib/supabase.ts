import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const hasValidKey = supabaseAnonKey && supabaseAnonKey !== "your_supabase_anon_key";
const hasValidUrl = isValidUrl(supabaseUrl) && supabaseUrl !== "your_supabase_url";

const urlToUse = hasValidUrl ? supabaseUrl : "https://placeholder-project.supabase.co";
const keyToUse = hasValidKey ? supabaseAnonKey : "placeholder-anon-key";

if (!hasValidUrl || !hasValidKey) {
  console.warn(
    "⚠️ [KursAI] Supabase is not properly configured. " +
    "Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local"
  );
}

export const supabase = createClient(urlToUse, keyToUse);

