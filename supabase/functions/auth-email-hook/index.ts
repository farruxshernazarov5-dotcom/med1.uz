import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createAuthEmailHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js@0.0.3'
import { resendConfigured, sendViaResend } from '../_shared/resend.ts'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Configuration
const SITE_NAME = "Med1.uz"
const SENDER_DOMAIN = "notify.med1.uz"
const ROOT_DOMAIN = "med1.uz"
const FROM_DOMAIN = "med1.uz"
const SITE_URL = `https://${ROOT_DOMAIN}`

// Template mapping for preview mode
const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// Sample data for preview mode ONLY (not used in actual email sending).
// URLs are baked in at scaffold time from the project's real data.
// The sample email uses a fixed placeholder (RFC 6761 .test TLD) so the Go backend
// can always find-and-replace it with the actual recipient when sending test emails,
// even if the project's domain has changed since the template was scaffolded.
const SAMPLE_PROJECT_URL = "https://med1-uz.lovable.app"
const SAMPLE_EMAIL = "user@example.test"
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: '123456',
  },
}

// Preview endpoint handler - returns rendered HTML without sending email
async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const authHeader = req.headers.get('Authorization')

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]

  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// The SDK handler owns verification, dispatch, and retry semantics; this file
// owns only the email decisions: subjects, templates, and per-type props.
const AUTH_EMAILS = {

    signup: {
      subject: 'Med1.uz — emailingizni tasdiqlang',
      render: (data) =>
        React.createElement(SignupEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          recipient: data.email,
          confirmationUrl: data.url,
        }),
    },
    invite: {
      subject: "Med1.uz — sizga taklif yuborildi",
      render: (data) =>
        React.createElement(InviteEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          confirmationUrl: data.url,
        }),
    },
    magiclink: {
      subject: 'Med1.uz — kirish havolasi',
      render: (data) =>
        React.createElement(MagicLinkEmail, {
          siteName: SITE_NAME,
          confirmationUrl: data.url,
        }),
    },
    recovery: {
      subject: 'Med1.uz — parolni tiklash',
      render: (data) =>
        React.createElement(RecoveryEmail, {
          siteName: SITE_NAME,
          confirmationUrl: data.url,
        }),
    },
    email_change: {
      subject: 'Med1.uz — yangi emailni tasdiqlang',
      render: (data) =>
        React.createElement(EmailChangeEmail, {
          siteName: SITE_NAME,
          oldEmail: data.old_email ?? '',
          email: data.email,
          newEmail: data.new_email ?? '',
          confirmationUrl: data.url,
        }),
    },
    reauthentication: {
      subject: 'Med1.uz — tasdiqlash kodi',
      render: (data) =>
        React.createElement(ReauthenticationEmail, { token: data.token ?? '' }),
    },
} as Record<string, { subject: string; render: (data: any) => React.ReactElement }>

const lovableHandler = createAuthEmailHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
  senderDomain: SENDER_DOMAIN,
  sendUrl: Deno.env.get('LOVABLE_SEND_URL'),
  emails: AUTH_EMAILS as any,
})

function parseAuthPayload(raw: unknown) {
  const p = raw as any
  if (!p || typeof p !== 'object' || typeof p.version !== 'string' || p.type !== 'auth' ||
      !p.data || typeof p.data.action_type !== 'string' || typeof p.data.email !== 'string') {
    throw new Error('Invalid auth email webhook payload')
  }
  return p
}

// Same signed webhook as the SDK handler, but delivered through Resend (med1.uz verified there).
async function resendHandler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })
  let event: any
  try {
    ({ payload: event } = await verifyWebhookRequest({
      req, secret: Deno.env.get('LOVABLE_API_KEY')!, parser: parseAuthPayload,
    }))
  } catch (e) {
    console.error('auth webhook verification failed', e instanceof Error ? e.message : e)
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  if (event.version !== '1') return Response.json({ error: 'Unsupported version' }, { status: 400 })
  const def = Object.prototype.hasOwnProperty.call(AUTH_EMAILS, event.data.action_type)
    ? AUTH_EMAILS[event.data.action_type] : undefined
  if (!def) return Response.json({ error: 'Unknown auth email action type' }, { status: 400 })
  try {
    const element = def.render(event.data)
    const html = await renderAsync(element)
    const text = await renderAsync(element, { plainText: true })
    await sendViaResend({
      to: event.data.email,
      subject: def.subject,
      html,
      text,
      idempotencyKey: event.run_id ? `auth:${event.run_id}` : undefined,
      tag: `auth_${event.data.action_type}`,
    })
  } catch (e) {
    console.error('auth email send failed', e instanceof Error ? e.message : e)
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }
  return Response.json({ success: true, sent: true })
}

const handler = (req: Request) => (resendConfigured() ? resendHandler(req) : lovableHandler(req))

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // Handle CORS preflight for main endpoint
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Route to preview handler for /preview path
  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  return handler(req)
})
