import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Save, X, Edit, Search, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  module_id: string;
  tier: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: any;
  limits: any;
  is_popular: boolean;
  is_active: boolean;
}

interface Subscription {
  id: string;
  owner_id: string;
  module_id: string;
  tier: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

const TIER_COLOR: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-primary/20 text-primary",
  enterprise: "bg-amber-100 text-amber-700",
};

export const SaaSAdminManager = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [m, p, s] = await Promise.all([
      supabase.from("saas_modules").select("*").order("sort_order"),
      supabase.from("saas_plans").select("*").order("module_id").order("sort_order"),
      supabase.from("tenant_subscriptions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setModules(m.data || []);
    setPlans(p.data || []);
    setSubs(s.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const savePlan = async () => {
    if (!editPlan) return;
    const features = typeof editPlan.features === "string" ? JSON.parse(editPlan.features) : editPlan.features;
    const limits = typeof editPlan.limits === "string" ? JSON.parse(editPlan.limits) : editPlan.limits;
    const { error } = await supabase.from("saas_plans").update({
      name: editPlan.name,
      price_monthly: editPlan.price_monthly,
      price_yearly: editPlan.price_yearly,
      features, limits,
      is_popular: editPlan.is_popular,
      is_active: editPlan.is_active,
    }).eq("id", editPlan.id);
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saqlandi" });
    setEditPlan(null);
    load();
  };

  const updateSubStatus = async (id: string, status: string) => {
    await supabase.from("tenant_subscriptions").update({ status }).eq("id", id);
    toast({ title: "Status yangilandi" });
    load();
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Yuklanmoqda...</div>;

  const filteredSubs = subs.filter((s) =>
    !search || s.owner_id.includes(search) || s.module_id.includes(search) || s.tier.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Crown className="w-6 h-6 text-primary" />
        <div>
          <h2 className="font-heading text-xl font-bold">SaaS Boshqaruv</h2>
          <p className="text-xs text-muted-foreground">Tariflar, modullar va foydalanuvchi obunalarini boshqarish</p>
        </div>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans"><Crown className="w-4 h-4 mr-1" /> Tariflar ({plans.length})</TabsTrigger>
          <TabsTrigger value="subs"><Users className="w-4 h-4 mr-1" /> Obunalar ({subs.length})</TabsTrigger>
          <TabsTrigger value="modules"><Activity className="w-4 h-4 mr-1" /> Modullar ({modules.length})</TabsTrigger>
        </TabsList>

        {/* Plans */}
        <TabsContent value="plans" className="space-y-3">
          {modules.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-bold text-foreground mb-3">{m.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {plans.filter((p) => p.module_id === m.id).map((p) => (
                  <div key={p.id} className="border border-border rounded-xl p-3 hover:border-primary/40 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${TIER_COLOR[p.tier]}`}>{p.tier}</span>
                      {p.is_popular && <span className="text-xs text-amber-600">⭐</span>}
                    </div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{Number(p.price_monthly).toLocaleString()} so'm/oy</div>
                    <div className="text-xs space-y-0.5 mb-2">
                      <div>📦 {(Array.isArray(p.features) ? p.features : []).length} ta funksiya</div>
                      <div>📊 {Object.keys(p.limits || {}).length} ta limit</div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setEditPlan(p)}>
                      <Edit className="w-3 h-3 mr-1" /> Tahrir
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Subscriptions */}
        <TabsContent value="subs" className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="user_id / modul / tarif bo'yicha qidirish" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs">
                <tr>
                  <th className="text-left p-3">Foydalanuvchi</th>
                  <th className="text-left p-3">Modul</th>
                  <th className="text-left p-3">Tarif</th>
                  <th className="text-left p-3">Holat</th>
                  <th className="text-left p-3">Tugash</th>
                  <th className="text-left p-3">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{s.owner_id.slice(0, 8)}...</td>
                    <td className="p-3">{s.module_id}</td>
                    <td className="p-3"><span className={`text-xs uppercase px-2 py-0.5 rounded-full ${TIER_COLOR[s.tier] || ""}`}>{s.tier}</span></td>
                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.status}</span></td>
                    <td className="p-3 text-xs">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                    <td className="p-3 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateSubStatus(s.id, s.status === "active" ? "cancelled" : "active")}>
                        {s.status === "active" ? "Bekor" : "Faollash"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredSubs.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Obunalar yo'q</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Modules */}
        <TabsContent value="modules">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {modules.map((m) => (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-4">
                <h3 className="font-bold">{m.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{m.description}</p>
                <div className="text-xs">ID: <code className="bg-muted px-1 rounded">{m.id}</code></div>
                <div className="text-xs mt-1">Tariflar: {plans.filter((p) => p.module_id === m.id).length}</div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={!!editPlan} onOpenChange={(v) => !v && setEditPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Tarifni tahrirlash</DialogTitle></DialogHeader>
          {editPlan && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Nomi</label><Input value={editPlan.name} onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground">Tier</label><Input value={editPlan.tier} disabled /></div>
                <div><label className="text-xs text-muted-foreground">Narx (oylik so'm)</label><Input type="number" value={editPlan.price_monthly} onChange={(e) => setEditPlan({ ...editPlan, price_monthly: Number(e.target.value) })} /></div>
                <div><label className="text-xs text-muted-foreground">Narx (yillik so'm)</label><Input type="number" value={editPlan.price_yearly} onChange={(e) => setEditPlan({ ...editPlan, price_yearly: Number(e.target.value) })} /></div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Features (JSON array)</label>
                <Textarea rows={3} value={JSON.stringify(editPlan.features, null, 2)} onChange={(e) => { try { setEditPlan({ ...editPlan, features: JSON.parse(e.target.value) }); } catch {} }} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Limits (JSON object, -1 = ∞)</label>
                <Textarea rows={4} value={JSON.stringify(editPlan.limits, null, 2)} onChange={(e) => { try { setEditPlan({ ...editPlan, limits: JSON.parse(e.target.value) }); } catch {} }} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editPlan.is_popular} onChange={(e) => setEditPlan({ ...editPlan, is_popular: e.target.checked })} /> Popular</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editPlan.is_active} onChange={(e) => setEditPlan({ ...editPlan, is_active: e.target.checked })} /> Faol</label>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={() => setEditPlan(null)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
                <Button onClick={savePlan}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaaSAdminManager;
