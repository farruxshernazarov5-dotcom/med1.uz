import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '@supabase/supabase-js/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { clinic_id, appointment_id, patient_id, amount, provider, description } = await req.json();

    if (!clinic_id || !patient_id || !amount) {
      return new Response(JSON.stringify({ error: 'clinic_id, patient_id, amount required' }), {
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

    // Create payment record
    const { data: payment, error: payErr } = await supabase
      .from('clinic_payments')
      .insert({
        clinic_id,
        appointment_id: appointment_id || null,
        patient_id,
        amount,
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
      checkout_url = `https://my.click.uz/services/pay?service_id=${clinic.click_service_id}&merchant_id=${clinic.click_merchant_id}&amount=${amount}&transaction_param=${payment.id}`;
    } else if (selectedProvider === 'payme' && clinic.payme_merchant_id) {
      const params = btoa(JSON.stringify({
        m: clinic.payme_merchant_id,
        ac: { payment_id: payment.id },
        a: amount * 100,
      }));
      checkout_url = `https://checkout.paycom.uz/${params}`;
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'payment_created',
      entity_type: 'clinic_payments',
      entity_id: payment.id,
      details: { clinic_id, amount, provider: selectedProvider },
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
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
