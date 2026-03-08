/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="uz" dir="ltr">
    <Head />
    <Preview>Med1.uz — Tasdiqlash kodi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://wiqcfyecdmararxqdmfk.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Med1.uz" width="120" height="40" style={logo} />
        <Heading style={h1}>Tasdiqlash kodi</Heading>
        <Text style={text}>Shaxsingizni tasdiqlash uchun quyidagi kodni kiriting:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Ushbu kod qisqa vaqt ichida amal qiladi. Agar siz ushbu kodni so'ramagan bo'lsangiz, xabarni e'tiborsiz qoldiring.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = { fontFamily: "'Plus Jakarta Sans', Courier, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#0ea5e9', margin: '0 0 30px', letterSpacing: '4px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0', lineHeight: '1.5' }
