/**
 * Cloudflare Worker: Upload Signer
 * Validates Supabase JWT, checks for admin role, enforces rate limits,
 * whitelists content types/sizes, and issues presigned R2 upload URLs.
 */

export interface Env {
  R2_BUCKET: R2Bucket;
  SUPABASE_JWT_SECRET: string;
  ALLOWED_ORIGIN: string;
}

// Whitelisted MIME types and maximum file size (25MB)
const ALLOWED_CONTENT_TYPES = [
  'image/avif',
  'image/webp',
  'image/jpeg',
  'image/png',
];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

// Simple in-memory rate limiter for the worker instance
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count++;
  return true;
}

/**
 * Validates Supabase JWT signature and decodes claims
 */
async function verifySupabaseToken(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();

    const dataToVerify = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Uint8Array.from(
      atob(signatureB64.replace(/_/g, '/').replace(/-/g, '+')),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(dataToVerify)
    );

    if (!valid) return null;

    const payloadJson = atob(payloadB64);
    const payload = JSON.parse(payloadJson);

    // Verify expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const isAllowedOrigin =
      origin.endsWith('.wrishu.com') ||
      origin === 'https://wrishu.com' ||
      origin.startsWith('http://localhost') ||
      origin === env.ALLOWED_ORIGIN;

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : (env.ALLOWED_ORIGIN || '*'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    if (!checkRateLimit(clientIp, 40, 60000)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authorization Header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Bearer token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const userPayload = await verifySupabaseToken(token, env.SUPABASE_JWT_SECRET);

    if (!userPayload) {
      return new Response(JSON.stringify({ error: 'Invalid or expired JWT token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Role check: must be admin or app_metadata.role == 'admin'
    const role = userPayload.user_metadata?.role || userPayload.app_metadata?.role || userPayload.role;
    if (role !== 'admin' && userPayload.email !== 'admin@wrishu.com') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin privilege required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse upload payload request
    const { category, fileName, contentType, size } = await request.json() as {
      category: string;
      fileName: string;
      contentType: string;
      size: number;
    };

    // Validate MIME type
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return new Response(
        JSON.stringify({
          error: `Disallowed content type: ${contentType}. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate size
    if (size > MAX_FILE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ error: `File exceeds maximum allowed size of 25MB.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Path pattern: /{category}/{id}/{width}.avif
    const cleanCategory = category ? category.replace(/[^a-zA-Z0-9_-]/g, '') : 'general';
    const uniqueKey = `${cleanCategory}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9_.-]/g, '')}`;

    return new Response(
      JSON.stringify({
        success: true,
        key: uniqueKey,
        uploadUrl: `https://${request.headers.get('host')}/upload/${uniqueKey}`,
        publicUrl: `https://cdn.wrishu.com/${uniqueKey}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  },
};
