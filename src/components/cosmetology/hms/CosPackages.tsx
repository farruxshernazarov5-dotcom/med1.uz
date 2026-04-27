import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Gift, Plus, Trash2, Loader2, Sparkles, ShoppingCart, Tag, Users, TrendingUp, Calendar, Package as PackageIcon, Percent } from "lucide-react";

const TEMPLATES = [
  { name: "VIP Yuz parvarishi", description: "Premium yuz parvarish to'plami", total_sessions: 10, price: 3500000, discount_percent: 15, validity_days: 120, services: ["Tozalash", "Maska", "Massaj"] },
  { name: "Lazer epilatsiya - Tana", description: "To'liq tana lazer kursi", total_sessions: 8, price: 4800000, discount_percent: 20, validity_days: 240, services: ["Lazer epilatsiya"] },
  { name: "Anti-aging kurs", description: "Yoshartiruvchi muolajalar", total_sessions: 6, price: 2400000, discount_percent: 12, validity_days: 90, services: ["Mezoterapiya", "Botoks"] },
  { name: "Piling kursi", description: "Kimyoviy piling kursi", total_sessions: 5, price: 1500000, discount_percent: 10, validity_days: 75, services: ["Piling"] },
  { name: "Bayram chegirmasi", description: "Mavsumiy maxsus taklif", total_sessions: 3, price: 750000, discount_percent: 25, validity_days: 30, services: ["Tozalash"] },
];

const CosPackages = ({ centerId }: { centerId: string }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [sold, setSold] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSell, setShowSell] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"catalog" | "sold">("catalog");
  const [form, setForm] = useState({ name: "", description: "", services: "", total_sessions: "5", price: "", discount_percent: "10", validity_days: "90" });
  const [sellForm, setSellForm] = useState({ client_id: "", promo: "", payment_method: "cash" });

  const load = async () => {
    const [{ data: p }, { data: s }, { data: c }] = await Promise.all([
      supabase.from("cosmetology_packages" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_client_packages" as any).select("*, cosmetology_clients(full_name, phone)").eq("center_id", centerId).order("purchase_date", { ascending: false }),
      supabase.from("cosmetology_clients" as any).select("id, full_name, phone").eq("center_id", centerId).order("full_name"),
    ]);
    setPackages((p as any[]) || []);
    setSold((s as any[]) || []);
    setClients((c as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const stats = useMemo(() => {
    const active = sold.filter((s) => s.status === "active");
    const expired = sold.filter((s) => s.expires_at && new Date(s.expires_at) < new Date());
    const revenue = sold.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
    return { catalog: packages.length, soldCount: sold.length, active: active.length, expired: expired.length, revenue };
  }, [packages, sold]);

  const useTemplate = (t: any) => {
    setForm({ name: t.name, description: t.description, services: t.services.join(", "), total_sessions: String(t.total_sessions), price: String(t.price), discount_percent: String(t.discount_percent), validity_days: String(t.validity_days) });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.price) { toast({ title: "Nom va narx majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_packages" as any).insert({
      center_id: centerId, name: form.name, description: form.description,
      services_included: form.services.split(",").map((s) => s.trim()).filter(Boolean),
      total_sessions: parseInt(form.total_sessions) || 1, price: parseFloat(form.price),
      discount_percent: parseFloat(form.discount_percent) || 0, validity_days: parseInt(form.validity_days) || 90,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Paket yaratildi" });
    setShowForm(false);
    setForm({ name: "", description: "", services: "", total_sessions: "5", price: "", discount_percent: "10", validity_days: "90" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("cosmetology_packages" as any).delete().eq("id", id);
    load();
  };

  const sellPackage = async () => {
    if (!showSell || !sellForm.client_id) { toast({ title: "Mijoz tanlang", variant: "destructive" }); return; }
    setSaving(true);
    const pkg = showSell;
    let finalPrice = Number(pkg.price);
    // promo code: PROMO10 = 10% extra off
    const promoMatch = sellForm.promo.match(/^PROMO(\d+)$/i);
    if (promoMatch) {
      const extra = Math.min(50, parseInt(promoMatch[1]));
      finalPrice = finalPrice * (1 - extra / 100);
    }
    const expires = new Date();
    expires.setDate(expires.getDate() + (pkg.validity_days || 90));

    // 1. Create client_package
    const { data: cp, error: e1 } = await supabase.from("cosmetology_client_packages" as any).insert({
      center_id: centerId, client_id: sellForm.client_id, package_id: pkg.id, package_name: pkg.name,
      total_sessions: pkg.total_sessions, used_sessions: 0, amount_paid: finalPrice,
      expires_at: expires.toISOString().split("T")[0], status: "active",
    } as any).select().single();
    if (e1) { setSaving(false); toast({ title: "Xatolik", description: e1.message, variant: "destructive" }); return; }

    // 2. Auto-generate course (if course table exists)
    const startDate = new Date();
    const daysBetween = Math.floor((pkg.validity_days || 90) / Math.max(1, pkg.total_sessions));
    await supabase.from("cosmetology_courses" as any).insert({
      center_id: centerId, client_id: sellForm.client_id, name: pkg.name,
      description: `Paket: ${pkg.name}`, total_sessions: pkg.total_sessions, completed_sessions: 0,
      price: finalPrice, paid_amount: finalPrice, status: "active",
      start_date: startDate.toISOString().split("T")[0],
    } as any).then(() => null, () => null);

    // 3. Transaction
    await supabase.from("cosmetology_transactions" as any).insert({
      center_id: centerId, client_id: sellForm.client_id, type: "package_sale",
      description: `Paket sotildi: ${pkg.name}`, amount: finalPrice, payment_method: sellForm.payment_method, status: "paid",
    } as any).then(() => null, () => null);

    // 4. Update client stats
    const { data: cli } = await supabase.from("cosmetology_clients" as any).select("total_spent, loyalty_points, visit_count").eq("id", sellForm.client_id).single();
    if (cli) {
      await supabase.from("cosmetology_clients" as any).update({
        total_spent: Number((cli as any).total_spent || 0) + finalPrice,
        loyalty_points: ((cli as any).loyalty_points || 0) + Math.floor(finalPrice / 10000),
        last_visit_date: new Date().toISOString().split("T")[0],
      } as any).eq("id", sellForm.client_id);
    }

    setSaving(false);
    toast({ title: "✅ Paket sotildi", description: `${finalPrice.toLocaleString()} so'm` });
    setShowSell(null);
    setSellForm({ client_id: "", promo: "", payment_method: "cash" });
    setTab("sold");
    load();
  };

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-pink-500/5"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><PackageIcon className="w-3 h-3" /> Katalog</div>
          <p className="text-2xl font-bold text-primary mt-1">{stats.catalog}</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShoppingCart className="w-3 h-3" /> Sotilgan</div>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{stats.soldCount}</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="w-3 h-3" /> Faol</div>
          <p className="text-2xl font-bold text-blue-500 mt-1">{stats.active}</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /> Muddati o'tgan</div>
          <p className="text-2xl font-bold text-amber-500 mt-1">{stats.expired}</p>
        </CardContent></Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="w-3 h-3" /> Daromad</div>
          <p className="text-lg font-bold text-violet-500 mt-1">{(stats.revenue / 1000000).toFixed(1)}M</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("catalog")} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "catalog" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>📦 Katalog ({packages.length})</button>
        <button onClick={() => setTab("sold")} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "sold" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>🛒 Sotilganlar ({sold.length})</button>
      </div>

      {tab === "catalog" && (
        <>
          {/* Templates */}
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-sm">Tayyor shablonlar</h4>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => useTemplate(t)} className="flex-shrink-0 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary text-left min-w-[180px]">
                    <p className="text-xs font-bold text-foreground truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.total_sessions} seans · -{t.discount_percent}%</p>
                    <p className="text-xs text-primary font-bold mt-1">{(t.price / 1000000).toFixed(1)}M so'm</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <h3 className="font-heading font-semibold text-lg">Paketlar va abonementlar</h3>
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Yangi paket</Button>
          </div>

          {showForm && (
            <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Paket nomi *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
                <div className="col-span-2"><Label>Tavsif</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
                <div className="col-span-2"><Label>Xizmatlar (vergul bilan)</Label><Input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Tozalash, Maska, Massaj" className="mt-1" /></div>
                <div><Label>Seans soni</Label><Input type="number" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} className="mt-1" /></div>
                <div><Label>Narx (so'm) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" /></div>
                <div><Label>Chegirma %</Label><Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="mt-1" /></div>
                <div><Label>Amal qilish (kun)</Label><Input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
              </div>
            </CardContent></Card>
          )}

          {packages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Gift className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Paketlar yo'q. Yuqoridan shablon tanlang yoki yangi yarating.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {packages.map((p) => {
                const finalPrice = Number(p.price) * (1 - Number(p.discount_percent || 0) / 100);
                return (
                  <Card key={p.id} className="border-primary/10 bg-gradient-to-br from-primary/5 to-pink-500/5 hover:shadow-lg transition">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Gift className="w-5 h-5 text-primary" /></div>
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                      </div>
                      <p className="font-bold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                      {p.services_included?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {p.services_included.slice(0, 3).map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Seans:</span><span className="font-medium">{p.total_sessions}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Chegirma:</span><Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">-{p.discount_percent}%</Badge></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amal qiladi:</span><span>{p.validity_days} kun</span></div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        {Number(p.discount_percent) > 0 && (
                          <p className="text-xs text-muted-foreground line-through">{Number(p.price).toLocaleString()} so'm</p>
                        )}
                        <p className="text-xl font-bold text-primary">{finalPrice.toLocaleString()} so'm</p>
                      </div>
                      <Button size="sm" className="w-full mt-3" onClick={() => setShowSell(p)}>
                        <ShoppingCart className="w-3 h-3 mr-1" /> Sotish
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "sold" && (
        <div className="space-y-2">
          {sold.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali sotilgan paket yo'q</p></div>
          ) : (
            sold.map((s) => {
              const used = s.used_sessions || 0;
              const total = s.total_sessions || 1;
              const pct = (used / total) * 100;
              const expired = s.expires_at && new Date(s.expires_at) < new Date();
              const daysLeft = s.expires_at ? Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 86400000) : null;
              return (
                <Card key={s.id} className={expired ? "border-destructive/30 bg-destructive/5" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-foreground">{s.package_name}</h4>
                          <Badge variant={expired ? "destructive" : "default"} className="text-xs">{expired ? "Muddati o'tgan" : s.status}</Badge>
                          {daysLeft !== null && !expired && <Badge variant="outline" className="text-xs">{daysLeft} kun qoldi</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">👤 {s.cosmetology_clients?.full_name || "—"} · 📞 {s.cosmetology_clients?.phone || "—"}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{used} / {total} seans</span>
                            <span className="font-medium">{Math.round(pct)}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{Number(s.amount_paid).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">so'm</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(s.purchase_date).toLocaleDateString("uz-UZ")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Sell Dialog */}
      <Dialog open={!!showSell} onOpenChange={(o) => !o && setShowSell(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Paket sotish: {showSell?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mijoz *</Label>
              <select value={sellForm.client_id} onChange={(e) => setSellForm({ ...sellForm, client_id: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">— Tanlang —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>)}
              </select>
            </div>
            <div>
              <Label className="flex items-center gap-1"><Tag className="w-3 h-3" /> Promo kod (ixtiyoriy)</Label>
              <Input value={sellForm.promo} onChange={(e) => setSellForm({ ...sellForm, promo: e.target.value })} placeholder="PROMO10, PROMO20..." className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Misol: PROMO10 = qo'shimcha 10% chegirma</p>
            </div>
            <div>
              <Label>To'lov usuli</Label>
              <select value={sellForm.payment_method} onChange={(e) => setSellForm({ ...sellForm, payment_method: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="cash">💵 Naqd</option>
                <option value="card">💳 Karta</option>
                <option value="click">📱 Click</option>
                <option value="payme">📱 Payme</option>
                <option value="transfer">🏦 O'tkazma</option>
              </select>
            </div>
            {showSell && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Asl narx:</span><span>{Number(showSell.price).toLocaleString()} so'm</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paket chegirmasi:</span><span className="text-emerald-500">-{showSell.discount_percent}%</span></div>
                  {sellForm.promo.match(/^PROMO(\d+)$/i) && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Promo:</span><span className="text-emerald-500 flex items-center gap-1"><Percent className="w-3 h-3" /> -{sellForm.promo.match(/^PROMO(\d+)$/i)![1]}%</span></div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold"><span>Yakuniy:</span>
                    <span className="text-primary text-lg">
                      {(() => {
                        let f = Number(showSell.price);
                        const m = sellForm.promo.match(/^PROMO(\d+)$/i);
                        if (m) f = f * (1 - Math.min(50, parseInt(m[1])) / 100);
                        return f.toLocaleString();
                      })()} so'm
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex gap-2">
              <Button onClick={sellPackage} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingCart className="w-4 h-4 mr-1" /> Sotish va kurs ochish</>}
              </Button>
              <Button variant="outline" onClick={() => setShowSell(null)}>Bekor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CosPackages;
