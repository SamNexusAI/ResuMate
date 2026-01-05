import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isUrlValid = (url: string) => {
    try {
        return url.startsWith('http://') || url.startsWith('https://');
    } catch (e) {
        return false;
    }
};

let client: SupabaseClient;

if (isUrlValid(supabaseUrl) && supabaseUrl !== 'your_supabase_url_here') {
    client = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn("Supabase URL is missing or invalid. Using mock client. Please update .env.local");
    // Create a proxy to prevent crashes while keys are missing
    // This allows the app to load, but auth calls will fail gracefully
    client = new Proxy({} as SupabaseClient, {
        get: (target, prop) => {
            // Mock auth specifically to prevent immediate crash in AuthContext
            if (prop === 'auth') {
                return {
                    getSession: async () => ({ data: { session: null }, error: null }),
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                    signInWithOAuth: async () => {
                        alert("Supabase not configured. Please add keys to .env.local");
                        return { error: { message: "Supabase not configured" } };
                    },
                    signOut: async () => { },
                    updateUser: async () => { }
                };
            }

            // Return a safe dummy for other properties
            return () => {
                console.warn(`Supabase method '${String(prop)}' called but client is not configured.`);
                return Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
            };
        }
    });
}

export const supabase = client;
