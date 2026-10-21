import { createClient } from '@supabase/supabase-js';

// Strip any accidental leading/trailing quotes or whitespace that users often paste into GitHub Secrets or .env
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
let rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  .trim()
  .replace(/^["']|["']$/g, '')
  .replace(/^Bearer\s+/i, '');

// Self-healing: if the leading 'e' was dropped during copy-paste into GitHub Secrets (e.g. 'yJhbGci...' instead of 'eyJhbGci...')
// All Supabase JWT tokens start with {"alg":"HS256","typ":"JWT"} which encodes to 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
if (rawKey.startsWith('yJhbGci')) {
  rawKey = 'e' + rawKey;
}

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('your-project') &&
  !rawKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Clean standalone client for Storage without corrupted user session tokens
export const supabaseStorage = isSupabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
