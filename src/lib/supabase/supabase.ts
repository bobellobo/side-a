import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrlValue = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyValue = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrlValue || !supabaseAnonKeyValue) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Add them to .env before starting the app.",
  );
}

export const supabaseUrl = supabaseUrlValue;
export const supabaseAnonKey = supabaseAnonKeyValue;

const isServerRender = typeof window === "undefined";

const authConfig = isServerRender
  ? {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    }
  : {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authConfig,
});
