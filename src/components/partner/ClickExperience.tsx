import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Brain, MessageSquare, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getClickMiniAppState, returnToClick, subscribeClickMiniApp } from '@/lib/clickMiniApp';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function ClickExperience() {
  const {pathname}=useLocation(); const {user}=useAuth();
  const host=useSyncExternalStore(subscribeClickMiniApp,getClickMiniAppState,getClickMiniAppState);
  const [attributed,setAttributed]=useState(()=>sessionStorage.getItem('med1_click_entry')==='1');
  useEffect(()=>{if(pathname==='/click'||host.active){sessionStorage.setItem('med1_click_entry','1');setAttributed(true);}},[pathname,host.active]);
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
  return <nav aria-label="Click kabinet menyusi" className="fixed bottom-20 left-1/2 z-50 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-md lg:bottom-4">
    <Button variant="ghost" size="sm" onClick={returnToClick}><ArrowLeft className="h-4 w-4"/>Clickka qaytish</Button>
    <Button asChild variant="ghost" size="icon"><Link to="/click" aria-label="Barcha Med AI xizmatlari"><Brain/></Link></Button>
    <Button asChild variant="ghost" size="icon"><Link to="/mobile-profile" aria-label="Shaxsiy kabinet"><UserRound/></Link></Button>
    <Button asChild variant="ghost" size="icon"><Link to="/click?view=requests" aria-label="Click so‘rovlarim"><MessageSquare/></Link></Button>
  </nav>;
}