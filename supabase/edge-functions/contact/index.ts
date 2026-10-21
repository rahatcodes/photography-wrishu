import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting map (IP -> timestamp array)
const ipRateMap = new Map<string, number[]>();

function isRateLimited(ip: string, maxRequests = 5, windowMinutes = 15): boolean {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const history = ipRateMap.get(ip) || [];
  const validTimestamps = history.filter((time) => now - time < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return true;
  }

  validTimestamps.push(now);
  ipRateMap.set(ip, validTimestamps);
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'anon-ip';

    if (isRateLimited(clientIp, 5, 15)) {
      return new Response(
        JSON.stringify({ error: 'Too many submissions. Please wait 15 minutes.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, message, website_url_hp } = await req.json();

    // 1. Honeypot check
    if (website_url_hp) {
      // Silently discard spam submission
      return new Response(
        JSON.stringify({ success: true, message: 'Message sent successfully.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Strict Input Validation
    if (!name || name.trim().length === 0 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid name (max 100 characters).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid email address.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message || message.trim().length < 5 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message must be between 5 and 5000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Insert into Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabaseClient.from('messages').insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      read: false,
    });

    if (dbError) {
      console.error('Database insertion error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to record message in database.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent successfully.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
