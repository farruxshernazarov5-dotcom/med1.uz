import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const Email = () => (
  <Html lang="uz"><Head /><Preview>Taklifingiz uchun avans kartangizga 5 000 so‘m tushdi.</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
      <Container style={{ padding: '32px 24px', maxWidth: '560px', color: '#0A2540' }}>
        <Text>MED ALL · Med1.uz</Text>
        <Heading>5 000 so‘m bonus berildi</Heading>
        <Text>Taklif qilgan do‘stingizning birinchi pullik xaridi tasdiqlandi. Avans kartangizga 5 000 so‘m bonus qo‘shildi.</Text>
        <Text>Bonusni tarif yoki Med Coin xaridiga ishlatishingiz mumkin. Uni boshqa kartaga o‘tkazib bo‘lmaydi.</Text>
        <Button href="https://med1.uz/referral" style={{ backgroundColor: '#2F80ED', color: '#ffffff', padding: '14px 20px', borderRadius: '6px' }}>Bonus hisobimni ochish</Button>
      </Container>
    </Body>
  </Html>
)
export const template = { component: Email, subject: 'Taklifingiz uchun 5 000 so‘m bonus berildi — Med1.uz', displayName: 'Pullik taklif bonusi', previewData: {} } satisfies TemplateEntry