import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET');
    const providedSecret = req.headers.get('x-webhook-secret');

    if (!webhookSecret || !providedSecret || providedSecret !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Validate payment_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payment_id)) {
      return new Response(JSON.stringify({ error: 'Invalid payment_id format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate status value
    const allowedStatuses = ['paid', 'failed', 'cancelled', 'refunded'];
    const finalStatus = paymentStatus || 'paid';
    if (!allowedStatuses.includes(finalStatus)) {
      return new Response(JSON.stringify({ error: 'Invalid status value' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify payment exists and is pending before updating
    const { data: existingPayment, error: checkErr } = await supabase
      .from('clinic_payments')
      .select('id, status')
      .eq('id', payment_id)
      .single();

    if (checkErr || !existingPayment) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (existingPayment.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Payment already processed' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update payment status
    const { data: payment, error: payErr } = await supabase
      .from('clinic_payments')
      .update({
        status: finalStatus,
        transaction_id: transaction_id || null,
      })
      .eq('id', payment_id)
      .eq('status', 'pending')
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
