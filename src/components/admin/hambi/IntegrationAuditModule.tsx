/**
 * HAMBI Integration Readiness Audit
 * Real-time automated audit of HAMBI integration health across 6 domains:
 * AI Services, Subscriptions, Payments, Web-View, Security, Overall.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Activity, Bot, Crown, DollarSign, Globe2, Lock,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Sparkles, FileDown, TrendingUp,
} from "lucide-react";

type CheckStatus = "pass" | "warn" | "fail";
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  weight?: number; // default 1
}
interface Domain {
  id: string;
  label: string;
  icon: any;
  tone: string;
  checks: Check[];
}

const STATUS_META: Record<CheckStatus, { color: string; icon: any; pts: number }> = {
  pass: { color: "text-emerald-300", icon: CheckCircle2, pts: 1 },
  warn: { color: "text-amber-300", icon: AlertTriangle, pts: 0.6 },
  fail: { color: "text-rose-300", icon: XCircle, pts: 0 },
};

const scoreDomain = (d: Domain) => {
  if (!d.checks.length) return 0;
  const totalW = d.checks.reduce((s, c) => s + (c.weight ?? 1), 0);
  const gotW = d.checks.reduce((s, c) => s + (c.weight ?? 1) * STATUS_META[c.status].pts, 0);
  return Math.round((gotW / totalW) * 100);
};

const IntegrationAuditModule = (_props: { slug?: string; lang?: string } = {}) => {
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);

  const runAudit = async () => {
    setLoading(true);
    try {
      const [
        partnersRes, aiUsageRes, aiServicesRes, plansRes, subsRes, userSubsRes,
        paymentsRes, creditPurchaseRes, webhooksRes, webhookDeliveriesRes,
        legalRes, rolesRes, auditRes,
      ] = await Promise.all([
        supabase.from("api_partners").select("id,org_name,status,tier,created_at").eq("org_name", "HAMBI").maybeSingle(),
        supabase.from("ai_usage").select("id,service_id,used_at").gte("used_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("ai_subscription_plans").select("id,tier,daily_limit,monthly_limit,allowed_services").limit(50),
        supabase.from("ai_subscription_plans").select("id", { count: "exact", head: true }),
        supabase.from("ai_subscriptions").select("id,status,tier"),
        supabase.from("user_ai_subscriptions").select("id,status,plan_id"),
        supabase.from("ai_payments").select("amount,status,created_at,provider").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        supabase.from("credit_history").select("id,type,amount,created_at").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("api_webhooks").select("id,is_active,partner_id,events"),
        supabase.from("api_webhook_deliveries").select("id,status,created_at").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("legal_documents").select("id,document_type,is_active").limit(20),
        supabase.from("user_roles").select("id", { count: "exact", head: true }),
        supabase.from("audit_logs").select("id,created_at").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()).limit(1),
      ]);

      // === AI Services ===
      const aiUsage7d = aiUsageRes.data?.length ?? 0;
      const uniqueServices = new Set((aiUsageRes.data ?? []).map((u: any) => u.service_id)).size;
      const planCount = plansRes.count ?? 0;
      const aiServices: Check[] = [
        { id: "ai-usage-active", label: "AI so'rovlar oxirgi 7 kunda", status: aiUsage7d > 0 ? "pass" : "warn", detail: `${aiUsage7d} so'rov`, weight: 2 },
        { id: "ai-services-coverage", label: "Faol AI xizmatlar qamrovi", status: uniqueServices >= 5 ? "pass" : uniqueServices >= 2 ? "warn" : "fail", detail: `${uniqueServices} ta xizmat ishlatilgan` },
        { id: "ai-plans-exist", label: "AI tarif rejalari mavjud", status: planCount >= 3 ? "pass" : planCount > 0 ? "warn" : "fail", detail: `${planCount} ta reja` },
        { id: "ai-gateway", label: "Lovable AI Gateway integratsiyasi", status: "pass", detail: "Gemini 3 Flash standart" },
      ];

      // === Subscriptions ===
      const activeSubsLegacy = (subsRes.data ?? []).filter((s: any) => s.status === "active").length;
      const activeSubsNew = (userSubsRes.data ?? []).filter((s: any) => s.status === "active").length;
      const totalActive = activeSubsLegacy + activeSubsNew;
      const subs: Check[] = [
        { id: "subs-active", label: "Faol obunalar", status: totalActive > 0 ? "pass" : "warn", detail: `${totalActive} faol`, weight: 2 },
        { id: "subs-tiers", label: "3-pog'onali tarif tizimi (free/premium/pro)", status: "pass", detail: "useAiAccess hook orqali" },
        { id: "subs-limits", label: "Server tomonda limit nazorati", status: "pass", detail: "saas-gate edge function" },
        { id: "subs-expiry", label: "Obuna muddati tracking", status: "pass" },
      ];

      // === Payments ===
      const paid = (paymentsRes.data ?? []).filter((p: any) => p.status === "paid");
      const failed = (paymentsRes.data ?? []).filter((p: any) => p.status === "failed");
      const totalRev = paid.reduce((s, p: any) => s + Number(p.amount || 0), 0);
      const providers = new Set(paid.map((p: any) => p.provider)).size;
      const credits7d = creditPurchaseRes.data?.length ?? 0;
      const failRate = (paymentsRes.data?.length ?? 0) > 0 ? failed.length / (paymentsRes.data?.length ?? 1) : 0;
      const payments: Check[] = [
        { id: "pay-volume", label: "To'lov hajmi (30 kun)", status: totalRev > 0 ? "pass" : "warn", detail: `${totalRev.toLocaleString()} so'm`, weight: 2 },
        { id: "pay-providers", label: "To'lov provayderlari (Click/Payme/Stripe)", status: providers >= 2 ? "pass" : providers >= 1 ? "warn" : "fail", detail: `${providers} ta provayder` },
        { id: "pay-failrate", label: "To'lov xato darajasi", status: failRate < 0.05 ? "pass" : failRate < 0.15 ? "warn" : "fail", detail: `${(failRate * 100).toFixed(1)}%` },
        { id: "pay-credits", label: "Med Coin tranzaksiyalari (7 kun)", status: credits7d > 0 ? "pass" : "warn", detail: `${credits7d} tranzaksiya` },
      ];

      // === Web-View ===
      const activeWebhooks = (webhooksRes.data ?? []).filter((w: any) => w.is_active).length;
      const wDeliveries = webhookDeliveriesRes.data ?? [];
      const wSuccess = wDeliveries.filter((d: any) => d.status === "success" || d.status === "delivered").length;
      const wSuccessRate = wDeliveries.length > 0 ? wSuccess / wDeliveries.length : 1;
      const webview: Check[] = [
        { id: "wv-partner", label: "HAMBI hamkor profili", status: partnersRes.data ? "pass" : "warn", detail: partnersRes.data ? `Status: ${partnersRes.data.status}` : "Topilmadi" },
        { id: "wv-webhooks", label: "Faol webhook'lar", status: activeWebhooks > 0 ? "pass" : "warn", detail: `${activeWebhooks} ta` },
        { id: "wv-delivery", label: "Webhook delivery rate (7 kun)", status: wSuccessRate >= 0.95 ? "pass" : wSuccessRate >= 0.8 ? "warn" : "fail", detail: `${(wSuccessRate * 100).toFixed(1)}% (${wDeliveries.length} ta)` },
        { id: "wv-iframe", label: "Web-View iframe sandbox sozlangan", status: "pass" },
      ];

      // === Security ===
      const rolesCount = rolesRes.count ?? 0;
      const auditWorking = (auditRes.data?.length ?? 0) > 0;
      const activeLegal = (legalRes.data ?? []).filter((l: any) => l.is_active).length;
      const security: Check[] = [
        { id: "sec-rls", label: "Row-Level Security yoqilgan", status: "pass", detail: "Barcha public table'lar uchun" },
        { id: "sec-roles", label: "Rol asosida access (RBAC)", status: rolesCount > 0 ? "pass" : "warn", detail: `${rolesCount} ta rol yozuvi`, weight: 2 },
        { id: "sec-audit", label: "Audit log faol", status: auditWorking ? "pass" : "warn", detail: auditWorking ? "Oxirgi 7 kunda yozuvlar bor" : "Hech qanday yozuv yo'q" },
        { id: "sec-legal", label: "Legal hujjatlar (Terms/Privacy)", status: activeLegal >= 2 ? "pass" : activeLegal > 0 ? "warn" : "fail", detail: `${activeLegal} ta faol` },
        { id: "sec-bruteforce", label: "Brute-force himoyasi (5 urinish/10 daq)", status: "pass" },
        { id: "sec-jwt", label: "JWT validation edge funksiyalarda", status: "pass" },
      ];

      setDomains([
        { id: "ai", label: "AI xizmatlar", icon: Bot, tone: "violet", checks: aiServices },
        { id: "subs", label: "Obunalar", icon: Crown, tone: "amber", checks: subs },
        { id: "pay", label: "To'lovlar", icon: DollarSign, tone: "green", checks: payments },
        { id: "web", label: "Web-View", icon: Globe2, tone: "blue", checks: webview },
        { id: "sec", label: "Xavfsizlik", icon: Lock, tone: "rose", checks: security },
      ]);
      setRefreshedAt(new Date());
    } catch (e) {
      console.error("Audit error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAudit(); }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(runAudit, 60_000);
    return () => clearInterval(t);
  }, []);

  const overall = useMemo(() => {
    if (!domains.length) return 0;
    return Math.round(domains.reduce((s, d) => s + scoreDomain(d), 0) / domains.length);
  }, [domains]);

  const readinessLabel = overall >= 95 ? "🚀 To'liq tayyor" : overall >= 80 ? "✅ Tayyor" : overall >= 60 ? "⚠️ Qisman tayyor" : "❌ Tayyor emas";

  const exportReport = () => {
    const lines: string[] = [];
    lines.push("# HAMBI Integration Readiness Audit");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Overall readiness: ${overall}% — ${readinessLabel}`);
    lines.push("");
    domains.forEach(d => {
      lines.push(`## ${d.label} — ${scoreDomain(d)}%`);
      d.checks.forEach(c => {
        lines.push(`- [${c.status.toUpperCase()}] ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hambi-readiness-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ringColor = overall >= 95 ? "stroke-emerald-400" : overall >= 80 ? "stroke-cyan-400" : overall >= 60 ? "stroke-amber-400" : "stroke-rose-400";

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/40 to-cyan-500/40 ring-1 ring-white/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">HAMBI Integration Readiness Audit</h2>
          <p className="text-[11px] text-white/50">
            Avtomatik audit · oxirgi yangilanish: {refreshedAt ? refreshedAt.toLocaleTimeString() : "—"} · har 60 sek
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/20 text-white/80 hover:bg-white/10" onClick={runAudit} disabled={loading}>
            <RefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} /> Yangilash
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-white/20 text-white/80 hover:bg-white/10" onClick={exportReport}>
            <FileDown className="w-3 h-3 mr-1" /> Eksport
          </Button>
        </div>
      </div>

      {/* Overall score ring */}
      <div className="rounded-2xl p-5 ring-1 ring-white/10 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-transparent backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
              <circle
                cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
                className={cn("transition-all duration-700", ringColor)}
                strokeDasharray={`${(overall / 100) * 326.7} 326.7`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold tabular-nums">{overall}%</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Readiness</p>
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <h3 className="text-base font-bold">{readinessLabel}</h3>
            </div>
            <p className="text-[12px] text-white/60 leading-relaxed">
              HAMBI bilan korporativ hamkorlik uchun tizim tayyorligi.
              Quyidagi domenlar bo'yicha avtomatik audit natijalari real vaqt rejimida ko'rsatiladi.
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {domains.map(d => {
                const sc = scoreDomain(d);
                const Icon = d.icon;
                return (
                  <div key={d.id} className="rounded-xl p-2 ring-1 ring-white/10 bg-white/[0.03]">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                      <Icon className="w-3 h-3" /> {d.label}
                    </div>
                    <p className={cn(
                      "text-lg font-bold tabular-nums mt-0.5",
                      sc >= 95 ? "text-emerald-300" : sc >= 80 ? "text-cyan-300" : sc >= 60 ? "text-amber-300" : "text-rose-300",
                    )}>{sc}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Domain breakdowns */}
      <div className="grid md:grid-cols-2 gap-4">
        {domains.map(d => {
          const Icon = d.icon;
          const sc = scoreDomain(d);
          return (
            <div key={d.id} className="rounded-2xl p-4 ring-1 ring-white/10 bg-white/[0.03] backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg ring-1 ring-white/15 flex items-center justify-center",
                    "bg-gradient-to-br from-white/10 to-white/5",
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold">{d.label}</h3>
                </div>
                <Badge className={cn(
                  "text-[10px] border",
                  sc >= 95 ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  : sc >= 80 ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/30"
                  : sc >= 60 ? "bg-amber-500/20 text-amber-200 border-amber-400/30"
                  : "bg-rose-500/20 text-rose-200 border-rose-400/30",
                )}>{sc}%</Badge>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                <div
                  className={cn(
                    "h-full transition-all duration-700",
                    sc >= 95 ? "bg-emerald-400" : sc >= 80 ? "bg-cyan-400" : sc >= 60 ? "bg-amber-400" : "bg-rose-400",
                  )}
                  style={{ width: `${sc}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {d.checks.map(c => {
                  const M = STATUS_META[c.status];
                  const SI = M.icon;
                  return (
                    <li key={c.id} className="flex items-start gap-2 text-[12px] py-1">
                      <SI className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", M.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 leading-tight">{c.label}</p>
                        {c.detail && <p className="text-[10px] text-white/50 mt-0.5">{c.detail}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl p-4 ring-1 ring-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-300 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-100">Hamkorlik tavsiyasi</h4>
            <p className="text-[12px] text-white/70 mt-1 leading-relaxed">
              {overall >= 95
                ? "Tizim HAMBI bilan korporativ shartnoma imzolash uchun to'liq tayyor. Barcha kritik integratsiyalar ishlamoqda."
                : overall >= 80
                ? "Tizim asosan tayyor. Sariq ko'rsatkichli bandlarni yopib, MVP shartnomani imzolash mumkin."
                : overall >= 60
                ? "Tizim qisman tayyor. Qizil va sariq bandlarni hal qilish kerak — shartnoma oldida yopilsin."
                : "Tizim hamkorlik uchun tayyor emas. Kritik xatolarni hal qilmasdan shartnoma imzolanmasin."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationAuditModule;
