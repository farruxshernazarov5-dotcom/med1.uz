import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { provider, transaction_id, payment_id, status: paymentStatus } = body;

    if (!payment_id) {
      return new Response(JSON.stringify({ error: 'payment_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update payment status
    const { data: payment, error: payErr } = await supabase
      .from('clinic_payments')
      .update({
        status: paymentStatus || 'paid',
        transaction_id: transaction_id || null,
      })
      .eq('id', payment_id)
      .select('*, registered_clinics:clinic_id(name)')
      .single();

    if (payErr) throw payErr;

    // Update appointment payment_status
    if (payment.appointment_id) {
      await supabase
        .from('appointments')
        .update({ payment_status: 'paid', payment_id: payment.id })
        .eq('id', payment.appointment_id);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'payment_completed',
      entity_type: 'clinic_payments',
      entity_id: payment.id,
      details: { provider, transaction_id, amount: payment.amount },
    });

    // Telegram notification
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
      const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');

      if (LOVABLE_API_KEY && TELEGRAM_API_KEY && ADMIN_CHAT_ID) {
        const clinicName = (payment as any).registered_clinics?.name || 'Noma\'lum';
        const msg = `💳 <b>To'lov amalga oshdi!</b>\n\n🏥 Klinika: ${clinicName}\n💰 Summa: ${Number(payment.amount).toLocaleString()} so'm\n📋 Invoice: ${payment.invoice_number}\n🔗 Provider: ${provider || 'cash'}\n🆔 TX: ${transaction_id || '-'}`;

        await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: msg, parse_mode: 'HTML' }),
        });
      }
    } catch (_) { /* silent */ }

    return new Response(JSON.stringify({ ok: true, payment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
