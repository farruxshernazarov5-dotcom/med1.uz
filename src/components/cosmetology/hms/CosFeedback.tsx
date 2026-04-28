import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Star, MessageSquare, Plus, Search, CheckCircle2, Reply, Sparkles, TrendingUp, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const CosFeedback = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [replyOpen, setReplyOpen] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [aiInsight, setAiInsight] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({ client_id: "", staff_name: "", service_name: "", rating: 5, comment: "" });

  const load = async () => {
    setLoading(true);
    const [f, c] = await Promise.all([
      supabase.from("cosmetology_feedback" as any).select("*, cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_clients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setItems((f.data as any[]) || []);
    setClients((c.data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [centerId]);

  const stats = useMemo(() => {
    const total = items.length;
    const avg = total ? items.reduce((s, i) => s + i.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map((r) => ({ rating: `${r}★`, count: items.filter((i) => i.rating === r).length }));
    const positive = items.filter((i) => i.rating >= 4).length;
    const negative = items.filter((i) => i.rating <= 2).length;
    const pending = items.filter((i) => (i.status || "new") === "new").length;
    const approved = items.filter((i) => i.status === "approved").length;
    const replied = items.filter((i) => i.reply).length;
    return { total, avg, dist, positive, negative, pending, approved, replied, satisfaction: total ? Math.round((positive / total) * 100) : 0 };
  }, [items]);

  const filtered = useMemo(() => {
    let arr = items;
    if (tab === "new") arr = arr.filter((i) => (i.status || "new") === "new");
    if (tab === "approved") arr = arr.filter((i) => i.status === "approved");
    if (tab === "negative") arr = arr.filter((i) => i.rating <= 2);
    if (tab === "no_reply") arr = arr.filter((i) => !i.reply);
    if (search) arr = arr.filter((i) => (i.cosmetology_clients?.full_name || "").toLowerCase().includes(search.toLowerCase()) || (i.comment || "").toLowerCase().includes(search.toLowerCase()) || (i.service_name || "").toLowerCase().includes(search.toLowerCase()));
    return arr;
  }, [items, tab, search]);

  const addReview = async () => {
    if (!form.service_name) { toast({ title: "Xizmat nomini kiriting", variant: "destructive" }); return; }
    const { error } = await supabase.from("cosmetology_feedback" as any).insert({
      center_id: centerId, client_id: form.client_id || null, staff_name: form.staff_name,
      service_name: form.service_name, rating: form.rating, comment: form.comment, status: "new",
    } as any);
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Sharh qo'shildi" });
    setShowAdd(false);
    setForm({ client_id: "", staff_name: "", service_name: "", rating: 5, comment: "" });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("cosmetology_feedback" as any).update({ status }).eq("id", id);
    toast({ title: status === "approved" ? "✅ Tasdiqlandi" : "🚫 Yashirildi" });
    load();
  };

  const sendReply = async () => {
    if (!replyOpen || !replyText.trim()) return;
    await supabase.from("cosmetology_feedback" as any).update({ reply: replyText }).eq("id", replyOpen.id);
    toast({ title: "✅ Javob yuborildi" });
    setReplyOpen(null); setReplyText("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Sharh o'chirilsinmi?")) return;
    await supabase.from("cosmetology_feedback" as any).delete().eq("id", id);
    load();
  };

  const generateAI = async () => {
    if (!items.length) { toast({ title: "Sharhlar yo'q", variant: "destructive" }); return; }
    setAiLoading(true);
    try {
      const summary = items.slice(0, 30).map((i) => `${i.rating}★ ${i.service_name || "—"}: ${i.comment || ""}`).join("\n");
      const { data, error } = await supabase.functions.invoke("ai-cosmetology", {
        body: {
          messages: [
            { role: "system", content: "Sen kosmetologiya markazi uchun marketing maslahatchisisan. Sharhlarni tahlil qilib, qisqa O'zbek tilida insight ber: kuchli tomonlar, zaif tomonlar, marketing tavsiyalar. Maks 200 so'z." },
            { role: "user", content: `Sharhlarni tahlil qil:\n${summary}` },
          ],
        },
      });
      if (error) throw error;
      setAiInsight(data?.message || data?.content || "AI javob bermadi");
    } catch (e: any) {
      setAiInsight("AI tahlilda xato. Keyinroq urinib ko'ring.");
    } finally { setAiLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Sharhlar va Reytinglar</h2>
          <p className="text-xs text-muted-foreground">{stats.total} ta sharh · {stats.satisfaction}% qoniqish</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Sharh qo'shish</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <div className="text-3xl font-extrabold text-amber-500">{stats.avg.toFixed(1)}</div>
          <div className="flex justify-center mb-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-3.5 h-3.5", i < Math.round(stats.avg) ? "text-amber-500 fill-current" : "text-muted")} />)}</div>
          <p className="text-[10px] text-muted-foreground">Umumiy reyting</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center"><MessageSquare className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-xl font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Sharhlar</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><ThumbsUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" /><p className="text-xl font-bold text-emerald-600">{stats.positive}</p><p className="text-[10px] text-muted-foreground">Ijobiy (4-5★)</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><ThumbsDown className="w-5 h-5 text-rose-500 mx-auto mb-1" /><p className="text-xl font-bold text-rose-600">{stats.negative}</p><p className="text-[10px] text-muted-foreground">Salbiy (1-2★)</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><Reply className="w-5 h-5 text-blue-500 mx-auto mb-1" /><p className="text-xl font-bold">{stats.replied}/{stats.total}</p><p className="text-[10px] text-muted-foreground">Javob berildi</p></CardContent></Card>
      </div>

      {/* Distribution + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2"><CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Reyting taqsimoti</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dist} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="rating" width={30} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20"><CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-500" />AI Marketing tahlil</h3>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateAI} disabled={aiLoading}>{aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Tahlil"}</Button>
          </div>
          {aiInsight ? (
            <div className="text-xs text-foreground whitespace-pre-wrap max-h-44 overflow-y-auto">{aiInsight}</div>
          ) : (
            <p className="text-xs text-muted-foreground">Sharhlarga asoslangan marketing tavsiyalar olish uchun "Tahlil" ni bosing.</p>
          )}
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all" className="text-xs">Barcha ({stats.total})</TabsTrigger>
          <TabsTrigger value="new" className="text-xs">Yangi ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">Tasdiqlangan ({stats.approved})</TabsTrigger>
          <TabsTrigger value="negative" className="text-xs">Salbiy ({stats.negative})</TabsTrigger>
          <TabsTrigger value="no_reply" className="text-xs">Javobsiz</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-3 space-y-3">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> :
            filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Sharhlar yo'q</p></div>
            ) : (
              filtered.map((f) => (
                <Card key={f.id} className={cn("transition-all hover:shadow-md", f.rating <= 2 && "border-rose-500/30 bg-rose-500/5")}><CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{f.cosmetology_clients?.full_name || "Anonim"}</p>
                        {f.status === "approved" && <Badge variant="default" className="bg-emerald-500/20 text-emerald-700 border-0 text-[10px]">✓ Tasdiqlangan</Badge>}
                        {(f.status || "new") === "new" && <Badge variant="outline" className="text-[10px]">Yangi</Badge>}
                        {f.status === "hidden" && <Badge variant="outline" className="text-[10px]">Yashirilgan</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {f.service_name || "—"}{f.staff_name && ` · ${f.staff_name}`} · {new Date(f.created_at).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                    <div className="flex shrink-0">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("w-4 h-4", i < f.rating ? "text-amber-500 fill-current" : "text-muted")} />)}</div>
                  </div>
                  {f.comment && <p className="text-sm text-foreground mt-2">{f.comment}</p>}
                  {f.reply && <div className="mt-2 p-2.5 rounded-lg bg-primary/10 border-l-2 border-primary text-xs"><span className="font-medium text-primary">Markaz javobi:</span> {f.reply}</div>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(f.status || "new") !== "approved" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(f.id, "approved")}><CheckCircle2 className="w-3 h-3 mr-1" />Tasdiqlash</Button>}
                    {!f.reply && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setReplyOpen(f); setReplyText(""); }}><Reply className="w-3 h-3 mr-1" />Javob</Button>}
                    {f.status !== "hidden" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setStatus(f.id, "hidden")}>Yashirish</Button>}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remove(f.id)}>O'chirish</Button>
                  </div>
                </CardContent></Card>
              ))
            )}
        </TabsContent>
      </Tabs>

      {/* Add */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sharh qo'shish</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mijoz</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1 text-sm" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Anonim</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Xodim</Label><Input value={form.staff_name} onChange={(e) => setForm({ ...form, staff_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Xizmat *</Label><Input value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} className="mt-1" /></div>
            </div>
            <div>
              <Label>Baho</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}>
                    <Star className={cn("w-7 h-7", n <= form.rating ? "text-amber-500 fill-current" : "text-muted")} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Izoh</Label><Textarea rows={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="mt-1" /></div>
            <Button onClick={addReview} className="w-full">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply */}
      <Dialog open={!!replyOpen} onOpenChange={(o) => !o && setReplyOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sharhga javob</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {replyOpen && <div className="p-3 rounded-lg bg-muted text-sm"><p className="font-medium text-xs">{replyOpen.cosmetology_clients?.full_name || "Anonim"} · {replyOpen.rating}★</p><p className="mt-1">{replyOpen.comment || "—"}</p></div>}
            <Textarea rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Javobingizni yozing..." />
            <Button onClick={sendReply} disabled={!replyText.trim()} className="w-full"><Reply className="w-4 h-4 mr-2" />Yuborish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CosFeedback;
