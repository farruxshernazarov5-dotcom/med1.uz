/**
 * Super Admin — Hamkorlar (Partners) Hub
 * Centralized partner management with HAMBI as a first-class partner module.
 *
 * Tabs:
 *   overview · all · active · pending · hambi · api · clinics · diagnostics ·
 *   pharmacies · insurance · marketing · tech · revshare
 *
 * HAMBI tab embeds the existing /admin/hambi sub-modules (Users / AI / Subs /
 * Payments / Revenue / WebView / Legal / Documents) so the super-admin can
 * inspect HAMBI without leaving the Partners hub.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Handshake, Plug, Building2, Microscope, Pill, ShieldCheck, Megaphone, Cpu,
  Activity, Users, DollarSign, TrendingUp, Bot, Crown, Clock, CheckCircle2,
  XCircle, Sparkles, Globe2, Layers, Wallet,
} from "lucide-react";
import AdminApiPartners from "@/components/admin/AdminApiPartners";
import HambiUsers from "@/components/admin/hambi/UsersModule";
import HambiAi from "@/components/admin/hambi/AiServicesModule";
import HambiSubs from "@/components/admin/hambi/SubscriptionsModule";
import HambiPayments from "@/components/admin/hambi/PaymentsModule";
import HambiRevenue from "@/components/admin/hambi/RevenueModule";
import HambiWebView from "@/components/admin/hambi/WebViewModule";
import HambiLegal from "@/components/admin/hambi/LegalModule";
import HambiDocs from "@/components/admin/hambi/DocumentsModule";
import HambiAudit from "@/components/admin/hambi/IntegrationAuditModule";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type TabId =
  | "overview" | "all" | "active" | "pending" | "hambi" | "api"
  | "clinics" | "diagnostics" | "pharmacies" | "insurance"
  | "marketing" | "tech" | "revshare";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "overview",    label: "Bosh sahifa",       icon: Layers },
  { id: "all",         label: "Barcha hamkorlar",  icon: Handshake },
  { id: "active",      label: "Faol",              icon: CheckCircle2 },
  { id: "pending",     label: "Kutilayotgan",      icon: Clock },
  { id: "hambi",       label: "🟣 HAMBI",          icon: Sparkles },
  { id: "api",         label: "API hamkorlar",     icon: Plug },
  { id: "clinics",     label: "Klinikalar",        icon: Building2 },
  { id: "diagnostics", label: "Diagnostika",       icon: Microscope },
  { id: "pharmacies",  label: "Dorixonalar",       icon: Pill },
  { id: "insurance",   label: "Sug'urta",          icon: ShieldCheck },
  { id: "marketing",   label: "Marketing",         icon: Megaphone },
  { id: "tech",        label: "Texnologik",        icon: Cpu },
  { id: "revshare",    label: "RevShare",          icon: Wallet },
];

const HAMBI_TABS = [
  { id: "audit",    label: "🛡️ Readiness Audit",   C: HambiAudit },
  { id: "users",    label: "👥 Foydalanuvchilar", C: HambiUsers },
  { id: "ai",       label: "🤖 AI Xizmatlar",      C: HambiAi },
  { id: "subs",     label: "💳 Obunalar",          C: HambiSubs },
  { id: "pay",      label: "💰 To'lovlar",         C: HambiPayments },
  { id: "rev",      label: "📈 Daromad",           C: HambiRevenue },
  { id: "web",      label: "🌐 Web-View",          C: HambiWebView },
  { id: "legal",    label: "📜 Legal",             C: HambiLegal },
  { id: "docs",     label: "📂 Hujjatlar",         C: HambiDocs },
] as const;

const StatPill = ({ icon: Icon, label, value, hint, tone = "blue" }: any) => {
  const tones: Record<string, string> = {
    blue:   "from-blue-500/15 to-cyan-500/10 ring-blue-400/20 text-blue-100",
    violet: "from-violet-500/15 to-fuchsia-500/10 ring-violet-400/20 text-violet-100",
    green:  "from-emerald-500/15 to-teal-500/10 ring-emerald-400/20 text-emerald-100",
    amber:  "from-amber-500/15 to-orange-500/10 ring-amber-400/20 text-amber-100",
    rose:   "from-rose-500/15 to-pink-500/10 ring-rose-400/20 text-rose-100",
  };
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-4 ring-1 backdrop-blur-xl",
      "bg-gradient-to-br", tones[tone],
    )}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider opacity-80">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-[10px] opacity-70 mt-1">{hint}</p>}
    </div>
  );
};

const PartnerRow = ({ p, onApprove, onReject }: any) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-white/10 hover:ring-white/25 p-3 transition">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-white truncate">{p.org_name}</p>
        <Badge variant="outline" className="border-white/20 text-white/70 text-[9px] px-1.5 py-0">
          {p.org_type}
        </Badge>
        <Badge className={cn(
          "text-[9px] px-1.5 py-0",
          p.status === "approved" && "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
          p.status === "pending" && "bg-amber-500/20 text-amber-200 border-amber-400/30",
          p.status === "rejected" && "bg-rose-500/20 text-rose-200 border-rose-400/30",
        )}>{p.status}</Badge>
      </div>
      <p className="text-[11px] text-white/55 truncate">{p.contact_email} · {p.tier}</p>
    </div>
    {p.status === "pending" && (
      <div className="flex gap-1.5 shrink-0">
        <Button size="sm" className="h-7 text-[10px] bg-emerald-500/80 hover:bg-emerald-500 text-white" onClick={() => onApprove(p.id)}>
          <CheckCircle2 className="w-3 h-3 mr-1" /> Tasdiqlash
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-rose-400/40 text-rose-200 hover:bg-rose-500/10" onClick={() => onReject(p.id)}>
          <XCircle className="w-3 h-3 mr-1" /> Rad
        </Button>
      </div>
    )}
  </div>
);

const AdminPartnersModule = () => {
  const [tab, setTab] = useState<TabId>("overview");
  const [hambiTab, setHambiTab] = useState<typeof HAMBI_TABS[number]["id"]>("users");
  const [partners, setPartners] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    clinics: 0, diagnostics: 0, pharmacies: 0, medtech: 0,
    hambiUsers: 0, aiUsage: 0, aiRevenue: 0, activeSubs: 0,
  });
  const [series, setSeries] = useState<{ name: string; partners: number; revenue: number }[]>([]);

  const refresh = async () => {
    const [pRes, cRes, dRes, phRes, mtRes, usersRes, aiUsageRes, payRes, subsRes] = await Promise.all([
      supabase.from("api_partners").select("*").order("created_at", { ascending: false }),
      supabase.from("registered_clinics").select("id,is_active,created_at"),
      supabase.from("registered_diagnostics").select("id,is_active,created_at"),
      supabase.from("registered_pharmacies").select("id,is_active,created_at"),
      supabase.from("medtech_vendors").select("id,is_active,created_at"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("ai_usage").select("id", { count: "exact", head: true }),
      supabase.from("ai_payments").select("amount,status,created_at"),
      supabase.from("ai_subscriptions").select("id,status"),
    ]);

    const pays = (payRes.data || []).filter((p: any) => p.status === "paid");
    setPartners(pRes.data || []);
    setCounts({
      clinics: cRes.data?.length || 0,
      diagnostics: dRes.data?.length || 0,
      pharmacies: phRes.data?.length || 0,
      medtech: mtRes.data?.length || 0,
      hambiUsers: usersRes.count || 0,
      aiUsage: aiUsageRes.count || 0,
      aiRevenue: pays.reduce((s, p: any) => s + Number(p.amount || 0), 0),
      activeSubs: (subsRes.data || []).filter((s: any) => s.status === "active").length,
    });

    // Build 6-month series
    const months = ["Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy"];
    const now = new Date();
    const arr = months.map((m, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const ptn = (pRes.data || []).filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= date && d < next;
      }).length;
      const rev = pays.filter((p: any) => {
        const d = new Date(p.created_at);
        return d >= date && d < next;
      }).reduce((s, p: any) => s + Number(p.amount || 0), 0);
      return { name: m, partners: ptn, revenue: Math.round(rev) };
    });
    setSeries(arr);
  };

  useEffect(() => { refresh(); }, []);

  // Realtime new partner notifications
  useEffect(() => {
    const ch = supabase.channel("admin-partners-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "api_partners" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => {
    const ext = counts.clinics + counts.diagnostics + counts.pharmacies + counts.medtech;
    return {
      total: partners.length + ext,
      active: partners.filter(p => p.status === "approved").length + ext,
      pending: partners.filter(p => p.status === "pending").length,
      revshare: Math.round(counts.aiRevenue * 0.3),
    };
  }, [partners, counts]);

  const approve = async (id: string) => {
    await supabase.from("api_partners").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
    refresh();
  };
  const reject = async (id: string) => {
    await supabase.from("api_partners").update({ status: "rejected" }).eq("id", id);
    refresh();
  };

  /* ─── Renderers ─── */
  const renderOverview = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill icon={Handshake} label="Jami hamkorlar" value={stats.total} hint="API + tashqi muassasalar" tone="blue" />
        <StatPill icon={CheckCircle2} label="Faol" value={stats.active} hint="Tasdiqlangan" tone="green" />
        <StatPill icon={Clock} label="Kutilmoqda" value={stats.pending} hint="Ko'rib chiqilmoqda" tone="amber" />
        <StatPill icon={Sparkles} label="HAMBI foydalanuvchilar" value={counts.hambiUsers.toLocaleString()} hint="Real vaqt" tone="violet" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill icon={Bot} label="AI so'rovlar" value={counts.aiUsage.toLocaleString()} tone="violet" />
        <StatPill icon={Crown} label="Faol obunalar" value={counts.activeSubs} tone="amber" />
        <StatPill icon={DollarSign} label="AI daromad" value={`${counts.aiRevenue.toLocaleString()} so'm`} tone="green" />
        <StatPill icon={Wallet} label="RevShare (30%)" value={`${stats.revshare.toLocaleString()} so'm`} hint="MED-ALL ↔ HAMBI" tone="rose" />
      </div>

      <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-300" /> Dinamika (6 oy)
          </h3>
          <span className="text-[10px] text-white/40">hamkorlar va daromad</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0A2540", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="partners" stroke="#7B61FF" fill="url(#gP)" name="Hamkorlar" />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#gR)" name="Daromad" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Klinikalar", v: counts.clinics, i: Building2 },
          { l: "Diagnostika", v: counts.diagnostics, i: Microscope },
          { l: "Dorixonalar", v: counts.pharmacies, i: Pill },
          { l: "Med-texnika", v: counts.medtech, i: Cpu },
        ].map(c => (
          <Card key={c.l} className="bg-white/[0.03] border-white/10 backdrop-blur-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 ring-1 ring-white/15 flex items-center justify-center">
                <c.i className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">{c.l}</p>
                <p className="text-xl font-bold text-white tabular-nums">{c.v}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderList = (filtered: any[], emptyMsg: string) => (
    <div className="space-y-2">
      {filtered.length === 0
        ? <p className="text-center py-12 text-white/50 text-sm">{emptyMsg}</p>
        : filtered.map(p => <PartnerRow key={p.id} p={p} onApprove={approve} onReject={reject} />)
      }
    </div>
  );

  const renderHambi = () => {
    const Active = HAMBI_TABS.find(t => t.id === hambiTab)!.C;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-4 ring-1 ring-violet-400/30 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">HAMBI — Strategic AI Partner</h3>
              <p className="text-[11px] text-white/60">SSO · JWT · API Sync · Web-View monitoring · RevShare 30%</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30">ONLINE</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {HAMBI_TABS.map(t => (
            <button key={t.id} onClick={() => setHambiTab(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium transition ring-1",
                hambiTab === t.id
                  ? "bg-violet-500/30 text-white ring-violet-400/50"
                  : "bg-white/[0.04] text-white/70 ring-white/10 hover:ring-white/25",
              )}
            >{t.label}</button>
          ))}
        </div>

        <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
          <Active slug="hambi" lang="uz" />
        </div>
      </div>
    );
  };

  const categoryFilter = (typeKey: string) => partners.filter(p => p.org_type === typeKey);

  const renderRevshare = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill icon={DollarSign} label="Umumiy tushum" value={`${counts.aiRevenue.toLocaleString()} so'm`} tone="green" />
        <StatPill icon={Crown} label="MED-ALL ulushi (70%)" value={`${Math.round(counts.aiRevenue * 0.7).toLocaleString()}`} tone="blue" />
        <StatPill icon={Sparkles} label="HAMBI ulushi (30%)" value={`${stats.revshare.toLocaleString()}`} tone="violet" />
        <StatPill icon={Wallet} label="To'lanishi kerak" value={`${stats.revshare.toLocaleString()}`} hint="Joriy davr" tone="amber" />
      </div>
      <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-300" /> RevShare dinamikasi
        </h3>
        <div className="h-56">
          <ResponsiveContainer>
            <AreaChart data={series.map(s => ({ ...s, hambi: Math.round(s.revenue * 0.3) }))}>
              <defs>
                <linearGradient id="rsh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0A2540", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="hambi" stroke="#A78BFA" fill="url(#rsh)" name="HAMBI 30%" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/40 ring-1 ring-white/20 flex items-center justify-center">
          <Handshake className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Hamkorlar (Partners)</h2>
          <p className="text-[11px] text-white/50">MED-ALL AI ekotizimidagi barcha hamkorlar — markaziy boshqaruv</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/20 text-white/80 hover:bg-white/10" onClick={refresh}>
            <Activity className="w-3 h-3 mr-1" /> Yangilash
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition ring-1",
                tab === t.id
                  ? "bg-gradient-to-r from-violet-500/30 to-cyan-500/30 text-white ring-white/30"
                  : "bg-white/[0.04] text-white/70 ring-white/10 hover:ring-white/25",
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {tab === "overview"    && renderOverview()}
        {tab === "all"         && renderList(partners, "Hamkorlar yo'q")}
        {tab === "active"      && renderList(partners.filter(p => p.status === "approved"), "Faol hamkor yo'q")}
        {tab === "pending"     && renderList(partners.filter(p => p.status === "pending"), "Kutilayotgan ariza yo'q")}
        {tab === "hambi"       && renderHambi()}
        {tab === "api"         && <div className="rounded-2xl ring-1 ring-white/10 bg-white/[0.02] p-4"><AdminApiPartners /></div>}
        {tab === "clinics"     && renderList(categoryFilter("clinic"), "Klinik hamkor yo'q")}
        {tab === "diagnostics" && renderList(categoryFilter("diagnostics"), "Diagnostika hamkor yo'q")}
        {tab === "pharmacies"  && renderList(categoryFilter("pharmacy"), "Dorixona hamkor yo'q")}
        {tab === "insurance"   && renderList(categoryFilter("insurance"), "Sug'urta hamkor yo'q")}
        {tab === "marketing"   && renderList(categoryFilter("marketing"), "Marketing hamkor yo'q")}
        {tab === "tech"        && renderList(categoryFilter("tech"), "Texnologik hamkor yo'q")}
        {tab === "revshare"    && renderRevshare()}
      </div>
    </div>
  );
};

export default AdminPartnersModule;
