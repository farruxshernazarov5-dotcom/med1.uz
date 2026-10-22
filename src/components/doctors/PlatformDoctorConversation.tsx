import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSecureScreen } from "@/lib/secureScreen";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Eye, ShieldCheck, Loader2, Video } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { isNativeApp } from "@/lib/nativeApp";

export type ConversationRequest = {id:string; patient_name:string; message:string; reply:string|null; meeting_url:string|null; status:string; request_type:string};
type Message = {id:string; sender_id:string; content:string; is_hidden:boolean};
export default function PlatformDoctorConversation({request, doctorSide=false, onUpdated}:{request:ConversationRequest; doctorSide?:boolean; onUpdated?:()=>void}) {
  const {user}=useAuth();
  useSecureScreen();
  const [messages,setMessages]=useState<Message[]>([]);
  const [text,setText]=useState("");
  const [busy,setBusy]=useState(false);
  const [failed,setFailed]=useState(false);
  const [revealed,setRevealed]=useState<string[]>([]);
  useEffect(()=>{
    let active=true;
    setMessages([]); setRevealed([]); setText("");
    const load=async()=>{
      const {data,error}=await supabase.from("platform_doctor_messages").select("id,sender_id,content,is_hidden").eq("request_id",request.id).order("created_at");
      if(active) {setFailed(!!error);if(!error) setMessages(data ?? []);}
      onUpdated?.();
    };
    void load(); const timer=window.setInterval(()=>void load(),5000);
    return ()=>{active=false;window.clearInterval(timer);};
  },[request.id,onUpdated]);
  const send=async()=>{
    const parsed=z.string().trim().min(1).max(2000).safeParse(text);
    if(!parsed.success||!user||busy)return;
    setBusy(true);
    const {data,error}=await supabase.from("platform_doctor_messages").insert({request_id:request.id,sender_id:user.id,content:parsed.data}).select("id,sender_id,content,is_hidden").single();
    setBusy(false);
    if(error){toast({title:"Xabar yuborilmadi",variant:"destructive"});return;}
    if(data)setMessages(current=>[...current.filter(m=>m.id!==data.id),data]);setText("");
  };
  const startVideo=async()=>{
    setBusy(true);
    const {error}=await supabase.from("platform_doctor_requests").update({meeting_url:`https://meet.jit.si/med1-${crypto.randomUUID()}`,status:"accepted"}).eq("id",request.id);
    setBusy(false);
    if(error)toast({title:"Video uchrashuv ochilmadi",variant:"destructive"});else onUpdated?.();
  };
  const safeRoom=(()=>{try{const url=new URL(request.meeting_url ?? "");return url.protocol==="https:"&&url.hostname==="meet.jit.si"?url.href:null;}catch{return null;}})();
  const openRoom=async()=>{
    if(!safeRoom)return;
    try { if(isNativeApp()){const {Browser}=await import("@capacitor/browser");await Browser.open({url:safeRoom});}else window.open(safeRoom,"_blank","noopener,noreferrer"); }
    catch {toast({title:"Konferensiya ochilmadi",variant:"destructive"});}
  };
  const bubble=(id:string,content:string,hidden:boolean,mine:boolean)=> <div key={id} className={`max-w-[90%] break-words rounded-lg p-3 text-sm ${mine?"ml-auto bg-primary text-primary-foreground":"mr-auto bg-muted text-foreground"}`}>
    {hidden&&!revealed.includes(id)?<div><p className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>Shaxsiy ma’lumot yashirildi</p><Button size="sm" variant="outline" className="bg-card text-foreground" onClick={()=>setRevealed(v=>[...v,id])}><Eye className="mr-2 h-4 w-4"/>Ko‘rsatish</Button></div>:<p className="whitespace-pre-wrap">{content}</p>}
  </div>;
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/><span className="text-xs text-muted-foreground">Parol, OTP va karta ma’lumotlarini yubormang</span></div>
    {failed&&<p role="alert" className="text-sm text-destructive">Xabarlar yuklanmadi.</p>}
    <div className="max-h-[45dvh] space-y-3 overflow-y-auto overscroll-contain pr-1" aria-live="polite">
      {bubble("initial",request.message,true,!doctorSide)}
      {request.reply&&bubble("reply",request.reply,true,doctorSide)}
      {messages.map(m=>bubble(m.id,m.content,m.is_hidden,m.sender_id===user?.id))}
    </div>
    {safeRoom?<Button className="w-full min-h-11" onClick={()=>void openRoom()}><Video className="mr-2 h-4 w-4"/>Jitsi konferensiyaga kirish</Button>:doctorSide?<Button variant="outline" disabled={busy} onClick={()=>void startVideo()}><Video className="mr-2 h-4 w-4"/>Video uchrashuvni tasdiqlash</Button>:request.request_type==="video"?<p className="text-xs text-muted-foreground">Shifokor video vaqtini tasdiqlashini kutmoqda</p>:null}
    <div className="flex items-end gap-2"><Textarea aria-label="Chat xabari" autoFocus rows={2} maxLength={2000} value={text} onChange={e=>setText(e.target.value)} disabled={busy||["declined","done"].includes(request.status)}/><Button size="icon" aria-label="Chat xabarini yuborish" className="h-11 w-11 shrink-0" disabled={busy||!text.trim()||["declined","done"].includes(request.status)} onClick={()=>void send()}>{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}</Button></div>
  </div>;
}