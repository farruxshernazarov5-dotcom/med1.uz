import { useSecureScreen } from '@/lib/secureScreen';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { NativeHealthSettings } from './NativeHealthSettings';
import { AppLockSettings } from './AppLockSettings';
import { DevicesPanel } from './DevicesPanel';
export default function MobileProfileSecurity() {
 useSecureScreen();
 const [current,setCurrent]=useState(''); const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState(''); const [busy,setBusy]=useState(false);
 async function change(e: React.FormEvent) { e.preventDefault(); if(password.length<8||password!==confirm) {toast.error('Kamida 8 belgili parol kiriting; ikkala yangi parol bir xil bo‘lsin.');return;} setBusy(true); try { const {error}=await supabase.auth.updateUser({password,current_password:current}); if(error) throw error; setCurrent('');setPassword('');setConfirm('');toast.success('Parol yangilandi'); } catch(e) {toast.error(e instanceof Error?e.message:'Parol yangilanmadi');} finally {setBusy(false);} }
 return <div className="space-y-6"><DevicesPanel/><AppLockSettings/><NativeHealthSettings/><section className="border-t border-border pt-5"><h2 className="mb-4 text-lg font-bold">Parolni o‘zgartirish</h2><form onSubmit={change} className="space-y-3"><Label htmlFor="current-password">Joriy parol</Label><Input id="current-password" type="password" autoComplete="current-password" value={current} onChange={e=>setCurrent(e.target.value)} required/><Label htmlFor="new-password">Yangi parol</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/><Label htmlFor="confirm-password">Yangi parolni takrorlang</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/><Button type="submit" disabled={busy}>Parolni yangilash</Button></form></section></div>;
}
