import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Med1.uz'

interface SecurityAlertProps {
  subject?: string
  htmlBody?: string
  scope?: string
  level?: string
  message?: string
}

const levelColor = (l?: string) =>
  l === 'error' ? '#dc2626' : l === 'warn' ? '#d97706' : '#2F80ED'

const SecurityAlertEmail = ({ subject, htmlBody, scope, level, message }: SecurityAlertProps) => (
  <Html lang="uz" dir="ltr">
    <Head />
    <Preview>{subject || `🛡️ Security alert — ${SITE_NAME}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ ...headerSection, backgroundColor: levelColor(level) }}>
          <Heading style={logo}>🛡️ {SITE_NAME} Security</Heading>
          <Text style={headerSubtitle}>
            {(level || 'info').toUpperCase()} · {scope || 'unknown'}
          </Text>
        </Section>

        <Heading style={h1}>{subject || 'Security event'}</Heading>

        {message && (
          <Section style={infoBox}>
            <Text style={infoText}><strong>Message:</strong> {message}</Text>
          </Section>
        )}

        {htmlBody && (
          <Section style={{ padding: '0 32px' }}>
            <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
          </Section>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} — automated security notification. Reply is not monitored.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SecurityAlertEmail,
  subject: (data: Record<string, any>) =>
    data.subject || `🛡️ Security alert${data.scope ? ` — ${data.scope}` : ''} | ${SITE_NAME}`,
  displayName: 'Security alert',
  previewData: {
    subject: '🛡️ Security: ERROR — api-gateway',
    scope: 'api-gateway',
    level: 'error',
    message: 'Upstream 502 from provider',
    htmlBody: '<p><b>Endpoint:</b> <code>/v1/chat</code></p>',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const headerSection = {
  padding: '24px 32px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
}
const logo = { color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0' }
const headerSubtitle = { color: '#f8fafc', fontSize: '13px', margin: '4px 0 0', letterSpacing: '0.05em' }
const h1 = { fontSize: '18px', fontWeight: '700', color: '#0A2540', margin: '24px 32px 8px' }
const infoBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '10px',
  padding: '14px 18px',
  margin: '0 32px 16px',
  border: '1px solid #e2e8f0',
}
const infoText = { fontSize: '13px', color: '#334155', margin: '4px 0', lineHeight: '1.5' }
const hr = { borderColor: '#e2e8f0', margin: '16px 32px' }
const footer = { fontSize: '11px', color: '#94a3b8', margin: '0 32px 24px', textAlign: 'center' as const }
