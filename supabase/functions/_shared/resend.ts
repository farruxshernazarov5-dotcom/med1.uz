// Direct Resend delivery for med1.uz (domain verified in Resend with aHost TXT records).
// Used instead of Lovable's managed sender because aHost cannot delegate NS for notify.med1.uz.
export const RESEND_FROM = 'Med1.uz <noreply@med1.uz>'
export const RESEND_REPLY_TO = 'info@med1.uz'

export function resendConfigured(): boolean {
  return !!Deno.env.get('RESEND_API_KEY')
}

export interface ResendEmail {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  idempotencyKey?: string
  tag?: string
}

export async function sendViaResend(email: ResendEmail): Promise<{ id: string | null }> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  }
  if (email.idempotencyKey) headers['Idempotency-Key'] = email.idempotencyKey.slice(0, 256)
  const tag = (email.tag || 'transactional').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 256)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      reply_to: email.replyTo || RESEND_REPLY_TO,
      tags: [{ name: 'category', value: tag }],
    }),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error(`Resend send failed [${res.status}]: ${body}`)
    throw new Error(`Resend send failed [${res.status}]: ${body.slice(0, 500)}`)
  }
  try { return { id: JSON.parse(body)?.id ?? null } } catch { return { id: null } }
}
