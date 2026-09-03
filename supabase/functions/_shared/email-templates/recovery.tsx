/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="uz" dir="ltr">
    <Head />
    <Preview>Med1.uz — Parolni tiklash</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://wiqcfyecdmararxqdmfk.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Med1.uz" width="120" height="40" style={logo} />
        <Heading style={h1}>Parolni tiklash</Heading>
        <Text style={text}>
          Med1.uz hisobingiz uchun parolni tiklash so'rovi qabul qilindi. Yangi parol yaratish uchun quyidagi tugmani bosing.
        </Text>
        <Button style={button} href={confirmationUrl}>Parolni tiklash</Button>
        <Text style={footer}>
          Agar siz parolni tiklash so'rovini yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring. Parolingiz o'zgarmaydi.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#0ea5e9', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0', lineHeight: '1.5' }
