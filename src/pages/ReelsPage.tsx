import { useEffect,useRef,useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, Loader2, Play, Plus, Share2, Trash2, Upload, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs,TabsList,TabsTrigger } from '@/components/ui/tabs';
import { Dialog,DialogContent,DialogDescription,DialogTitle } from '@/components/ui/dialog';
import { getEmbedUrl } from '@/components/media/mediaLinks';
import { allowedReelUrl,reelFileError,type Reel } from '@/lib/reels';
import { toast } from 'sonner';

function ReelMedia({reel}:{reel:Reel}) {
 const element=useRef<HTMLVideoElement>(null);
 const [visible,setVisible]=useState(false);
 const container=useRef<HTMLDivElement>(null);
 useEffect(()=>{const target=container.current;if(!target)return;const observer=new IntersectionObserver(entries=>{const active=entries[0]?.isIntersecting??false;setVisible(active);if(!active)element.current?.pause();},{threshold:0.55});observer.observe(target);return()=>observer.disconnect();},[]);
 const url=reel.url??reel.external_url??'';
 const embed=getEmbedUrl(url);
 const instagram=(()=>{try{const u=new URL(url);return ['instagram.com','www.instagram.com'].includes(u.hostname)&&/^\/(reel|p)\/[\w-]+\/?$/.test(u.pathname)?`https://www.instagram.com${u.pathname.replace(/\/$/,'')}/embed/`:null;}catch{return null;}})();
 return <div ref={container} className="relative mx-auto aspect-[9/16] max-h-[70dvh] w-full overflow-hidden rounded-lg bg-muted">
  {reel.media_kind==='photo'?<img src={url} alt={reel.title} loading="lazy" className="h-full w-full object-contain"/>:reel.storage_path?<video ref={element} src={url} controls playsInline preload="metadata" className="h-full w-full object-contain"/>:(embed||instagram)&&visible?<iframe title={reel.title} src={embed??instagram??''} loading="lazy" className="h-full w-full" allow="encrypted-media; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allowFullScreen/>:<div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"><Play className="h-12 w-12 text-primary"/><p className="font-semibold">{reel.title}</p><Button asChild variant="outline"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink/>Videoni ochish</a></Button></div>}
 </div>;
}

export default function ReelsPage(){
 const {user}=useAuth();
 const [rows,setRows]=useState<Reel[]>([]),[view,setView]=useState('feed'),[loading,setLoading]=useState(true),[error,setError]=useState(false);
 const [canPublish,setCanPublish]=useState(false),[admin,setAdmin]=useState(false),[open,setOpen]=useState(false),[saving,setSaving]=useState(false);
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[url,setUrl]=useState(''),[file,setFile]=useState<File|null>(null);
 const click=sessionStorage.getItem('med1_click_entry')==='1';
 useEffect(()=>{if(!user){setAdmin(false);setCanPublish(false);return;}void supabase.from('user_roles').select('role').eq('user_id',user.id).then(({data})=>{setAdmin(!!data?.some(r=>r.role==='admin'));setCanPublish(!!data?.some(r=>['doctor','clinic','cosmetology','dental','diagnostics','maternity','pharmacy','admin'].includes(r.role)));});},[user?.id]);
 const load=async()=>{
  setLoading(true);setError(false);
  let query=supabase.from('medical_reels').select('*').order('created_at',{ascending:false}).limit(40);
  if(view==='mine'&&user)query=query.eq('owner_id',user.id);else if(view==='review'&&admin)query=query.eq('status','pending');else query=query.eq('status','approved');
  const {data,error:failed}=await query;
  if(failed){setError(true);setLoading(false);return;}
  const items:Reel[]=data??[];
  // Existing published expert videos are the same sources used on their public profiles.
  if(view==='feed'){
    const {data:existing}=await supabase.from('entity_media_links').select('*').eq('is_published',true).eq('kind','video').order('created_at',{ascending:false}).limit(20);
    const seen=new Set(items.map(r=>r.external_url));
    for(const source of existing??[]){if(seen.has(source.url)||!allowedReelUrl(source.url))continue;seen.add(source.url);items.push({id:`source:${source.id}`,title:source.title??'Mutaxassis videosi',description:source.description??'',media_kind:'social',external_url:source.url,storage_path:null,owner_id:source.owner_id,status:'approved',created_at:source.created_at});}
  }
  await Promise.all(items.map(async item=>{if(item.storage_path){const {data:signed}=await supabase.storage.from('medical-reels').createSignedUrl(item.storage_path,3600);item.url=signed?.signedUrl;}}));
  setRows(items);setLoading(false);
 };
 useEffect(()=>{void load();},[view,user?.id,admin]);
 const save=async()=>{
  if(!user||!canPublish)return;
  if(!title.trim())return toast.error('Sarlavha kiriting');
  if(!file&&!allowedReelUrl(url))return toast.error('Ijtimoiy tarmoqdagi to‘liq HTTPS havolasini kiriting');
  if(file){const invalid=reelFileError(file);if(invalid)return toast.error(invalid);}
  setSaving(true);let path:string|null=null;
  try{
   if(file){path=`${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase()??'mp4'}`;const {error:upload}=await supabase.storage.from('medical-reels').upload(path,file,{contentType:file.type});if(upload)throw upload;}
   const {error:insert}=await supabase.from('medical_reels').insert({owner_id:user.id,title:title.trim(),description:description.trim(),media_kind:file?(file.type.startsWith('image/')?'photo':'video'):'social',storage_path:path,external_url:file?null:url.trim(),status:'pending'});
   if(insert)throw insert;
   setOpen(false);setTitle('');setDescription('');setUrl('');setFile(null);setView('mine');toast.success('Material tekshirishga yuborildi');void load();
  }catch(err){if(path)await supabase.storage.from('medical-reels').remove([path]);toast.error(err instanceof Error?err.message:'Material saqlanmadi');}finally{setSaving(false);}
 };
 const review=async(id:string,status:'approved'|'rejected')=>{const {error}=await supabase.from('medical_reels').update({status}).eq('id',id);if(error)toast.error('Holat o‘zgarmadi');else void load();};
 const remove=async(reel:Reel)=>{if(!confirm('Material o‘chirilsinmi?'))return;const {error}=await supabase.from('medical_reels').delete().eq('id',reel.id);if(error)return toast.error('O‘chirilmadi');if(reel.storage_path)await supabase.storage.from('medical-reels').remove([reel.storage_path]);void load();};
 return <main className="min-h-screen bg-background pb-28 text-foreground"><Helmet><title>Med Reels — MED ALL</title><meta name="description" content="Shifokor va mutaxassislarning tibbiy foto-video materiallari."/></Helmet><header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur"><div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3"><Button asChild variant="ghost" size="icon" aria-label="Orqaga"><Link to={click?'/click':'/'}><ArrowLeft/></Link></Button><h1 className="flex-1 text-xl font-bold">Med Reels</h1>{canPublish&&<Button size="sm" onClick={()=>setOpen(true)}><Plus/>Yuklash</Button>}</div></header>
 <div className="mx-auto max-w-4xl px-4 py-5"><Tabs value={view} onValueChange={setView}><TabsList><TabsTrigger value="feed">Lenta</TabsTrigger>{user&&<TabsTrigger value="mine">Materiallarim</TabsTrigger>}{admin&&<TabsTrigger value="review">Tekshirish</TabsTrigger>}</TabsList></Tabs>
 {loading?<div role="status" className="grid place-items-center py-20"><Loader2 className="animate-spin"/></div>:error?<div role="alert" className="py-12 text-center"><p>Materiallar yuklanmadi.</p><Button variant="outline" onClick={()=>void load()}>Qayta urinish</Button></div>:rows.length===0?<p className="py-16 text-center text-muted-foreground">Hozircha materiallar yo‘q.</p>:<div className="mt-5 grid gap-8 md:grid-cols-2">{rows.map(reel=><article key={reel.id} className="min-w-0"><ReelMedia reel={reel}/><div className="flex items-start gap-3 pt-3"><div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{reel.title}</h2><p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{reel.description}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(reel.created_at).toLocaleDateString('uz-UZ')}{view!=='feed'&&` · ${reel.status==='pending'?'Tekshirilmoqda':reel.status==='approved'?'Chop etilgan':'Rad etilgan'}`}</p></div><Button variant="ghost" size="icon" aria-label="Ulashish" onClick={()=>{const link=reel.external_url??`${window.location.origin}/reels`;void (navigator.share?navigator.share({title:reel.title,url:link}):navigator.clipboard.writeText(link).then(()=>toast.success('Havola nusxalandi'))).catch(()=>{});}}><Share2/></Button>{!reel.id.startsWith('source:')&&(reel.owner_id===user?.id||admin)&&<Button variant="ghost" size="icon" aria-label="O‘chirish" onClick={()=>void remove(reel)}><Trash2/></Button>}</div>{view==='review'&&<div className="mt-3 flex gap-2"><Button onClick={()=>void review(reel.id,'approved')}><Check/>Tasdiqlash</Button><Button variant="outline" onClick={()=>void review(reel.id,'rejected')}><X/>Rad etish</Button></div>}</article>)}</div>}
 <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">Materiallar ma’lumot uchun. Shaxsiy tashxis va davolash uchun shifokorga murojaat qiling.</p></div>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Yangi material</DialogTitle><DialogDescription>Faqat o‘zingizga tegishli yoki ruxsat olingan material. Bemorlarning shaxsiy ma’lumotlarini yuklamang. Chop etishdan oldin tekshiriladi.</DialogDescription><Input aria-label="Sarlavha" placeholder="Sarlavha" maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/><Textarea aria-label="Tavsif" placeholder="Tavsif" maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/><Input aria-label="Reels havolasi" placeholder="https://… ijtimoiy tarmoq havolasi" value={url} disabled={!!file} onChange={e=>setUrl(e.target.value)}/><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4"><Upload className="text-primary"/><span className="min-w-0 break-all text-sm">{file?.name??'Foto yoki video tanlash · 50 MB'}</span><input aria-label="Reels fayli" type="file" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp" className="sr-only" onChange={e=>{setFile(e.target.files?.[0]??null);e.target.value='';}}/></label>{file&&<Button variant="ghost" onClick={()=>setFile(null)}><X/>Faylni olib tashlash</Button>}<Button disabled={saving} onClick={()=>void save()}>{saving?<Loader2 className="animate-spin"/>:<Plus/>}Tekshirishga yuborish</Button></DialogContent></Dialog>
 </main>;
}