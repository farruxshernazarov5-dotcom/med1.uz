import { supabase } from '@/integrations/supabase/client';

export type ClickRequest = {
  id: string; user_id: string; kind: string; subject: string; message: string;
  status: string; response: string; platform: string | null; created_at: string; updated_at: string;
};
export function validateClickRequest(subject: string, message: string) {
  if (!subject.trim() || subject.trim().length > 160) throw new Error('Mavzu 1–160 belgidan iborat bo‘lsin.');
  if (!message.trim() || message.trim().length > 2000) throw new Error('Xabar 1–2000 belgidan iborat bo‘lsin.');
  return { subject: subject.trim(), message: message.trim() };
}
export async function readClickRequests() {
  const { data, error } = await supabase.from('click_partner_requests').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as ClickRequest[];
}
export async function submitClickRequest(userId: string, subject: string, message: string) {
  const values = validateClickRequest(subject, message);
  const { error } = await supabase.from('click_partner_requests').insert({ user_id: userId, ...values, kind: 'support', status: 'new' });
  if (error) throw error;
}