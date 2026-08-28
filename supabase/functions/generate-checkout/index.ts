import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkoutUrl } from '../_shared/click.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate JWT auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { clinic_id, appointment_id, amount, provider, description } = await req.json();

    // SECURITY: patient_id is ALWAYS the calling user — never trust client-supplied value
    const patient_id = claimsData.claims.sub as string;

    if (!clinic_id || !amount) {
      return new Response(JSON.stringify({ error: 'clinic_id, amount required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate amount is a positive number
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 100000000) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get clinic payment settings
    const { data: clinic, error: clinicErr } = await supabase
      .from('registered_clinics')
      .select('name, click_merchant_id, click_service_id, payme_merchant_id, payment_enabled')
      .eq('id', clinic_id)
      .single();

    if (clinicErr) throw clinicErr;

    if (!clinic.payment_enabled) {
      return new Response(JSON.stringify({ error: 'Payment not enabled for this clinic' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create payment record
    const { data: payment, error: payErr } = await supabase
      .from('clinic_payments')
      .insert({
        clinic_id,
        appointment_id: appointment_id || null,
        patient_id,
        amount: numAmount,
        provider: provider || 'cash',
        status: 'pending',
        notes: description || null,
      })
      .select()
      .single();

    if (payErr) throw payErr;

    // Generate checkout URL based on provider
    let checkout_url = null;
    const selectedProvider = provider || 'click';

    if (selectedProvider === 'click' && clinic.click_merchant_id && clinic.click_service_id) {
      checkout_url = checkoutUrl({
        serviceId: String(clinic.click_service_id).trim(),
        merchantId: String(clinic.click_merchant_id).trim(),
        amount: numAmount,
        transactionParam: payment.id,
        returnUrl: 'https://med1.uz/payment/success',
      });
    } else if (selectedProvider === 'payme' && clinic.payme_merchant_id) {
      const params = btoa(JSON.stringify({
        m: clinic.payme_merchant_id,
        ac: { payment_id: payment.id },
        a: numAmount * 100,
      }));
      checkout_url = `https://checkout.paycom.uz/${params}`;
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'payment_created',
      entity_type: 'clinic_payments',
      entity_id: payment.id,
      details: { clinic_id, amount: numAmount, provider: selectedProvider },
      user_id: claimsData.claims.sub,
    });

    return new Response(JSON.stringify({
      ok: true,
      payment,
      checkout_url,
      clinic_name: clinic.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('generate-checkout error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
