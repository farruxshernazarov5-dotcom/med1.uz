import { useCallback, useEffect, useMemo, useState } from "react";

import { useMobileFavorites } from "@/hooks/useMobileFavorites";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
const CHANGE_EVENT = "med1-doctor-selection";
const COMPARE_KEY = "med1_doctor_compare";

function read(key: string): string[] {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []; } catch { return []; }
}

export function useDoctorFavorites() {
  const favorites = useMobileFavorites();
  const ids = useMemo(() => favorites.items.filter(f => f.entity_type === "doctor").map(f => f.entity_id), [favorites.items]);
  const toggle = useCallback(async (id: string) => {
    const { data, error } = await supabase.from("doctors_external").select("name, slug, primary_specialty").eq("id", id).maybeSingle();
    if (!data || error) { toast({title:"Shifokor ma’lumotlari yuklanmadi",variant:"destructive"}); return; }
    const result = await favorites.toggle({entity_type:"doctor",entity_id:id,label:data.name,route:`/doctors/ext/${data.slug}`,metadata:{specialty:data.primary_specialty}});
    if(result.needsAuth) toast({title:"Sevimlilarni saqlash uchun tizimga kiring"});
    else if(result.error) toast({title:"Saqlanmadi",variant:"destructive"});
  }, [favorites.toggle]);
  return { ids, toggle, has: (id:string) => favorites.has("doctor",id) };
}

export function useDoctorCompare() {
  const [ids, setIds] = useState<string[]>(() => read(COMPARE_KEY));

  useEffect(() => {
    const sync = () => setIds(read(COMPARE_KEY));
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      let next: string[];
      if (prev.includes(id)) next = prev.filter(x => x !== id);
      else if (prev.length >= 4) next = [...prev.slice(1), id];
      else next = [...prev, id];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      queueMicrotask(() => window.dispatchEvent(new Event(CHANGE_EVENT)));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.setItem(COMPARE_KEY, "[]");
    setIds([]);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, has, clear };
}
