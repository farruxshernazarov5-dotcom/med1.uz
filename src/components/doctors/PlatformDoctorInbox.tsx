import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import PlatformDoctorConversation, { type ConversationRequest } from "./PlatformDoctorConversation";

export default function PlatformDoctorInbox({doctorId}:{doctorId:string}) {
  const [requests,setRequests]=useState<ConversationRequest[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [failed,setFailed]=useState(false);
  const load=useCallback(async()=>{
    const {data,error}=await supabase.from("platform_doctor_requests").select("id,patient_name,message,reply,meeting_url,status,request_type").eq("doctor_id",doctorId).order("created_at",{ascending:false});
    setFailed(!!error);if(!error)setRequests(data ?? []);
  },[doctorId]);
  useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),10000);return()=>clearInterval(timer);},[load]);
  const active=requests.find(r=>r.id===selected);
  return <div className="mb-6 space-y-3"><h3 className="text-lg font-bold">Shaxsiy so‘rovlar va chat</h3>{failed&&<p role="alert" className="text-destructive">So‘rovlar yuklanmadi.</p>}
    <div className="flex flex-wrap gap-2">{requests.map(r=><Button key={r.id} variant={r.id===selected?"default":"outline"} className="h-auto min-h-11 whitespace-normal" onClick={()=>setSelected(r.id)}>{r.patient_name} · {r.request_type}</Button>)}</div>
    {active?<PlatformDoctorConversation request={active} doctorSide onUpdated={load}/>:<p className="text-sm text-muted-foreground">{requests.length?"Suhbatni tanlang":"Hozircha shaxsiy so‘rov yo‘q"}</p>}
  </div>;
}