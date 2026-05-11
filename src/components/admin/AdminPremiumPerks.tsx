import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Plus, Trash2, Edit, Ticket, Loader2 } from "lucide-react";

const MODULES = ["clinic", "dental", "diagnostics", "cosmetology", "pharmacy", "maternity", "doctor", "bloodbank", "medtech"];
const TIERS = ["starter", "pro", "enterprise"];
const CATEGORIES = ["discount", "bonus", "cashback", "ai", "vip", "promo"];

export const AdminPremiumPerks = () => {
  const { toast } = useToast();
  const [perks, setPerks] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [editingCode, setEditingCode] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("premium_perks" as any).select("*").order("module_id").order("display_order"),
      supabase.from("promo_codes" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setPerks((p as any) || []);
    setCodes((c as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const savePerk = async (perk: any) => {
    const { id, ...rest } = perk;
    const op = id
      ? supabase.from("premium_perks" as any).update(rest).eq("id", id)
      : supabase.from("premium_perks" as any).insert(rest);
    const { error } = await op;
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "Saqlandi" }); setEditing(null); load(); }
  };

  const deletePerk = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("premium_perks" as any).delete().eq("id", id);
    load();
  };

  const togglePerk = async (id: string, is_active: boolean) => {
    await supabase.from("premium_perks" as any).update({ is_active }).eq("id", id);
    load();
  };

  const saveCode = async (code: any) => {
    const { id, ...rest } = code;
    rest.code = (rest.code || "").toUpperCase();
    const op = id
      ? supabase.from("promo_codes" as any).update(rest).eq("id", id)
      : supabase.from("promo_codes" as any).insert(rest);
    const { error } = await op;
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { toast({ title: "Saqlandi" }); setEditingCode(null); load(); }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("promo_codes" as any).delete().eq("id", id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Premium Monetization</h2>
          <p className="text-sm text-muted-foreground">Chegirmalar, bonuslar va promo-kodlar</p>
        </div>
      </div>

      <Tabs defaultValue="perks">
        <TabsList>
          <TabsTrigger value="perks">💎 Premium Imkoniyatlar ({perks.length})</TabsTrigger>
          <TabsTrigger value="codes">🎟 Promo Kodlar ({codes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="perks" className="space-y-4 mt-4">
          <Button onClick={() => setEditing({ module_id: "clinic", tier_required: "starter", category: "discount", icon: "Sparkles", display_order: 0, is_active: true })} className="gap-2">
            <Plus className="w-4 h-4" /> Yangi imkoniyat
          </Button>

          {editing && (
            <Card><CardHeader><CardTitle>{editing.id ? "Tahrirlash" : "Yangi imkoniyat"}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Modul</Label>
                  <Select value={editing.module_id} onValueChange={(v) => setEditing({ ...editing, module_id: v })}>
                    <SelectTrigger /><SelectContent>{MODULES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Tarif (kerakli)</Label>
                  <Select value={editing.tier_required} onValueChange={(v) => setEditing({ ...editing, tier_required: v })}>
                    <SelectTrigger /><SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Kategoriya</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger /><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div><Label>Icon (lucide)</Label>
                  <Input value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="Sparkles" /></div>
                <div className="md:col-span-2"><Label>Sarlavha</Label>
                  <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Tavsif</Label>
                  <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                <div><Label>Qiymat (50%, AI, VIP)</Label>
                  <Input value={editing.value_text || ""} onChange={(e) => setEditing({ ...editing, value_text: e.target.value })} /></div>
                <div><Label>Badge</Label>
                  <Input value={editing.badge_text || ""} onChange={(e) => setEditing({ ...editing, badge_text: e.target.value })} placeholder="HOT, NEW, PRO" /></div>
                <div><Label>Tartib</Label>
                  <Input type="number" value={editing.display_order ?? 0} onChange={(e) => setEditing({ ...editing, display_order: +e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-7">
                  <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>Faol</Label>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={() => savePerk(editing)}>Saqlash</Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Bekor qilish</Button>
                </div>
              </CardContent></Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {perks.map((p) => (
              <Card key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{p.module_id}</Badge>
                        <Badge>{p.tier_required}</Badge>
                        <Badge variant="secondary">{p.category}</Badge>
                      </div>
                      <h4 className="font-semibold">{p.title} {p.value_text && <span className="text-primary">· {p.value_text}</span>}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={p.is_active} onCheckedChange={(v) => togglePerk(p.id, v)} />
                      <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePerk(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="codes" className="space-y-4 mt-4">
          <Button onClick={() => setEditingCode({ code: "", discount_pct: 10, is_active: true })} className="gap-2">
            <Plus className="w-4 h-4" /> Yangi promo-kod
          </Button>

          {editingCode && (
            <Card><CardHeader><CardTitle>{editingCode.id ? "Tahrirlash" : "Yangi kod"}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Kod</Label>
                  <Input value={editingCode.code || ""} onChange={(e) => setEditingCode({ ...editingCode, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className="font-mono" /></div>
                <div><Label>Chegirma %</Label>
                  <Input type="number" value={editingCode.discount_pct ?? 10} onChange={(e) => setEditingCode({ ...editingCode, discount_pct: +e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Tavsif</Label>
                  <Input value={editingCode.description || ""} onChange={(e) => setEditingCode({ ...editingCode, description: e.target.value })} /></div>
                <div><Label>Maks ishlatish</Label>
                  <Input type="number" value={editingCode.max_uses ?? ""} onChange={(e) => setEditingCode({ ...editingCode, max_uses: e.target.value ? +e.target.value : null })} /></div>
                <div><Label>Amal qilish (sana)</Label>
                  <Input type="datetime-local" value={editingCode.valid_until?.slice(0, 16) || ""} onChange={(e) => setEditingCode({ ...editingCode, valid_until: e.target.value || null })} /></div>
                <div className="flex items-center gap-2 pt-7">
                  <Switch checked={editingCode.is_active} onCheckedChange={(v) => setEditingCode({ ...editingCode, is_active: v })} />
                  <Label>Faol</Label>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button onClick={() => saveCode(editingCode)}>Saqlash</Button>
                  <Button variant="outline" onClick={() => setEditingCode(null)}>Bekor</Button>
                </div>
              </CardContent></Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {codes.map((c) => (
              <Card key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Ticket className="w-4 h-4 text-primary" />
                      <code className="font-mono font-bold text-primary">{c.code}</code>
                      <Badge>{c.discount_pct}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ishlatildi: {c.used_count || 0}{c.max_uses ? ` / ${c.max_uses}` : ""}
                      {c.valid_until && ` · ${new Date(c.valid_until).toLocaleDateString("uz-UZ")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingCode(c)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCode(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPremiumPerks;
