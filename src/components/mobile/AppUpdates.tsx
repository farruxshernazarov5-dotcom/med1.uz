import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { APP_RELEASE, isUnseenRelease } from '@/data/appUpdates';
export default function AppUpdates() {
  const [open,setOpen]=useState(false);
  const [fresh,setFresh]=useState(()=>isUnseenRelease(localStorage.getItem('medall_updates_seen')));
  const seen=()=>{ localStorage.setItem('medall_updates_seen',APP_RELEASE.version);setFresh(false); };
  return <>
    <Button variant="outline" onClick={()=>{setOpen(true);seen();}} className="gap-2"><Sparkles className="h-4 w-4"/>Yangiliklar {fresh&&<span className="rounded bg-medical-green px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">NEW</span>}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Med ALL yangiliklari</DialogTitle><DialogDescription>{APP_RELEASE.version}</DialogDescription><div className="space-y-2">{APP_RELEASE.items.map(item=><Button key={item.path} asChild variant="ghost" className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={()=>setOpen(false)}><Link to={item.path}><span><span className="block font-semibold">{item.title}</span><span className="block text-xs text-muted-foreground">{item.text}</span></span></Link></Button>)}</div></DialogContent></Dialog>
  </>;
}