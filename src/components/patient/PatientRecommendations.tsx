import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSmartMatch } from "@/hooks/useSmartMatch";
import { SmartMatchResults } from "@/components/smart-match/SmartMatchResults";

const PatientRecommendations = () => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const { match, trackClick, loading, result, reset } = useSmartMatch();

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_recommendations")
      .select("id, input_text, ai_summary, priority, created_at, matched_clinic_ids, matched_promotion_ids")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data || []);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const submit = async () => {
    if (!text.trim()) return;
    await match(text, { source_channel: "dashboard" });
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">AI Tavsiyalar</h2>
          <p className="text-xs text-muted-foreground">Sizga eng mos klinika, shifokor va aksiyalar</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold mb-2">Nima qidiryapsiz?</p>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Masalan: yurak tekshiruvi yoki tish davolash..."
            disabled={loading}
          />
          <Button onClick={submit} disabled={loading || !text.trim()} className="bg-gradient-to-r from-purple-600 to-blue-600">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <SmartMatchResults result={result} onTrackClick={trackClick} />
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Oxirgi so'rovlar</h3>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold line-clamp-1">{h.input_text}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(h.created_at).toLocaleDateString("uz-UZ")}</span>
                </div>
                {h.ai_summary && <p className="text-xs text-muted-foreground line-clamp-2">{h.ai_summary}</p>}
                <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span>🏥 {h.matched_clinic_ids?.length || 0} klinika</span>
                  <span>🎁 {h.matched_promotion_ids?.length || 0} aksiya</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecommendations;
