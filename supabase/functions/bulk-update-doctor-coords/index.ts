import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const adminSecret = Deno.env.get('BULK_UPDATE_SECRET');
  if (!adminSecret || req.headers.get('x-admin-secret') !== adminSecret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(url, key);

  const body = await req.json() as Array<{ id: string; lat: number; lon: number }>;
  if (!Array.isArray(body)) {
    return new Response(JSON.stringify({ error: 'expected array' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let updated = 0;
  const BATCH = 500;
  for (let i = 0; i < body.length; i += BATCH) {
    const chunk = body.slice(i, i + BATCH);
    const values = chunk
      .filter(r => r.id && Number.isFinite(r.lat) && Number.isFinite(r.lon))
      .map(r => `('${r.id}'::uuid,${r.lat},${r.lon})`)
      .join(',');
    if (!values) continue;
    const sql = `UPDATE public.doctors_external d SET latitude=v.lat, longitude=v.lon FROM (VALUES ${values}) AS v(id,lat,lon) WHERE d.id=v.id`;
    const { error } = await sb.rpc('exec_admin_sql', { p_sql: sql });
    if (error) {
      return new Response(JSON.stringify({ error: error.message, at: i }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    updated += chunk.length;
  }

  return new Response(JSON.stringify({ ok: true, updated }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
