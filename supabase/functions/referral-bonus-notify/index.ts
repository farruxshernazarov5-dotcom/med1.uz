import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const schema = z.object({ transaction_id: z.string().uuid() }).strict()
Deno.serve(async (req) => {
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const { data: secret } = await db.from('internal_job_secrets').select('secret').eq('name', 'emedinfo_notify').maybeSingle()
  if (!secret?.secret || req.headers.get('x-job-secret') !== secret.secret) return json({ error: 'Forbidden' }, 403)
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'transaction_id required' }, 400)
  const { data: tx, error } = await db.from('cash_wallet_transactions').select('id,user_id,amount,provider,metadata').eq('id', parsed.data.transaction_id).maybeSingle()
  if (error) return json({ error: 'Read failed' }, 500)
  if (!tx || tx.provider !== 'referral_bonus' || tx.metadata?.campaign !== 'paid_referral' || Number(tx.amount) !== 5000) return json({ error: 'Reward not found' }, 404)
  const { data: owner } = await db.auth.admin.getUserById(tx.user_id)
  if (!owner?.user?.email || !owner.user.email_confirmed_at) return json({ skipped: 'no_confirmed_email' })
  try {
    const result = await sendTemplateEmail('referral-paid-bonus', owner.user.email, { idempotencyKey: `referral-paid-bonus:${tx.id}` })
    return json(result)
  } catch (e) {
    console.error('referral bonus email unavailable', e instanceof Error ? e.name : 'Unknown')
    return json({ error: 'Email unavailable; bonus remains credited' }, 503)
  }
})