import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Plus, Sparkles, Trash2, Eye, MousePointerClick, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Promo {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  promo_price: number | null;
  original_price: number | null;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  click_count: number;
  ai_generated: boolean;
  specialties: string[];
  keywords: string[];
}

interface Props { clinicId?: string; }

const ClinicPromotions = ({ clinicId }: Props) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", discount_percent: 0, original_price: 0, promo_price: 0,
    specialties: "", keywords: "", expires_at: "",
  });

  const fetchItems = async () => {
    if (!user) return;
    let q = supabase.from("promotions").select("*").order("created_at", { ascending: false });
    if (clinicId) q = q.eq("clinic_id", clinicId);
    else q = q.eq("owner_id", user.id);
    const { data } = await q;
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user, clinicId]);

  const submit = async () => {
    if (!user || !form.title.trim()) {
      toast({ title: "Sarlavha kiriting", variant: "destructive" });
      return;
    }
    setCreating(true);
    const payload: any = {
      owner_id: user.id,
      clinic_id: clinicId || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      discount_percent: Number(form.discount_percent) || 0,
      original_price: Number(form.original_price) || null,
      promo_price: Number(form.promo_price) || null,
      specialties: form.specialties.split(",").map(s => s.trim()).filter(Boolean),
      keywords: form.keywords.split(",").map(s => s.trim()).filter(Boolean),
      expires_at: form.expires_at || null,
      is_active: true,
    };
    const { error } = await supabase.from("promotions").insert(payload);
    setCreating(false);
    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aksiya qo'shildi" });
    setForm({ title: "", description: "", discount_percent: 0, original_price: 0, promo_price: 0, specialties: "", keywords: "", expires_at: "" });
    fetchItems();
  };

  const generateAI = async () => {
    if (!user) return;
    setAiLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-doctor-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Klinika uchun jozibali aksiya matnini o'zbek tilida yarating. Chegirma 20-30%. Format: title|description|specialties (vergul bilan). Faqat shu format, boshqa hech narsa.`
          }]
        })
      });
      // streaming - read all
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const p = JSON.parse(data);
            acc += p.choices?.[0]?.delta?.content || "";
          } catch {}
        }
      }
      const parts = acc.split("|").map(s => s.trim());
      if (parts.length >= 2) {
        setForm(f => ({
          ...f,
          title: parts[0] || f.title,
          description: parts[1] || f.description,
          specialties: parts[2] || f.specialties,
          discount_percent: 25,
        }));
        toast({ title: "AI taklifi tayyor" });
      }
    } catch (e: any) {
      toast({ title: "AI xato", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const remove = async (id: string) => {
    await supabase.from("promotions").delete().eq("id", id);
    fetchItems();
  };

  const toggle = async (p: Promo) => {
    await supabase.from("promotions").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
          <Tag className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">Aksiyalar</h2>
          <p className="text-xs text-muted-foreground">Bemorlarga ko'rsatish uchun aksiyalar yarating</p>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Yangi aksiya</h3>
          <Button size="sm" variant="outline" onClick={generateAI} disabled={aiLoading} className="gap-1">
            {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI taklif
          </Button>
        </div>
        <Input placeholder="Sarlavha *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Textarea placeholder="Tavsif" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" placeholder="Chegirma %" value={form.discount_percent || ""} onChange={e => setForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} />
          <Input type="number" placeholder="Asl narx" value={form.original_price || ""} onChange={e => setForm(f => ({ ...f, original_price: Number(e.target.value) }))} />
          <Input type="number" placeholder="Aksiya narx" value={form.promo_price || ""} onChange={e => setForm(f => ({ ...f, promo_price: Number(e.target.value) }))} />
        </div>
        <Input placeholder="Mutaxassisliklar (vergul bilan): Stomatolog, Kardiolog" value={form.specialties} onChange={e => setForm(f => ({ ...f, specialties: e.target.value }))} />
        <Input placeholder="Kalit so'zlar: tish, og'riq, davolash" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} />
        <Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
        <Button onClick={submit} disabled={creating} className="w-full">
          {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Qo'shish
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Hozircha aksiyalar yo'q</div>
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
              {p.discount_percent ? (
                <div className="bg-gradient-to-br from-pink-500 to-orange-500 text-white text-xs font-bold rounded-lg px-2 py-1 shrink-0">-{p.discount_percent}%</div>
              ) : null}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{p.title}</p>
                  {p.ai_generated && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">AI</span>}
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.view_count}</span>
                  <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{p.click_count}</span>
                  {p.expires_at && <span>⏰ {new Date(p.expires_at).toLocaleDateString("uz-UZ")}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="outline" onClick={() => toggle(p)} className="text-xs h-7">
                  {p.is_active ? "Faol" : "Yashirin"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="text-xs h-7 text-destructive">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicPromotions;
