import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Med1.uz'

interface TaxReportProps {
  companyName?: string
  inn?: string
  period?: string
  revenue?: string
  rate?: number
  taxAmount?: string
  sourcesHtml?: string
  note?: string
}

const TaxReportEmail = ({
  companyName, inn, period, revenue, rate, taxAmount, sourcesHtml, note,
}: TaxReportProps) => (
  <Html lang="uz" dir="ltr">
    <Head />
    <Preview>{`Aylanma solig'i hisoboti — ${period || ''}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={logo}>🧾 {SITE_NAME}</Heading>
          <Text style={headerSubtitle}>AYLANMA SOLIG'I HISOBOTI</Text>
        </Section>

        <Heading style={h1}>{companyName || SITE_NAME}</Heading>
        <Text style={sub}>STIR: {inn || '—'} · Davr: <b>{period || '—'}</b></Text>

        <Section style={infoBox}>
          <Text style={row}><span>Umumiy aylanma:</span> <b>{revenue || '0'} so'm</b></Text>
          <Text style={row}><span>Soliq stavkasi:</span> <b>{rate ?? 4}%</b></Text>
          <Hr style={hrInner} />
          <Text style={rowBig}><span>To'lanishi lozim:</span> <b>{taxAmount || '0'} so'm</b></Text>
        </Section>

        {sourcesHtml && (
          <Section style={{ padding: '0 32px' }}>
            <Heading as="h3" style={h3}>Daromad manbalari</Heading>
            <div dangerouslySetInnerHTML={{ __html: sourcesHtml }} />
          </Section>
        )}

        {note && (
          <Section style={{ padding: '0 32px' }}>
            <Text style={noteText}>{note}</Text>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} — hisobot avtomatik shakllantirildi. Rasmiy topshirish uchun my.soliq.uz portali orqali yuklang.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TaxReportEmail,
  subject: (data: Record<string, any>) =>
    `🧾 Aylanma solig'i hisoboti — ${data.period || ''} | ${SITE_NAME}`,
  displayName: 'Tax report (Aylanma solig\'i)',
  previewData: {
    companyName: 'MED-ALL AI SYSTEM MCHJ',
    inn: '309876543',
    period: "Yanvar 2026",
    revenue: '125 000 000',
    rate: 4,
    taxAmount: '5 000 000',
    sourcesHtml: '<p>Click — 45 000 000 so\'m<br/>Payme — 80 000 000 so\'m</p>',
    note: 'Ushbu hisobot Med1.uz platformasi orqali yuborildi.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '640px', margin: '0 auto' }
const headerSection = {
  padding: '24px 32px', borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const, backgroundColor: '#0A2540',
}
const logo = { color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '0' }
const headerSubtitle = { color: '#93c5fd', fontSize: '12px', margin: '6px 0 0', letterSpacing: '0.1em' }
const h1 = { fontSize: '18px', fontWeight: '700', color: '#0A2540', margin: '20px 32px 4px' }
const h3 = { fontSize: '14px', color: '#0A2540', margin: '18px 0 8px' }
const sub = { fontSize: '13px', color: '#475569', margin: '0 32px 16px' }
const infoBox = {
  backgroundColor: '#f1f5f9', borderRadius: '10px',
  padding: '14px 18px', margin: '0 32px 16px', border: '1px solid #e2e8f0',
}
const row = { fontSize: '13px', color: '#334155', margin: '4px 0', display: 'flex', justifyContent: 'space-between' }
const rowBig = { fontSize: '16px', color: '#0A2540', margin: '6px 0 0', fontWeight: 700 }
const hrInner = { borderColor: '#cbd5e1', margin: '8px 0' }
const hr = { borderColor: '#e2e8f0', margin: '16px 32px' }
const noteText = { fontSize: '12px', color: '#64748b', fontStyle: 'italic' as const }
const footer = { fontSize: '11px', color: '#94a3b8', margin: '0 32px 24px', textAlign: 'center' as const }
