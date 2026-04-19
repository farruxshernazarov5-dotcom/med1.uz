import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Phone, MessageCircle, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { doctorId: string; }

const STATUS_COLORS: Record<string, string> = {
  new: "bg-secondary/20 text-secondary",
  replied: "bg-amber-500/20 text-amber-700",
  closed: "bg-muted text-muted-foreground",
};

const DocBrandLeads = ({ doctorId }: Props) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    const { data } = await supabase.from("doctor_leads").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [doctorId]);

  const handleReply = async (id: string) => {
    if (!reply.trim()) return;
    await supabase.from("doctor_leads").update({ reply: reply.trim(), status: "replied" }).eq("id", id);
    toast({ title: "✅ Javob saqlandi" });
    setReplyingId(null); setReply("");
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("doctor_leads").update({ status }).eq("id", id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("doctor_leads").delete().eq("id", id);
    fetchData();
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-heading font-bold text-foreground text-lg">Bemor xabarlari ({leads.length})</h3>
        <div className="flex gap-1">
          {[
            { key: "all", label: "Hammasi" },
            { key: "new", label: "Yangi" },
            { key: "replied", label: "Javob berilgan" },
            { key: "closed", label: "Yopilgan" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
                filter === f.key ? "bg-secondary text-white border-secondary" : "bg-card text-muted-foreground border-border")}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          Xabarlar yo'q
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <div key={l.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-foreground">{l.full_name}</h4>
                    <Badge className={cn("text-xs", STATUS_COLORS[l.status])}>{l.status}</Badge>
                  </div>
                  <a href={`tel:${l.phone}`} className="text-xs text-secondary flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {l.phone}
                  </a>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleDateString("uz-UZ")}</span>
              </div>
              {l.message && <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{l.message}</p>}
              {l.reply && <p className="text-sm text-foreground bg-secondary/10 rounded-lg p-3"><strong>Javob:</strong> {l.reply}</p>}

              {replyingId === l.id ? (
                <div className="space-y-2">
                  <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Javob yozing..." rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReply(l.id)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">Yuborish</Button>
                    <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReply(""); }}>Bekor</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setReplyingId(l.id); setReply(l.reply || ""); }}>
                    <MessageCircle className="w-3 h-3 mr-1" /> Javob
                  </Button>
                  {l.status !== "closed" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(l.id, "closed")}>
                      <Check className="w-3 h-3 mr-1" /> Yopish
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(l.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocBrandLeads;
