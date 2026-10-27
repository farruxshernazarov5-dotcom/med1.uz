import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Activity, ArrowLeft, BookOpen, CreditCard, Download, Globe2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getClickMiniAppState, subscribeClickMiniApp } from "@/lib/clickMiniApp";
import { clickPartnerStats, type ClickConversion } from "@/lib/clickPartnerStats";

const ClickTestPanel = lazy(() => import("@/components/admin/payments/ClickTestPanel"));
const modules = [
  { id: "overview", name: "Umumiy ko‘rinish", icon: Activity },
  { id: "activity", name: "Tashriflar va konversiyalar", icon: Globe2 },
  { id: "miniapp", name: "Click MiniApp", icon: ShieldCheck },
  { id: "payments", name: "To‘lovlar va callbacklar", icon: CreditCard },
  { id: "docs", name: "Ulanish ma’lumotlari", icon: BookOpen },
];

export default function ClickPartnerAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [active, setActive] = useState("overview");
  const [visits, setVisits] = useState(0);
  const [rows, setRows] = useState<ClickConversion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [operations, setOperations] = useState(false);
  const host = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  const stats = clickPartnerStats(rows);

  useEffect(() => {
    let cancelled = false;
    setAllowed(null);
    if (authLoading) return;
    if (!user) { setAllowed(false); return; }
    void supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data, error }) => {
      if (!cancelled) setAllowed(!error && data === true);
    });
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  const refresh = async () => {
    if (!allowed) return;
    setBusy(true); setError("");
    const [v, c] = await Promise.all([
      supabase.from("partner_visits").select("id", { head: true, count: "exact" }).eq("source_slug", "click"),
      supabase.from("partner_conversions").select("id,created_at,conversion_type,module,amount,currency,status,source_slug").eq("source_slug", "click").order("created_at", { ascending: false }).limit(100),
    ]);
    if (v.error || c.error) setError("Click ma’lumotlarini o‘qib bo‘lmadi. Qayta urinib ko‘ring.");
    else { setVisits(v.count ?? 0); setRows(c.data ?? []); }
    setBusy(false);
  };
  useEffect(() => { if (allowed) void refresh(); }, [allowed]);

  const exportRows = () => {
    const blob = new Blob([JSON.stringify(stats.rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "click-conversions.json"; anchor.click(); URL.revokeObjectURL(url);
  };

  if (authLoading || allowed === null) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!allowed) return <main className="mx-auto max-w-lg px-6 py-20 text-center space-y-4"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h1 className="text-xl font-semibold">Click — administrator paneli</h1><p className="text-muted-foreground">Bu sahifa uchun administrator huquqi kerak.</p><Button asChild><Link to="/auth?next=%2Fadmin%2Fpartners%2Fclick">Tizimga kirish</Link></Button></main>;

  const activity = <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Click konversiyalari</h2><Button variant="outline" size="sm" onClick={exportRows} disabled={!stats.rows.length}><Download className="h-4 w-4" /> Eksport</Button></div>
    <p className="text-xs text-muted-foreground">So‘nggi 100 konversiya · faqat Click manbasi · tashrif — MiniApp ulanishi tasdig‘i emas</p>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b border-border text-left text-muted-foreground"><tr>{["Sana", "Turi", "Xizmat", "Summa", "Holat"].map(label => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{stats.rows.map(row => <tr key={row.id} className="border-b border-border"><td className="p-3 whitespace-nowrap">{new Date(row.created_at).toLocaleString("uz-UZ")}</td><td className="p-3">{row.conversion_type}</td><td className="p-3">{row.module ?? "—"}</td><td className="p-3 whitespace-nowrap">{Number(row.amount).toLocaleString("uz-UZ")} {row.currency}</td><td className="p-3"><Badge variant="outline">{row.status}</Badge></td></tr>)}</tbody></table></div>
    {!stats.rows.length && <p className="py-10 text-center text-muted-foreground">Click orqali konversiyalar hali qayd etilmagan.</p>}
  </section>;

  return <main className="min-h-screen bg-background text-foreground">
    <Helmet><title>Click boshqaruv markazi · MED1.UZ</title><meta name="description" content="Click MiniApp, to‘lovlar va hamkor tashriflari boshqaruvi." /></Helmet>
    <header className="border-b border-border"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-6 sm:px-6"><Button asChild variant="ghost" size="icon"><Link to="/admin" aria-label="Admin panelga qaytish"><ArrowLeft /></Link></Button><div className="flex-1"><p className="text-xs text-muted-foreground">MED ALL × Click</p><h1 className="text-2xl font-semibold">Click boshqaruv markazi</h1></div><Badge variant="outline">Alohida Click tizimi</Badge><Button variant="outline" size="icon" onClick={() => void refresh()} disabled={busy} aria-label="Yangilash"><RefreshCw className={busy ? "animate-spin" : ""} /></Button></div></header>
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <nav aria-label="Click bo‘limlari" className="flex gap-2 overflow-x-auto lg:flex-col">{modules.map(({ id, name, icon: Icon }) => <Button key={id} variant={active === id ? "secondary" : "ghost"} className="shrink-0 justify-start" onClick={() => setActive(id)}><Icon className="h-4 w-4" />{name}</Button>)}</nav>
      <div className="min-w-0 space-y-6">{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {active === "overview" && <><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[{ label: "Click tashriflari", value: visits }, { label: "Ro‘yxatdan o‘tish", value: stats.signups }, { label: "Tasdiqlangan obunalar", value: stats.subscriptions }, { label: "Tasdiqlangan tushum (UZS)", value: stats.revenue }].map(item => <Card key={item.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-3 break-words text-2xl font-semibold tabular-nums">{busy ? "…" : item.value.toLocaleString("uz-UZ")}</p></CardContent></Card>)}</div>{activity}</>}
        {active === "activity" && activity}
        {active === "miniapp" && <section className="space-y-5"><h2 className="text-lg font-semibold">Click MiniApp holati</h2><dl className="divide-y divide-border">{[["Kirish sahifasi", "https://med1.uz/click"], ["Joriy qurilmada Click SDK", host.active ? "Rasmiy ulanish tasdiqlandi" : "Oddiy brauzer — Click qurilmasida tekshirish kerak"], ["Click web-session", "Hosting orqali so‘rovga mos uzatish talab qilinadi"], ["MiniApp to‘lovi", "Click bergan alohida Service ID va haqiqiy qurilma sinovi kerak"], ["Med1 hisobi", "Mavjud kirish va profillar saqlanadi"]].map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-2"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words text-sm">{value}</dd></div>)}</dl><Button asChild variant="outline"><Link to="/click">Click sahifasini ochish</Link></Button></section>}
        {active === "payments" && <section className="space-y-4"><h2 className="text-lg font-semibold">Click to‘lovlar boshqaruvi</h2>{!operations ? <><p className="text-sm text-muted-foreground">Diagnostika, Prepare/Complete, to‘lov jurnali va fiskalizatsiya. Sinov amallari to‘lov yozuvlarini yaratishi mumkin.</p><Button variant="outline" onClick={() => setOperations(true)}><CreditCard className="h-4 w-4" /> Boshqaruv amallarini ochish</Button></> : <Suspense fallback={<Loader2 className="animate-spin" />}><ClickTestPanel /></Suspense>}</section>}
        {active === "docs" && <section className="space-y-4"><h2 className="text-lg font-semibold">Click ulanish ma’lumotlari</h2>{[["MiniApp", "https://med1.uz/click"], ["Prepare", "https://pay.med1.uz/click/prepare"], ["Complete", "https://pay.med1.uz/click/complete"], ["To‘lovdan qaytish", "https://med1.uz/payment/success"]].map(([label, value]) => <div key={label} className="border-b border-border py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm">{value}</p></div>)}<Button asChild variant="outline"><a href="https://one-platform.click.uz/merchant-docs/reference" target="_blank" rel="noopener noreferrer"><BookOpen className="h-4 w-4" /> Click rasmiy hujjatlari</a></Button></section>}
      </div>
    </div>
  </main>;
}