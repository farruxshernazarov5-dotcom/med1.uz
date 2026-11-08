import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Brain, CalendarCheck, Home, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getClickMiniAppState, returnToClick, subscribeClickMiniApp } from '@/lib/clickMiniApp';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function ClickExperience() {
  const {pathname,search}=useLocation(); const {user}=useAuth();
  const host=useSyncExternalStore(subscribeClickMiniApp,getClickMiniAppState,getClickMiniAppState);
  const [attributed,setAttributed]=useState(()=>sessionStorage.getItem('med1_click_entry')==='1');
  useEffect(()=>{if(pathname==='/click'||pathname.startsWith('/click/')||host.active){sessionStorage.setItem('med1_click_entry','1');setAttributed(true);}},[pathname,host.active]);
  useEffect(()=>{document.documentElement.classList.toggle('click-partner',attributed);return()=>document.documentElement.classList.remove('click-partner');},[attributed]);
  useEffect(()=>{
    if(!host.active||!user)return;
    const key=`click_reported_${user.id}`;
    if(sessionStorage.getItem(key))return;
    let cancelled=false;
    void supabase.from('click_partner_requests').insert({user_id:user.id,kind:'sdk_report',subject:'Click SDK qurilma hisoboti',message:'Mijoz rasmiy SDK init javobini oldi. Click shaxsi server tomonidan tasdiqlanmagan.',status:'client_reported',platform:host.platform??'unknown'}).then(({error})=>{if(!error&&!cancelled)sessionStorage.setItem(key,'1');});
    return()=>{cancelled=true;};
  },[host.active,user?.id]);
  if(!attributed||pathname.startsWith('/admin')||pathname.startsWith('/auth'))return null;
  const items=[
    {to:'/click',label:'Asosiy',icon:Home,active:pathname==='/click'&&!search},
    {to:'/click/appointments',label:'Qabullar',icon:CalendarCheck,active:pathname==='/click/appointments'},
    {to:'/ai-orchestrator',label:'Med AI',icon:Brain,center:true,active:pathname==='/ai-orchestrator'},
    {to:'/click/profile',label:'Profil',icon:UserRound,active:pathname.startsWith('/click/profile')},
  ];
  return <nav aria-label="Click kabinet menyusi" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_hsl(var(--primary)/0.35)] backdrop-blur-md">
    <div className="mx-auto flex max-w-3xl items-end justify-between px-2 pt-1">
      <Button variant="ghost" type="button" onClick={returnToClick} className="h-auto w-14 flex-col gap-0.5 px-0 py-2 text-[10px] text-muted-foreground" aria-label="Clickka qaytish"><ArrowLeft className="h-5 w-5"/>Click</Button>
      {items.map(({to,label,icon:Icon,center,active})=>center
        ? <Link key={to} to={to} aria-label={label} className="-mt-6 flex flex-col items-center gap-0.5 text-[10px] font-medium text-primary"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg ring-4 ring-card"><Icon className="h-6 w-6"/></span>{label}</Link>
        : <Link key={to} to={to} aria-label={label} aria-current={active?'page':undefined} className={`relative flex w-14 flex-col items-center gap-0.5 py-2 text-[10px] ${active?'font-semibold text-primary':'text-muted-foreground'}`}>{active&&<span className="absolute top-0 h-0.5 w-6 rounded-full bg-primary"/>}<Icon className="h-5 w-5"/>{label}</Link>)}
    </div>
  </nav>;
}
