import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Coins, Loader2, RefreshCw, Search, Package, Users, Building2, AlertTriangle, Undo2, CheckCircle2,
} from "lucide-react";

type Overview = {
  active_balance: number; expired_balance: number; coins_sold: number; coins_spent: number;
  coins_refunded: number; org_balance: number; org_lifetime: number; revenue: number;
  payments_total: number; payments_paid: number; payments_pending: number;
  payments_refunded: number; unfulfilled: number;
};

type PaymentRow = {
  id: string; user_id: string | null; provider: string; amount: number; currency: string | null;
  status: string; purpose: string | null; metadata: Record<string, any> | null;
  paid_at: string | null; fulfilled_at: string | null; created_at: string;
};

type Pkg = {
  id?: string; code: string; name_uz: string; kind: string; price: number;
  coin_amount: number; bonus_coins: number; subscription_tier: string | null;
  duration_days: number; sort_order: number; is_active: boolean;
};

const money = (n: number) => `${Number(n || 0).toLocaleString("uz-UZ")} so'm`;
const dt = (s: string | null) => (s ? new Date(s).toLocaleString("uz-UZ") : "—");

const statusBadge = (p: PaymentRow) => {
  if (p.status === "refunded") return <Badge className="bg-amber-600 hover:bg-amber-600">Qaytarilgan</Badge>;
  if (p.status === "completed" || p.fulfilled_at) return <Badge className="bg-emerald-600 hover:bg-emerald-600">Yetkazildi</Badge>;
  if (p.status === "paid") return <Badge className="bg-sky-600 hover:bg-sky-600">To'landi (yetkazilmagan)</Badge>;
  if (p.status === "pending") return <Badge variant="secondary">Kutilmoqda</Badge>;
  return <Badge variant="outline">{p.status}</Badge>;
};

const emptyPkg: Pkg = {
  code: "", name_uz: "", kind: "med_coin", price: 0, coin_amount: 0, bonus_coins: 0,
  subscription_tier: null, duration_days: 30, sort_order: 0, is_active: true,
};

export default function MedCoinAdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payStatus, setPayStatus] = useState("all");
  const [paySearch, setPaySearch] = useState("");
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [editPkg, setEditPkg] = useState<Pkg | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResult, setUserResult] = useState<{ users: any[]; balances: Record<string, number>; history: any[] } | null>(null);
  const [adjust, setAdjust] = useState<{ user: any; amount: string; reason: string } | null>(null);
  const [orgAccounts, setOrgAccounts] = useState<any[]>([]);
  const [refundTarget, setRefundTarget] = useState<PaymentRow | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [busy, setBusy] = useState(false);

  const call = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("medcoin-admin", { body: payload });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  }, []);

  useEffect(() => {
    document.title = "Med Coin nazorati · MED1.UZ";
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAllowed(false); return; }
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setAllowed(Boolean(data));
    })();
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, pay, pkgs, orgs] = await Promise.all([
        call({ action: "overview" }),
        call({ action: "payments", status: payStatus, search: paySearch }),
        call({ action: "packages" }),
        call({ action: "org_accounts" }),
      ]);
      setOverview(ov.overview);
      setPayments(pay.payments);
      setProfiles(pay.profiles);
      setPackages(pkgs.packages);
      setOrgAccounts(orgs.accounts);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [call, payStatus, paySearch]);

  useEffect(() => { if (allowed) void loadAll(); }, [allowed, loadAll]);

  const profileOf = (id: string | null) => profiles.find((p) => p.id === id);

  const doFulfill = async (p: PaymentRow) => {
    setBusy(true);
    try {
      const r = await call({ action: "fulfill", payment_id: p.id });
      toast.success(r.result?.already ? "Allaqachon yetkazilgan" : `Yetkazildi · ${r.result?.coins ?? 0} Med Coin`);
      await loadAll();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const doRefund = async () => {
    if (!refundTarget) return;
    setBusy(true);
    try {
      const r = await call({ action: "refund", payment_id: refundTarget.id, reason: refundReason || "Admin qaytardi" });
      toast.success(`Qaytarildi · ${r.result?.coins_reversed ?? 0} Med Coin yechildi`);
      setRefundTarget(null); setRefundReason("");
      await loadAll();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const savePkg = async () => {
    if (!editPkg) return;
    setBusy(true);
    try {
      await call({ action: "package_save", package: editPkg });
      toast.success("Paket saqlandi");
      setEditPkg(null);
      await loadAll();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const disablePkg = async (id?: string) => {
    if (!id) return;
    setBusy(true);
    try { await call({ action: "package_delete", id }); toast.success("Paket nofaol qilindi"); await loadAll(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const lookupUser = async () => {
    setBusy(true);
    try { setUserResult(await call({ action: "user_lookup", search: userSearch })); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const applyAdjust = async () => {
    if (!adjust) return;
    setBusy(true);
    try {
      const r = await call({ action: "adjust", user_id: adjust.user.id, amount: Number(adjust.amount), reason: adjust.reason });
      toast.success(`Yangi balans: ${r.balance} Med Coin`);
      setAdjust(null);
      await lookupUser();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  if (allowed === null) {
    return <div className="min-h-[50vh] grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!allowed) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-center px-6">
        <div>
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h1 className="text-xl font-bold">Ruxsat yo'q</h1>
          <p className="text-muted-foreground text-sm mt-1">Bu sahifa faqat super admin uchun.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 space-y-6 max-w-7xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Coins className="w-6 h-6 text-amber-500" /> Med Coin nazorat markazi</h1>
          <p className="text-sm text-muted-foreground">Hisob, to'lov jarayoni, paketlar va muassasa hisoblari</p>
        </div>
        <Button variant="outline" onClick={() => void loadAll()} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />} Yangilash
        </Button>
      </header>

      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Aylanmadagi qoldiq", value: `${overview.active_balance} 🪙`, hint: `Muddati o'tgan: ${overview.expired_balance}` },
            { label: "Sotilgan coin", value: `${overview.coins_sold} 🪙`, hint: `Ishlatilgan: ${overview.coins_spent} · Qaytarilgan: ${overview.coins_refunded}` },
            { label: "Pul aylanmasi", value: money(overview.revenue), hint: `${overview.payments_paid} ta to'lov` },
            { label: "Muassasa hisoblari", value: `${overview.org_balance} 🪙`, hint: `Jami berilgan: ${overview.org_lifetime}` },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold mt-1">{c.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{c.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {overview && overview.unfulfilled > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <p className="text-sm"><AlertTriangle className="w-4 h-4 inline mr-1 text-amber-500" />
              {overview.unfulfilled} ta to'lov to'langan, lekin xizmat yetkazilmagan.</p>
            <Button size="sm" variant="outline" onClick={() => setPayStatus("unfulfilled")}>Ko'rish</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="payments">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="payments">To'lovlar</TabsTrigger>
          <TabsTrigger value="packages"><Package className="w-4 h-4 mr-1" /> Paketlar</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Foydalanuvchilar</TabsTrigger>
          <TabsTrigger value="orgs"><Building2 className="w-4 h-4 mr-1" /> Muassasalar</TabsTrigger>
        </TabsList>

        {/* To'lovlar */}
        <TabsContent value="payments" className="space-y-3 mt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { v: "all", l: "Barchasi" }, { v: "pending", l: "Kutilmoqda" },
              { v: "unfulfilled", l: "Yetkazilmagan" }, { v: "completed", l: "Yetkazilgan" },
              { v: "refunded", l: "Qaytarilgan" },
            ].map((f) => (
              <Button key={f.v} size="sm" variant={payStatus === f.v ? "default" : "outline"} onClick={() => setPayStatus(f.v)}>{f.l}</Button>
            ))}
            <div className="flex gap-2 ml-auto">
              <Input placeholder="ID yoki maqsad" value={paySearch} onChange={(e) => setPaySearch(e.target.value)} className="w-52" />
              <Button size="sm" variant="outline" onClick={() => void loadAll()}><Search className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="space-y-2">
            {payments.map((p) => {
              const prof = profileOf(p.user_id);
              const coins = Number(p.metadata?.coins_granted || 0);
              return (
                <Card key={p.id}>
                  <CardContent className="p-3 flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{p.metadata?.product || p.purpose || "To'lov"}</span>
                        {statusBadge(p)}
                        <Badge variant="outline" className="capitalize">{p.provider}</Badge>
                        {p.metadata?.package_kind === "subscription" && <Badge className="bg-violet-600 hover:bg-violet-600">Obuna</Badge>}
                        {p.metadata?.org_name && <Badge variant="secondary">{String(p.metadata.org_name)}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {prof?.full_name || prof?.email || p.user_id?.slice(0, 8) || "—"} · {dt(p.created_at)}
                        {coins > 0 && <> · <span className="text-amber-600 font-medium">+{coins} 🪙</span></>}
                        {p.metadata?.invoice_number && <> · {String(p.metadata.invoice_number)}</>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{money(p.amount)}</p>
                      <div className="flex gap-2 mt-1">
                        {p.status === "paid" && !p.fulfilled_at && (
                          <Button size="sm" disabled={busy} onClick={() => void doFulfill(p)}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Yetkazish
                          </Button>
                        )}
                        {(p.status === "paid" || p.status === "completed") && (
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => setRefundTarget(p)}>
                            <Undo2 className="w-3.5 h-3.5 mr-1" /> Qaytarish
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!payments.length && !loading && <p className="text-sm text-muted-foreground text-center py-6">To'lov topilmadi</p>}
          </div>
        </TabsContent>

        {/* Paketlar */}
        <TabsContent value="packages" className="space-y-3 mt-4">
          <Button size="sm" onClick={() => setEditPkg({ ...emptyPkg })}>+ Yangi paket</Button>
          <div className="grid md:grid-cols-2 gap-3">
            {packages.map((pk) => (
              <Card key={pk.id} className={pk.is_active ? "" : "opacity-60"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{pk.name_uz}</span>
                    <Badge variant={pk.kind === "subscription" ? "default" : "secondary"}>
                      {pk.kind === "subscription" ? "Obuna" : "Med Coin"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="font-mono text-xs text-muted-foreground">{pk.code}</p>
                  <p>{money(pk.price)} · {pk.coin_amount} 🪙 {pk.bonus_coins ? `+ ${pk.bonus_coins} bonus` : ""} · {pk.duration_days} kun</p>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setEditPkg(pk)}>Tahrirlash</Button>
                    {pk.is_active && <Button size="sm" variant="ghost" onClick={() => void disablePkg(pk.id)}>Nofaol qilish</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Foydalanuvchilar */}
        <TabsContent value="users" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Input placeholder="Email, ism, telefon yoki ID" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            <Button onClick={() => void lookupUser()} disabled={busy}><Search className="w-4 h-4 mr-1" /> Qidirish</Button>
          </div>
          {userResult?.users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{u.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.phone || "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-600">{userResult.balances[u.id] || 0} 🪙</span>
                  <Button size="sm" variant="outline" onClick={() => setAdjust({ user: u, amount: "", reason: "" })}>Coin o'zgartirish</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {userResult?.history?.length ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Oxirgi harakatlar</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-xs">
                {userResult.history.map((h: any) => (
                  <div key={h.id} className="flex justify-between border-b border-border/50 py-1">
                    <span>{h.description || h.type}</span>
                    <span className={h.amount > 0 ? "text-emerald-600" : "text-rose-600"}>
                      {h.amount > 0 ? "+" : ""}{h.amount} 🪙 · {dt(h.created_at)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Muassasalar */}
        <TabsContent value="orgs" className="space-y-2 mt-4">
          {orgAccounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{a.org_name || "Muassasa"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{a.org_type} · jami {a.lifetime_coins} 🪙</p>
                </div>
                <span className="font-bold text-amber-600">{a.balance} 🪙</span>
              </CardContent>
            </Card>
          ))}
          {!orgAccounts.length && <p className="text-sm text-muted-foreground text-center py-6">Muassasa hisobi yo'q</p>}
        </TabsContent>
      </Tabs>

      {/* Paket dialog */}
      <Dialog open={!!editPkg} onOpenChange={(o) => !o && setEditPkg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editPkg?.id ? "Paketni tahrirlash" : "Yangi paket"}</DialogTitle></DialogHeader>
          {editPkg && (
            <div className="space-y-3">
              <Input placeholder="Kod (coin_40)" value={editPkg.code} onChange={(e) => setEditPkg({ ...editPkg, code: e.target.value })} />
              <Input placeholder="Nomi" value={editPkg.name_uz} onChange={(e) => setEditPkg({ ...editPkg, name_uz: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Narx" value={editPkg.price} onChange={(e) => setEditPkg({ ...editPkg, price: Number(e.target.value) })} />
                <Input type="number" placeholder="Muddat (kun)" value={editPkg.duration_days} onChange={(e) => setEditPkg({ ...editPkg, duration_days: Number(e.target.value) })} />
                <Input type="number" placeholder="Coin" value={editPkg.coin_amount} onChange={(e) => setEditPkg({ ...editPkg, coin_amount: Number(e.target.value) })} />
                <Input type="number" placeholder="Bonus coin" value={editPkg.bonus_coins} onChange={(e) => setEditPkg({ ...editPkg, bonus_coins: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <Switch checked={editPkg.kind === "subscription"} onCheckedChange={(v) => setEditPkg({ ...editPkg, kind: v ? "subscription" : "med_coin" })} />
                  Obuna paketi
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={editPkg.is_active} onCheckedChange={(v) => setEditPkg({ ...editPkg, is_active: v })} />
                  Faol
                </label>
              </div>
              {editPkg.kind === "subscription" && (
                <Input placeholder="Tarif (lite/standard/premium)" value={editPkg.subscription_tier || ""} onChange={(e) => setEditPkg({ ...editPkg, subscription_tier: e.target.value })} />
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPkg(null)}>Bekor</Button>
            <Button onClick={() => void savePkg()} disabled={busy}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Coin o'zgartirish */}
      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Med Coin o'zgartirish</DialogTitle></DialogHeader>
          {adjust && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{adjust.user.email}</p>
              <Input type="number" placeholder="Miqdor (+ / −)" value={adjust.amount} onChange={(e) => setAdjust({ ...adjust, amount: e.target.value })} />
              <Textarea placeholder="Sabab (majburiy)" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjust(null)}>Bekor</Button>
            <Button onClick={() => void applyAdjust()} disabled={busy}>Tasdiqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund */}
      <Dialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>To'lovni qaytarish</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            {refundTarget && money(refundTarget.amount)} · berilgan {Number(refundTarget?.metadata?.coins_granted || 0)} Med Coin hisobdan yechiladi va obuna bekor qilinadi.
          </p>
          <Textarea placeholder="Qaytarish sababi" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Bekor</Button>
            <Button variant="destructive" onClick={() => void doRefund()} disabled={busy}>Qaytarish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
