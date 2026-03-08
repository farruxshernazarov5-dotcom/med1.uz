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
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="uz" dir="ltr">
    <Head />
    <Preview>Med1.uz — Sizni taklif qilishdi</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://wiqcfyecdmararxqdmfk.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="Med1.uz" width="120" height="40" style={logo} />
        <Heading style={h1}>Sizni taklif qilishdi</Heading>
        <Text style={text}>
          Sizni <Link href={siteUrl} style={link}><strong>Med1.uz</strong></Link> platformasiga qo'shilishga taklif qilishdi. Taklifni qabul qilish uchun quyidagi tugmani bosing.
        </Text>
        <Button style={button} href={confirmationUrl}>Taklifni qabul qilish</Button>
        <Text style={footer}>
          Agar siz ushbu taklifni kutmagan bo'lsangiz, xabarni e'tiborsiz qoldiring.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#0ea5e9', textDecoration: 'underline' }
const button = { backgroundColor: '#0ea5e9', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0', lineHeight: '1.5' }
