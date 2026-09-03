import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'
import { sendRawEmail } from '../_shared/transactional-email-templates/send-raw-email.ts'
import { logEmailSend } from '../_shared/transactional-email-templates/log-send.ts'

// Server-side send surface used by the app's own features (lab results,
// security alerts, tax reports, API notifications). Sends go through
// Lovable's managed email API; suppression and retries are enforced there.
//
// Auth: verify_jwt = true in config.toml — Supabase validates the caller's JWT
// before the request reaches this code.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON in request body' }, 400)
  }

  const templateName: string | undefined = body.templateName || body.template_name
  const recipient: string | undefined =
    body.recipientEmail || body.recipient_email || body.to
  const idempotencyKey: string | undefined = body.idempotencyKey || body.idempotency_key
  const templateData: Record<string, any> =
    body.templateData && typeof body.templateData === 'object' ? body.templateData : {}

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null

  const label = templateName ?? 'custom'

  try {
    let result: { sent: boolean; reason?: string }

    if (templateName) {
      if (!recipient) {
        return json({ error: 'recipientEmail is required' }, 400)
      }
      result = await sendTemplateEmail(templateName, recipient, {
        templateData,
        idempotencyKey,
      })
    } else {
      // Ad-hoc send: subject + HTML composed by the calling feature.
      const subject: string | undefined = body.subject
      const html: string | undefined =
        body.html ?? (body.data?.body ? String(body.data.body) : undefined)
      if (!recipient || !subject || !html) {
        return json({ error: 'to, subject and html are required' }, 400)
      }
      result = await sendRawEmail({
        to: recipient,
        subject,
        html,
        text: body.text,
        label: 'custom',
        idempotencyKey,
      })
    }

    if (admin && recipient) {
      await logEmailSend(admin, {
        templateName: label,
        recipientEmail: recipient,
        status: result.sent ? 'sent' : 'suppressed',
      })
    }

    if (!result.sent) {
      return json({ success: false, reason: 'email_suppressed' })
    }
    return json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('send-app-email failed', { label, message })
    if (admin && recipient) {
      await logEmailSend(admin, {
        templateName: label,
        recipientEmail: recipient,
        status: 'failed',
        errorMessage: message.slice(0, 1000),
      })
    }
    return json({ error: 'Failed to send email' }, 500)
  }
})
