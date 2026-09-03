// Appends a row to the app's email_send_log table. Notification-only: a log
// failure never changes the send result.
type SupabaseLike = { from: (table: string) => any }

export type EmailLogStatus = 'sent' | 'suppressed' | 'failed'

export async function logEmailSend(
  client: SupabaseLike,
  entry: {
    templateName: string
    recipientEmail: string
    status: EmailLogStatus
    errorMessage?: string | null
  }
) {
  try {
    const { error } = await client.from('email_send_log').insert({
      message_id: null,
      template_name: entry.templateName,
      recipient_email: entry.recipientEmail,
      status: entry.status,
      error_message: entry.errorMessage ?? null,
    })
    if (error) {
      console.error('email_send_log insert failed', { code: error.code, message: error.message })
    }
  } catch (e) {
    console.error('email_send_log insert threw', e instanceof Error ? e.message : String(e))
  }
}
