import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { readClickRequests, submitClickRequest, type ClickRequest } from '@/lib/clickRequests';

const statuses: Record<string,string> = { new:'Yangi', in_progress:'Ko‘rib chiqilmoqda', resolved:'Javob berildi', client_reported:'Qurilma xabari — tekshirilmagan', server_confirmed:'Server tasdiqlagan QR amali' };
export default function ClickRequests({ admin = false }: { admin?: boolean }) {
  const { user } = useAuth();
  const [rows,setRows]=useState<ClickRequest[]>([]);
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const [subject,setSubject]=useState(''); const [message,setMessage]=useState('');
  const [responses,setResponses]=useState<Record<string,string>>({});
  const refresh=useCallback(async()=>{
    if(!user)return;
    setBusy(true);setError('');
    try{setRows(await readClickRequests());}catch{setError('So‘rovlarni o‘qib bo‘lmadi. Qayta urinib ko‘ring.');}finally{setBusy(false);}
  },[user?.id]);
  useEffect(()=>{void refresh();},[refresh]);
  const reply=async(row:ClickRequest)=>{
    const response=(responses[row.id]??row.response).trim();
    if(!response || response.length>2000)return;
    setBusy(true);
    const {error}=await supabase.from('click_partner_requests').update({response,status:'resolved',updated_at:new Date().toISOString()}).eq('id',row.id);
    if(error){setError('Javob saqlanmadi.');setBusy(false);}else await refresh();
  };
  const exportRows=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(rows,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='click-requests.json';a.click();URL.revokeObjectURL(url);
  };
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{admin?'Click so‘rovlari va ulanish hisobotlari':'Click so‘rovlarim'}</h2><div className="flex gap-2">{admin&&<Button variant="outline" size="icon" title="Hisobotni yuklab olish" aria-label="Hisobotni yuklab olish" onClick={exportRows} disabled={!rows.length}><Download/></Button>}<Button variant="outline" size="icon" aria-label="So‘rovlarni yangilash" onClick={()=>void refresh()} disabled={busy}><RefreshCw className={busy?'animate-spin':''}/></Button></div></div>
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
    {!admin&&user&&<form className="space-y-3 border-b border-border pb-6" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await submitClickRequest(user.id,subject,message);setSubject('');setMessage('');await refresh();}catch(e){setError(e instanceof Error?e.message:'So‘rov saqlanmadi.');setBusy(false);}}}>
      <label className="block space-y-2 text-sm"><span>Mavzu</span><Input required maxLength={160} value={subject} onChange={e=>setSubject(e.target.value)}/></label>
      <label className="block space-y-2 text-sm"><span>Xabar</span><Textarea required maxLength={2000} rows={4} value={message} onChange={e=>setMessage(e.target.value)}/></label>
      <Button disabled={busy||!subject.trim()||!message.trim()} type="submit"><Send className="h-4 w-4"/>Yuborish</Button>
    </form>}
    {busy&&!rows.length&&<Loader2 className="animate-spin"/>}
    {!busy&&!rows.length&&<p className="py-8 text-center text-muted-foreground">Hozircha so‘rovlar yo‘q.</p>}
    <div className="divide-y divide-border">{rows.map(row=><article key={row.id} className="space-y-3 py-5">
      <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 break-words font-semibold">{row.subject}</h3><Badge variant="outline" className="whitespace-normal">{statuses[row.status]??row.status}</Badge></div>
      <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString('uz-UZ')} · {row.kind}{row.platform?` · ${row.platform}`:''}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{row.message}</p>
      {row.response&&<div className="border-l-2 border-secondary pl-4"><p className="text-xs text-muted-foreground">Med1 javobi</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{row.response}</p></div>}
      {admin&&row.kind==='support'&&<div className="space-y-2"><Textarea aria-label={`${row.subject} uchun javob`} maxLength={2000} value={responses[row.id]??row.response} onChange={e=>setResponses({...responses,[row.id]:e.target.value})}/><Button size="sm" onClick={()=>void reply(row)} disabled={busy||!(responses[row.id]??row.response).trim()}><Send className="h-4 w-4"/>Javobni saqlash</Button></div>}
    </article>)}</div>
  </section>;
}