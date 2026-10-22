import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMobileFavorites } from "@/hooks/useMobileFavorites";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function PatientFavorites() {
  const { user } = useAuth();
  const favorites = useMobileFavorites();
  const [clinics, setClinics] = useState<{id:string; clinic_id:string; name:string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    let active = true;
    setClinics([]);
    if (!user) return;
    setLoading(true);
    void supabase.from("favorite_clinics").select("id, clinic_id, registered_clinics(name)").eq("user_id", user.id).then(({data,error}) => {
      if (!active) return;
      setFailed(!!error);
      setClinics((data ?? []).map(c => ({id:c.id,clinic_id:c.clinic_id,name:c.registered_clinics?.name ?? "Klinika"})));
      setLoading(false);
    });
    return () => { active = false; };
  }, [user]);
  const items = [
    ...favorites.items.map(f => ({...f, legacyId: null as string | null})),
    ...clinics.filter(c => !favorites.has("clinic", c.clinic_id)).map(c => ({id:c.id,entity_type:"clinic" as const,entity_id:c.clinic_id,label:c.name,route:`/clinics/${c.clinic_id}`,metadata:{},legacyId:c.id})),
  ];
  const remove = async (item: typeof items[number]) => {
    if (!user) return;
    setBusy(item.id);
    // A clinic may be present in both old and new catalogues; remove both.
    const legacy = clinics.find(c => item.entity_type === "clinic" && c.clinic_id === item.entity_id);
    if (legacy) {
      const {error} = await supabase.from("favorite_clinics").delete().eq("id",legacy.id).eq("user_id",user.id);
      if(error) { setBusy(null); toast({title:"O‘chirilmadi",variant:"destructive"}); return; }
      setClinics(current => current.filter(c => c.id !== legacy.id));
    }
    if (!item.legacyId) {
      const {error} = await favorites.remove(item.id);
      if(error) { setBusy(null); toast({title:"O‘chirilmadi",variant:"destructive"}); return; }
    }
    setBusy(null);
    toast({title:"Sevimlilardan olib tashlandi"});
  };
  if (!user) return <Button asChild><Link to="/auth">Tizimga kirish</Link></Button>;
  if (loading || favorites.loading) return <div role="status" className="flex justify-center py-8"><Loader2 className="animate-spin"/></div>;
  return <div className="space-y-4">
    <h2 className="text-xl font-bold">Sevimlilar</h2>
    <div className="flex flex-wrap gap-2">{[["all","Barchasi"],["doctor","Shifokorlar"],["clinic","Klinikalar"],["service","Xizmatlar"]].map(([value,label]) => <Button key={value} size="sm" variant={filter===value?"default":"outline"} onClick={()=>setFilter(value)}>{label}</Button>)}</div>
    {(failed || favorites.error) && <p role="alert" className="text-sm text-destructive">Sevimlilar to‘liq yuklanmadi. Sahifani yangilang.</p>}
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{items.filter(f=>filter==="all"||f.entity_type===filter).map(item=><div key={`${item.entity_type}-${item.entity_id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <Heart className="h-5 w-5 shrink-0 text-primary"/>
      <Link to={item.route} className="min-w-0 flex-1 break-words font-semibold hover:text-primary">{item.label}<span className="mt-1 block text-xs font-normal text-muted-foreground">{item.entity_type==="doctor"?"Shifokor":item.entity_type==="clinic"?"Klinika":"Tibbiy xizmat"}</span></Link>
      <Button size="icon" variant="ghost" aria-label={`${item.label} — sevimlidan olib tashlash`} disabled={busy!==null} onClick={()=>void remove(item)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
    </div>)}</div>
    {!items.some(f=>filter==="all"||f.entity_type===filter)&&<div className="py-10 text-center text-muted-foreground"><Heart className="mx-auto mb-3 h-10 w-10"/>Sevimlilar yo‘q<div className="mt-4"><Button asChild variant="outline"><Link to="/mobile-services">Xizmatlarni ko‘rish</Link></Button></div></div>}
  </div>;
}
