import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Users, Plus, Search, Trash2, Loader2, Star, Phone, Crown, TrendingUp, UserPlus,
  Calendar, DollarSign, Image as ImageIcon, FileText, Sparkles, MessageCircle,
  Activity, Package as PackageIcon, Heart, Bell, Send, Upload, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SKIN_TYPES = ["Quruq", "Yog'li", "Aralash", "Sezgir", "Normal"];
const CONCERNS = ["Akne", "Pigmentatsiya", "Ajinlar", "Quyosh dog'lari", "Kapillarlar", "Kuper rozaceya", "Quruqlik", "Yog'lilik"];
const SOURCES = ["Instagram", "Tavsiya", "Reklama", "Telegram", "O'zi keldi", "Boshqa"];

type Filter = "all" | "new" | "active" | "vip" | "inactive";

const CosClients = ({ centerId }: { centerId: string }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({
    full_name: "", phone: "+998", email: "", date_of_birth: "", gender: "female",
    skin_type: "Normal", skin_concerns: [] as string[], allergies: "", contraindications: "",
    source: "Instagram", notes: "",
  });

  const load = async () => {
    const { data } = await supabase.from("cosmetology_clients" as any)
      .select("*").eq("center_id", centerId).order("created_at", { ascending: false });
    setClients((data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.full_name || !form.phone) {
      toast({ title: "Ism va telefon majburiy", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_clients" as any).insert({
      center_id: centerId, ...form, date_of_birth: form.date_of_birth || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Mijoz qo'shildi" });
    setShowForm(false);
    setForm({ full_name: "", phone: "+998", email: "", date_of_birth: "", gender: "female", skin_type: "Normal", skin_concerns: [], allergies: "", contraindications: "", source: "Instagram", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Mijozni o'chirishga ishonchingiz komilmi?")) return;
    await supabase.from("cosmetology_clients" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" });
    load();
  };

  const toggleConcern = (c: string) => {
    setForm((f) => ({ ...f, skin_concerns: f.skin_concerns.includes(c) ? f.skin_concerns.filter((x) => x !== c) : [...f.skin_concerns, c] }));
  };

  // KPI hisoblash
  const kpi = useMemo(() => {
    const now = Date.now();
    const monthAgo = now - 30 * 86400000;
    const weekAgo = now - 7 * 86400000;
    const newCount = clients.filter((c) => new Date(c.created_at).getTime() > monthAgo).length;
    const activeCount = clients.filter((c) => c.last_visit_date && new Date(c.last_visit_date).getTime() > monthAgo).length;
    const vipCount = clients.filter((c) => Number(c.total_spent || 0) > 1000000 || (c.loyalty_points || 0) > 100).length;
    const inactiveCount = clients.filter((c) => !c.last_visit_date || new Date(c.last_visit_date).getTime() < (now - 60 * 86400000)).length;
    const totalRevenue = clients.reduce((s, c) => s + Number(c.total_spent || 0), 0);
    const newWeek = clients.filter((c) => new Date(c.created_at).getTime() > weekAgo).length;
    return { total: clients.length, newCount, activeCount, vipCount, inactiveCount, totalRevenue, newWeek };
  }, [clients]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const monthAgo = now - 30 * 86400000;
    return clients.filter((c) => {
      if (search) {
        const s = search.toLowerCase();
        if (!c.full_name?.toLowerCase().includes(s) && !c.phone?.includes(search)) return false;
      }
      if (filter === "new") return new Date(c.created_at).getTime() > monthAgo;
      if (filter === "active") return c.last_visit_date && new Date(c.last_visit_date).getTime() > monthAgo;
      if (filter === "vip") return Number(c.total_spent || 0) > 1000000 || (c.loyalty_points || 0) > 100;
      if (filter === "inactive") return !c.last_visit_date || new Date(c.last_visit_date).getTime() < (now - 60 * 86400000);
      return true;
    });
  }, [clients, search, filter]);

  const isVip = (c: any) => Number(c.total_spent || 0) > 1000000 || (c.loyalty_points || 0) > 100;

  return (
    <div className="space-y-5">
      {/* Premium Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-pink-500/10 to-purple-500/10 p-5 border border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Mijozlar CRM
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Premium mijozlar bazasi · Sotuvni oshirish tizimi</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-primary to-pink-500 shadow-lg">
            <UserPlus className="w-4 h-4 mr-2" /> Yangi mijoz
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Jami mijozlar", value: kpi.total, icon: Users, color: "from-blue-500/20 to-cyan-500/20", text: "text-blue-500" },
          { label: "Yangi (30 kun)", value: kpi.newCount, sub: `+${kpi.newWeek} hafta`, icon: TrendingUp, color: "from-emerald-500/20 to-teal-500/20", text: "text-emerald-500" },
          { label: "Aktiv mijozlar", value: kpi.activeCount, icon: Activity, color: "from-primary/20 to-pink-500/20", text: "text-primary" },
          { label: "VIP mijozlar", value: kpi.vipCount, icon: Crown, color: "from-amber-500/20 to-orange-500/20", text: "text-amber-500" },
          { label: "Yo'qolgan", value: kpi.inactiveCount, icon: Bell, color: "from-rose-500/20 to-red-500/20", text: "text-rose-500" },
        ].map((k, i) => (
          <Card key={i} className={cn("border-border bg-gradient-to-br", k.color)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <k.icon className={cn("w-5 h-5", k.text)} />
                <p className="text-2xl font-bold">{k.value}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              {k.sub && <p className={cn("text-[10px] mt-0.5", k.text)}>{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Ism yoki telefon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {([
            { v: "all", l: "Barcha" },
            { v: "new", l: "🆕 Yangi" },
            { v: "active", l: "✅ Aktiv" },
            { v: "vip", l: "👑 VIP" },
            { v: "inactive", l: "💤 Yo'qolgan" },
          ] as { v: Filter; l: string }[]).map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                filter === f.v ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border hover:border-primary/50")}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Yangi mijoz qo'shish
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label>F.I.O *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Telefon *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label>Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1" /></div>
              <div>
                <Label>Jins</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="female">Ayol</option><option value="male">Erkak</option>
                </select>
              </div>
              <div>
                <Label>Teri turi</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.skin_type} onChange={(e) => setForm({ ...form, skin_type: e.target.value })}>
                  {SKIN_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Qayerdan keldi?</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Teri muammolari</Label>
              <div className="flex gap-1 flex-wrap">
                {CONCERNS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleConcern(c)} className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-all",
                    form.skin_concerns.includes(c) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                  )}>{c}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Allergiya</Label><Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1" rows={2} /></div>
              <div><Label>Kontrendikatsiya</Label><Textarea value={form.contraindications} onChange={(e) => setForm({ ...form, contraindications: e.target.value })} className="mt-1" rows={2} /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-pink-500">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground rounded-xl border-2 border-dashed border-border">
          <Users className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Mijozlar topilmadi</p>
          <p className="text-xs mt-1">Yangi mijoz qo'shing yoki filtrlarni o'zgartiring</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const vip = isVip(c);
            return (
              <Card key={c.id} className={cn(
                "transition-all hover:shadow-lg cursor-pointer group",
                vip ? "border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-orange-500/5" : "hover:border-primary/40"
              )} onClick={() => setSelected(c)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0",
                      vip ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-gradient-to-br from-primary/30 to-pink-500/30 text-foreground"
                    )}>
                      {vip && <Crown className="w-3 h-3 absolute -mt-7 ml-7 text-amber-500" />}
                      {c.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm truncate">{c.full_name}</p>
                        {vip && <Badge className="text-[10px] bg-amber-500 text-white border-0">VIP</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[11px]">
                        {c.skin_type && <Badge variant="outline" className="text-[10px]">{c.skin_type}</Badge>}
                        {(c.loyalty_points || 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500 font-medium">
                            <Star className="w-3 h-3 fill-current" />{c.loyalty_points}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Tashriflar</p>
                      <p className="text-sm font-bold text-foreground">{c.visit_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Sarflagan</p>
                      <p className="text-sm font-bold text-emerald-500">{Number(c.total_spent || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {c.skin_concerns?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {c.skin_concerns.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Profile Dialog */}
      {selected && (
        <ClientProfileDialog
          client={selected}
          centerId={centerId}
          onClose={() => setSelected(null)}
          onUpdate={() => { load(); }}
        />
      )}
    </div>
  );
};

// ============= CLIENT PROFILE DIALOG =============
const ClientProfileDialog = ({ client, centerId, onClose, onUpdate }: { client: any; centerId: string; onClose: () => void; onUpdate: () => void }) => {
  const [tab, setTab] = useState("overview");
  const [visits, setVisits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [beforeAfter, setBeforeAfter] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiText, setAiText] = useState("");

  const loadAll = async () => {
    setLoading(true);
    const [v, t, b, c, p, d] = await Promise.all([
      supabase.from("cosmetology_client_visits" as any).select("*").eq("client_id", client.id).order("visit_date", { ascending: false }),
      supabase.from("cosmetology_transactions" as any).select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
      supabase.from("cosmetology_before_after" as any).select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
      supabase.from("cosmetology_treatment_courses" as any).select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
      supabase.from("cosmetology_client_packages" as any).select("*, cosmetology_packages(name, price)").eq("client_id", client.id).order("created_at", { ascending: false }),
      supabase.from("cosmetology_documents" as any).select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
    ]);
    setVisits((v.data as any[]) || []);
    setTransactions((t.data as any[]) || []);
    setBeforeAfter((b.data as any[]) || []);
    setCourses((c.data as any[]) || []);
    setPackages((p.data as any[]) || []);
    setDocs((d.data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, [client.id]);

  const totalPaid = transactions.reduce((s, t) => s + Number(t.amount || 0), 0);
  const debt = courses.reduce((s, c) => s + (Number(c.total_price || 0) - Number(c.paid_amount || 0)), 0);
  const vip = Number(client.total_spent || 0) > 1000000 || (client.loyalty_points || 0) > 100;

  const aiSuggest = async () => {
    setAiSuggesting(true);
    setAiText("");
    try {
      const prompt = `Mijoz: ${client.full_name}, teri turi: ${client.skin_type || "noma'lum"}, muammolar: ${(client.skin_concerns || []).join(", ") || "yo'q"}, tashriflar: ${client.visit_count || 0}, oxirgi tashrif: ${client.last_visit_date || "yo'q"}. Kosmetolog sifatida 3 ta xizmat tavsiya qil va qisqacha izoh ber. O'zbek tilida.`;
      const { data, error } = await supabase.functions.invoke("ai-cosmetology", { body: { message: prompt } });
      if (error) throw error;
      setAiText(data?.response || data?.message || "AI javob bermadi");
    } catch (e: any) {
      setAiText("Xatolik: " + (e.message || "AI ishlamadi"));
    }
    setAiSuggesting(false);
  };

  const sendTelegram = async () => {
    const phone = client.phone?.replace(/\D/g, "");
    if (!phone) return;
    window.open(`https://t.me/+${phone}`, "_blank");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold",
              vip ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-gradient-to-br from-primary/30 to-pink-500/30"
            )}>{client.full_name?.[0]?.toUpperCase()}</div>
            <div>
              <p className="text-lg font-bold flex items-center gap-2">
                {client.full_name}
                {vip && <Badge className="bg-amber-500 text-white border-0"><Crown className="w-3 h-3 mr-1" />VIP</Badge>}
              </p>
              <p className="text-xs text-muted-foreground font-normal">{client.phone}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 -mt-2">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <DollarSign className="w-4 h-4 text-emerald-500 mb-1" />
            <p className="text-[10px] text-muted-foreground uppercase">To'langan</p>
            <p className="text-sm font-bold">{totalPaid.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <DollarSign className="w-4 h-4 text-rose-500 mb-1" />
            <p className="text-[10px] text-muted-foreground uppercase">Qarzdorlik</p>
            <p className="text-sm font-bold">{debt.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Activity className="w-4 h-4 text-blue-500 mb-1" />
            <p className="text-[10px] text-muted-foreground uppercase">Tashriflar</p>
            <p className="text-sm font-bold">{visits.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Star className="w-4 h-4 text-amber-500 mb-1" />
            <p className="text-[10px] text-muted-foreground uppercase">Ballar</p>
            <p className="text-sm font-bold">{client.loyalty_points || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={sendTelegram}><MessageCircle className="w-4 h-4 mr-1" /> Telegram</Button>
          <Button size="sm" variant="outline" onClick={() => window.open(`tel:${client.phone}`)}><Phone className="w-4 h-4 mr-1" /> Qo'ng'iroq</Button>
          <Button size="sm" variant="outline" onClick={aiSuggest} disabled={aiSuggesting}>
            {aiSuggesting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1 text-primary" />}
            AI tavsiya
          </Button>
        </div>

        {aiText && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-pink-500/5">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI tavsiya</p>
              <p className="text-sm whitespace-pre-wrap">{aiText}</p>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">Asosiy</TabsTrigger>
            <TabsTrigger value="visits">Tashriflar</TabsTrigger>
            <TabsTrigger value="payments">To'lovlar</TabsTrigger>
            <TabsTrigger value="courses">Kurslar</TabsTrigger>
            <TabsTrigger value="photos">Foto</TabsTrigger>
            <TabsTrigger value="files">Fayllar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Email" value={client.email || "—"} />
              <InfoRow label="Tug'ilgan sana" value={client.date_of_birth || "—"} />
              <InfoRow label="Jins" value={client.gender === "female" ? "Ayol" : "Erkak"} />
              <InfoRow label="Teri turi" value={client.skin_type || "—"} />
              <InfoRow label="Manba" value={client.source || "—"} />
              <InfoRow label="Oxirgi tashrif" value={client.last_visit_date || "Hech qachon"} />
            </div>
            {client.skin_concerns?.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Teri muammolari</Label>
                <div className="flex gap-1 flex-wrap mt-1">
                  {client.skin_concerns.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
            )}
            {client.allergies && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <Label className="text-xs font-semibold text-rose-500">⚠️ Allergiya</Label>
                <p className="text-sm mt-1">{client.allergies}</p>
              </div>
            )}
            {client.contraindications && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Label className="text-xs font-semibold text-amber-500">⚠️ Kontrendikatsiya</Label>
                <p className="text-sm mt-1">{client.contraindications}</p>
              </div>
            )}
            {packages.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Aktiv paketlar</Label>
                <div className="space-y-2">
                  {packages.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{p.cosmetology_packages?.name || "Paket"}</p>
                        <Badge>{p.sessions_remaining || 0}/{p.total_sessions || 0}</Badge>
                      </div>
                      <Progress value={p.total_sessions ? ((p.total_sessions - (p.sessions_remaining || 0)) / p.total_sessions) * 100 : 0} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="visits" className="space-y-2 mt-3">
            {visits.length === 0 ? <Empty icon={Calendar} text="Tashriflar yo'q" /> : visits.map((v) => (
              <div key={v.id} className="p-3 rounded-lg border border-border flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{v.service_name || v.service_type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(v.visit_date).toLocaleString()} · {v.staff_name || "—"}</p>
                  {v.notes && <p className="text-xs mt-1 text-muted-foreground italic">{v.notes}</p>}
                </div>
                <p className="text-sm font-bold text-emerald-500">{Number(v.price || 0).toLocaleString()}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="payments" className="space-y-2 mt-3">
            {transactions.length === 0 ? <Empty icon={DollarSign} text="To'lovlar yo'q" /> : transactions.map((t) => (
              <div key={t.id} className="p-3 rounded-lg border border-border flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{t.description || t.payment_type || "To'lov"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()} · {t.payment_method || "Naqd"}</p>
                  {t.invoice_number && <Badge variant="outline" className="text-[10px] mt-1">#{t.invoice_number}</Badge>}
                </div>
                <p className="text-sm font-bold text-emerald-500">+{Number(t.amount || 0).toLocaleString()}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="courses" className="space-y-2 mt-3">
            {courses.length === 0 ? <Empty icon={PackageIcon} text="Kurslar yo'q" /> : courses.map((c) => {
              const pct = c.total_sessions ? Math.round(((c.completed_sessions || 0) / c.total_sessions) * 100) : 0;
              return (
                <div key={c.id} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{c.course_name}</p>
                    <Badge className={cn(
                      c.status === "completed" ? "bg-emerald-500/20 text-emerald-500" :
                      c.status === "active" ? "bg-primary/20 text-primary" : "bg-muted"
                    )}>{c.status}</Badge>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{c.completed_sessions || 0}/{c.total_sessions} seans</span>
                    <span>{Number(c.paid_amount || 0).toLocaleString()} / {Number(c.total_price || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="photos" className="mt-3">
            {beforeAfter.length === 0 ? <Empty icon={ImageIcon} text="Foto yo'q" /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {beforeAfter.map((b) => (
                  <div key={b.id} className="rounded-lg border border-border overflow-hidden">
                    <div className="grid grid-cols-2 gap-0.5 bg-muted">
                      {b.before_photo_url ? <img loading="lazy" decoding="async" src={b.before_photo_url} alt="before" className="aspect-square object-cover" /> : <div className="aspect-square flex items-center justify-center text-xs text-muted-foreground">Oldin</div>}
                      {b.after_photo_url ? <img loading="lazy" decoding="async" src={b.after_photo_url} alt="after" className="aspect-square object-cover" /> : <div className="aspect-square flex items-center justify-center text-xs text-muted-foreground">Keyin</div>}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium">{b.service_name || "Xizmat"}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-3 space-y-2">
            {docs.length === 0 ? <Empty icon={FileText} text="Hujjatlar yo'q" /> : docs.map((d) => (
              <a key={d.id} href={d.file_url} target="_blank" rel="noopener" className="p-3 rounded-lg border border-border flex items-center gap-3 hover:border-primary/50 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title || d.file_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
          </TabsContent>
        </Tabs>

        {loading && <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>}
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2 rounded-lg bg-muted/30">
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    <p className="text-sm font-medium mt-0.5">{value}</p>
  </div>
);

const Empty = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-10 text-muted-foreground">
    <Icon className="w-10 h-10 mx-auto mb-2 opacity-40" />
    <p className="text-sm">{text}</p>
  </div>
);

export default CosClients;
