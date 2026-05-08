import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SmartMatchResult {
  recommendation_id?: string;
  analysis: {
    keywords: string[];
    symptoms: string[];
    specialties: string[];
    intent_score: number;
    priority: "low" | "medium" | "high" | "critical";
    is_emergency: boolean;
    ai_summary: string;
  };
  clinics: any[];
  doctors: any[];
  promotions: any[];
}

export function useSmartMatch() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SmartMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const match = useCallback(async (input_text: string, opts?: { source_channel?: string; latitude?: number | null; longitude?: number | null; radius_km?: number; city?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      // Fall back to stored location prefs if not provided
      let { latitude, longitude, radius_km, city } = opts || {};
      if (latitude == null || longitude == null || radius_km == null) {
        try {
          const raw = localStorage.getItem("med1_location_prefs");
          if (raw) {
            const p = JSON.parse(raw);
            latitude = latitude ?? p.latitude ?? undefined;
            longitude = longitude ?? p.longitude ?? undefined;
            radius_km = radius_km ?? p.radius_km ?? undefined;
            city = city ?? p.city ?? undefined;
          }
        } catch {}
      }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/smart-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          input_text,
          source_channel: opts?.source_channel || "web_search",
          latitude, longitude, radius_km, city,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Smart Match xatosi");
      setResult(data);
      return data as SmartMatchResult;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackClick = useCallback(async (recommendation_id?: string, promotion_id?: string) => {
    if (!recommendation_id && !promotion_id) return;
    if (recommendation_id) {
      await supabase.from("ai_recommendations").update({ user_clicked: true }).eq("id", recommendation_id);
    }
    if (promotion_id) {
      const { data } = await supabase.from("promotions").select("click_count").eq("id", promotion_id).single();
      await supabase.from("promotions").update({ click_count: (data?.click_count || 0) + 1 }).eq("id", promotion_id);
    }
  }, []);

  return { match, trackClick, loading, result, error, reset: () => setResult(null) };
}
