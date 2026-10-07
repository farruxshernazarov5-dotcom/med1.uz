import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type ProfileMenu, profileTitle } from '@/data/mobileProfileCatalog';
import { cn } from '@/lib/utils';
export function MobileProfileStory({ menu, lang, onClose, onOpen }: { menu: ProfileMenu | null; lang: string; onClose: () => void; onOpen: () => void }) {
 const [frame,setFrame] = useState(0); const [paused,setPaused] = useState(false);
 useEffect(() => { setFrame(0); setPaused(window.matchMedia('(prefers-reduced-motion: reduce)').matches); },[menu?.id]);
 useEffect(() => { if (!menu || paused) return; const t=window.setInterval(()=>setFrame(i=>(i+1)%3),5000); return ()=>clearInterval(t); },[menu,paused]);
 if (!menu) return null;
 return <Dialog open onOpenChange={o=>!o&&onClose()}><DialogContent className="profile-story fixed inset-0 left-0 top-0 z-[80] flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 p-0 sm:rounded-none [&>button]:hidden">
 <div className="absolute inset-0" aria-hidden="true">{menu.frames.map((src,i)=><img key={src} src={src} alt="" width={504} height={1024} loading={i===0?'eager':'lazy'} className={cn('profile-story-photo absolute inset-0 h-full w-full object-cover',frame===i&&'is-active')} />)}<div className="profile-story-scrim absolute inset-0" /></div>
 <div className="relative flex h-full flex-col overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))]">
 <div className="flex items-center gap-2"><Button variant="secondary" size="icon" onClick={onClose} aria-label="Orqaga"><ArrowLeft /></Button><div className="flex flex-1 gap-1">{menu.frames.map((_,i)=><Button key={i} variant="ghost" className={cn('h-8 flex-1 p-0',frame===i?'opacity-100':'opacity-40')} onClick={()=>setFrame(i)} aria-label={`${i+1}-qadam`} aria-pressed={frame===i}><span className="profile-story-progress h-1 w-full rounded-full" /></Button>)}</div><Button variant="secondary" size="icon" onClick={()=>setPaused(!paused)} aria-label={paused?'Davom ettirish':'To‘xtatish'}>{paused?<Play/>:<Pause/>}</Button><Button variant="secondary" size="icon" onClick={onClose} aria-label="Yopish"><X/></Button></div>
  <div className="mt-auto pt-36"><p className="text-xs font-semibold">MED ALL · {frame+1} / 3</p><DialogTitle className="mt-3 text-3xl font-bold leading-tight">{lang==='uz'?menu.phrases[frame]:profileTitle(menu,lang)}</DialogTitle><DialogDescription className="profile-story-copy mt-3 text-base">{lang==='uz'?menu.features[frame]:profileTitle(menu,lang)}</DialogDescription><p className="profile-story-copy mt-3 text-sm">{profileTitle(menu,lang)}</p><Button size="lg" className="mt-6 w-full bg-card text-card-foreground hover:bg-card/90" onClick={onOpen}>{lang==='ru'?'Открыть раздел':lang==='en'?'Open section':'Bo‘limni ochish'}<ArrowRight/></Button></div>
 </div></DialogContent></Dialog>;
}
