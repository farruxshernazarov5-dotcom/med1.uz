import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

export type MobileFavorite = {
  id: string;
  entity_type: "clinic" | "doctor" | "service";
  entity_id: string;
  label: string;
  route: string;
  metadata: Json;
};

export function useMobileFavorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<MobileFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data, error: readError } = await supabase
      .from("mobile_favorites")
      .select("id, entity_type, entity_id, label, route, metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setError(!!readError);
    setItems((data as MobileFavorite[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
    const sync = () => { void refresh(); };
    window.addEventListener("med1-favorites-changed", sync);
    return () => window.removeEventListener("med1-favorites-changed", sync);
  }, [refresh]);

  const toggle = useCallback(async (favorite: Omit<MobileFavorite, "id">) => {
    if (!user) return { needsAuth: true };
    const existing = items.find((item) => item.entity_type === favorite.entity_type && item.entity_id === favorite.entity_id);
    if (existing) {
      const { error } = await supabase.from("mobile_favorites").delete().eq("id", existing.id).eq("user_id", user.id);
      if (!error) setItems((current) => current.filter((item) => item.id !== existing.id));
      if (!error) window.dispatchEvent(new Event("med1-favorites-changed"));
      return { needsAuth: false, error };
    }
    const { data, error } = await supabase
      .from("mobile_favorites")
      .insert({ entity_type: favorite.entity_type, entity_id: favorite.entity_id, label: favorite.label, route: favorite.route, metadata: favorite.metadata, user_id: user.id })
      .select("id, entity_type, entity_id, label, route, metadata")
      .single();
    if (data) { setItems((current) => [data as MobileFavorite, ...current]); window.dispatchEvent(new Event("med1-favorites-changed")); }
    return { needsAuth: false, error };
  }, [items, user]);

  const has = useCallback((type: MobileFavorite["entity_type"], id: string) =>
    items.some((item) => item.entity_type === type && item.entity_id === id), [items]);
  const remove = useCallback(async (id: string) => {
    if (!user) return { error: new Error("Sign in required") };
    const { error } = await supabase.from("mobile_favorites").delete().eq("id",id).eq("user_id",user.id);
    if (!error) { setItems(current=>current.filter(item=>item.id!==id)); window.dispatchEvent(new Event("med1-favorites-changed")); }
    return { error };
  }, [user]);

  return { items, loading, error, toggle, has, remove };
}