import { createClient } from '@supabase/supabase-js';

// ============================================
// Famous-provided Backend Configuration
// ============================================
// Famous / databasepad Supabase-compatible backend
const supabaseUrl = 'https://abieqpmvsufqzbqirqnu.supabase.co';
const supabaseKey = 'sb_publishable_intndgJTMxhrMWwjRuEWvQ_YWvDKn85';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
  persistSession: true,
  autoRefreshToken: true,
},
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export const FAMOUS_API_BASE_URL = supabaseUrl;

// ============================================
// Edge Function Caller (Famous-stabil)
// ============================================
// Frontend → backend kizárólag Edge Function (invoke)
// + headers: Famous/databasepad környezetben kellhet
export async function callEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  options?: { auth?: 'anon' | 'user'; accessToken?: string }
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const authMode = options?.auth ?? 'anon';

    // Alap headerek (Famous/databasepad miatt)
    const headers: Record<string, string> = {
      apikey: supabaseKey,
      'Content-Type': 'application/json',
    };

    // AUTH header kezelése
    // - anon: anon kulcs
    // - user: access token (ha van direkt), különben session-ből próbálja
    if (authMode === 'anon') {
      headers.Authorization = `Bearer ${supabaseKey}`;
    } else {
      const directToken = options?.accessToken;

      if (directToken) {
        headers.Authorization = `Bearer ${directToken}`;
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        } else {
          console.warn('callEdgeFunction(user): No access token in session');
        }
      }
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers,
    });

    if (error) return { data: null, error: new Error(error.message) };
    return { data: (data as T) ?? null, error: null };
  } catch (err: any) {
    console.error(`Error calling edge function ${functionName}:`, err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
