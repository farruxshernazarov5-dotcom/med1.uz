import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Med1.uz"

interface LabResultProps {
  patientName?: string
  testName?: string
  testCategory?: string
  resultsCount?: number
  abnormalCount?: number
  resultsSummary?: string
  date?: string
}

const LabResultNotificationEmail = ({
  patientName,
  testName,
  testCategory,
  resultsCount,
  abnormalCount,
  resultsSummary,
  date,
}: LabResultProps) => (
  <Html lang="uz" dir="ltr">
    <Head />
    <Preview>🧪 Analiz natijangiz tayyor — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={logo}>🏥 {SITE_NAME}</Heading>
          <Text style={headerSubtitle}>Laboratoriya natijasi</Text>
        </Section>

        <Heading style={h1}>
          {patientName ? `Hurmatli ${patientName},` : 'Hurmatli bemor,'}
        </Heading>

        <Text style={text}>
          Sizning laboratoriya tahlil natijangiz tayyor bo'ldi.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}>🧪 <strong>Tahlil:</strong> {testName || 'Laboratoriya tahlili'}</Text>
          {testCategory && <Text style={infoText}>📂 <strong>Toifa:</strong> {testCategory}</Text>}
          <Text style={infoText}>📅 <strong>Sana:</strong> {date || new Date().toISOString().slice(0, 10)}</Text>
          {resultsCount !== undefined && (
            <Text style={infoText}>📊 <strong>Parametrlar:</strong> {resultsCount} ta</Text>
          )}
          {abnormalCount !== undefined && abnormalCount > 0 ? (
            <Text style={warningText}>⚠️ <strong>Normadan tashqari:</strong> {abnormalCount} ta ko'rsatkich</Text>
          ) : (
            <Text style={successText}>✅ Barcha ko'rsatkichlar normal</Text>
          )}
        </Section>

        {resultsSummary && (
          <Section style={summaryBox}>
            <Text style={summaryTitle}>📋 Natijalar:</Text>
            <Text style={summaryText}>{resultsSummary}</Text>
          </Section>
        )}

        <Section style={ctaSection}>
          <Button style={ctaButton} href="https://med1-uz.lovable.app/dashboard">
            📊 Natijani ko'rish
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={disclaimer}>
          ⚠️ Bu xabar avtomatik yuborilgan. Natijalar bo'yicha savollar uchun shifokoringizga murojaat qiling.
          Bu hujjat rasmiy tibbiy hujjat o'rnini bosmaydi.
        </Text>

        <Text style={footer}>
          {SITE_NAME} — O'zbekistonning yetakchi tibbiy platformasi
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LabResultNotificationEmail,
  subject: (data: Record<string, any>) =>
    `🧪 Analiz natijangiz tayyor${data.testName ? ` — ${data.testName}` : ''} | Med1.uz`,
  displayName: 'Lab result notification',
  previewData: {
    patientName: 'Abbos Karimov',
    testName: 'Umumiy qon tahlili (OAK)',
    testCategory: 'Qon tahlili',
    resultsCount: 14,
    abnormalCount: 2,
    date: '2026-04-13',
    resultsSummary: 'Gemoglobin: 118 g/L (⚠️ Normadan tashqari)\nEritrositlar: 4.2 (✅ Normal)',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const headerSection = {
  backgroundColor: '#0A2540',
  padding: '24px 32px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
}
const logo = { color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0' }
const headerSubtitle = { color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#0A2540', margin: '24px 32px 8px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 32px 20px' }
const infoBox = {
  backgroundColor: '#f0f4ff',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '0 32px 16px',
  border: '1px solid #dbeafe',
}
const infoText = { fontSize: '13px', color: '#334155', margin: '4px 0', lineHeight: '1.5' }
const warningText = { fontSize: '13px', color: '#dc2626', fontWeight: '600', margin: '8px 0 0' }
const successText = { fontSize: '13px', color: '#16a34a', fontWeight: '600', margin: '8px 0 0' }
const summaryBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 32px 16px',
  border: '1px solid #e2e8f0',
}
const summaryTitle = { fontSize: '12px', fontWeight: '600', color: '#475569', margin: '0 0 4px' }
const summaryText = { fontSize: '12px', color: '#64748b', whiteSpace: 'pre-line' as const, margin: '0', lineHeight: '1.6' }
const ctaSection = { textAlign: 'center' as const, margin: '8px 32px 24px' }
const ctaButton = {
  backgroundColor: '#2F80ED',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e2e8f0', margin: '0 32px' }
const disclaimer = { fontSize: '11px', color: '#94a3b8', margin: '16px 32px 8px', lineHeight: '1.5' }
const footer = { fontSize: '11px', color: '#94a3b8', margin: '0 32px 24px', textAlign: 'center' as const }
