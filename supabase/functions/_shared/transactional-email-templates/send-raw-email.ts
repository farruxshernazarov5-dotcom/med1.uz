import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.1.0'

// Server-only: reads LOVABLE_API_KEY. Import from edge functions only.
// Used by senders that compose their own subject/HTML at send time and
// therefore cannot go through the registered-template helper.

const SITE_NAME = 'Health Hub Connect'
const SENDER_DOMAIN = 'notify.med1.uz'
const FROM_DOMAIN = 'med1.uz'

export type SendRawEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface SendRawEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  /** Short label used for logging/analytics of this send. */
  label: string
  idempotencyKey?: string
  replyTo?: string
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|tr|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function sendRawEmail(options: SendRawEmailOptions): Promise<SendRawEmailResult> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured')
  }

  try {
    await sendLovableEmail(
      {
        to: options.to,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: options.subject,
        html: options.html,
        text: options.text ?? htmlToText(options.html),
        purpose: 'transactional',
        label: options.label,
        idempotency_key: options.idempotencyKey || crypto.randomUUID(),
        reply_to: options.replyTo,
      },
      { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') }
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      return { sent: false, reason: 'recipient_suppressed' }
    }
    throw error
  }

  return { sent: true }
}
