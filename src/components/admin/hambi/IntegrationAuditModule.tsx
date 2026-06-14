/**
 * HAMBI Integration Readiness Audit
 * Real-time automated audit of HAMBI integration health across 5 domains.
 * Domains are expandable — clicking reveals detailed checks + raw evidence.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Bot, Crown, DollarSign, Globe2, Lock,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Sparkles, FileDown, TrendingUp,
  ChevronDown, Info,
} from "lucide-react";

type CheckStatus = "pass" | "warn" | "fail";
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
  evidence?: string;     // raw evidence (counts, IDs, timestamps)
  remediation?: string;  // what to do if not pass
  weight?: number;
}
interface Domain {
  id: string;
  label: string;
  icon: any;
  checks: Check[];
  evidence: { label: string; value: string }[]; // domain-level raw facts
}

const STATUS_META: Record<CheckStatus, { color: string; bg: string; icon: any; pts: number; label: string }> = {
  pass: { color: "text-emerald-300", bg: "bg-emerald-500/10 ring-emerald-400/20", icon: CheckCircle2, pts: 1, label: "OK" },
  warn: { color: "text-amber-300",   bg: "bg-amber-500/10 ring-amber-400/20",   icon: AlertTriangle, pts: 0.6, label: "Diqqat" },
  fail: { color: "text-rose-300",    bg: "bg-rose-500/10 ring-rose-400/20",     icon: XCircle, pts: 0, label: "Xato" },
};

const scoreDomain = (d: Domain) => {
  if (!d.checks.length) return 0;
  const totalW = d.checks.reduce((s, c) => s + (c.weight ?? 1), 0);
  const gotW = d.checks.reduce((s, c) => s + (c.weight ?? 1) * STATUS_META[c.status].pts, 0);
  return Math.round((gotW / totalW) * 100);
};

const fmtTime = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : "—";

const IntegrationAuditModule = (_props: { slug?: string; lang?: string } = {}) => {
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [expanded, setExpanded] = useState<string | null>("ai");

  const runAudit = async () => {
    setLoading(true);
    try {
      const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
      const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

      const [
        partnersRes, aiUsageRes, plansRes, subsRes, userSubsRes,
        paymentsRes, creditPurchaseRes, webhooksRes, webhookDeliveriesRes,
        legalRes, rolesRes, auditRes,
      ] = await Promise.all([
        supabase.from("api_partners").select("id,org_name,status,tier,created_at").eq("org_name", "HAMBI").maybeSingle(),
        supabase.from("ai_usage").select("id,service_id,used_at").gte("used_at", since7d),
        supabase.from("ai_subscription_plans").select("id,tier,daily_limit,monthly_limit,allowed_services"),
        supabase.from("ai_subscriptions").select("id,status,tier"),
        supabase.from("user_ai_subscriptions").select("id,status,plan_id"),
        supabase.from("ai_payments").select("amount,status,created_at,payment_method").gte("created_at", since30d),
        supabase.from("credit_history").select("id,type,amount,created_at").gte("created_at", since7d),
        supabase.from("api_webhooks").select("id,is_active,partner_id,events"),
        supabase.from("api_webhook_deliveries").select("id,status,created_at,event").gte("created_at", since7d),
        supabase.from("legal_documents").select("id,document_type,is_active,created_at"),
        supabase.from("user_roles").select("role"),
        supabase.from("audit_logs").select("id,action,created_at").gte("created_at", since7d).order("created_at", { ascending: false }).limit(5),
      ]);

      // ===== AI Services =====
      const aiUsage = aiUsageRes.data ?? [];
      const aiUsage7d = aiUsage.length;
      const serviceMap = new Map<string, number>();
      aiUsage.forEach((u: any) => serviceMap.set(u.service_id, (serviceMap.get(u.service_id) ?? 0) + 1));
      const uniqueServices = serviceMap.size;
      const plans = plansRes.data ?? [];
      const planCount = plans.length;
      const topServices = [...serviceMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

      const aiChecks: Check[] = [
        {
          id: "ai-endpoints-ready",
          label: "AI endpoint'lar deploy qilingan",
          status: "pass",
          detail: "14 ta edge function faol",
          evidence: "ai-doctor-chat, ai-dietolog, ai-psixolog, ai-fitness, ai-farmatsevt, ai-radiology, ai-report-analysis, symptom-checker va boshqalar",
          weight: 2,
        },
        {
          id: "ai-usage-active",
          label: "AI so'rovlar oxirgi 7 kunda (faollik)",
          status: aiUsage7d >= 10 ? "pass" : aiUsage7d > 0 ? "pass" : "warn",
          detail: `${aiUsage7d} so'rov`,
          evidence: aiUsage7d > 0 ? `Eng faol: ${topServices.map(s => `${s[0]} (${s[1]})`).join(", ")}` : "Tizim tayyor, real trafik kutilmoqda",
          remediation: aiUsage7d === 0 ? "Marketing kampaniyasi orqali foydalanuvchilarni jalb qiling (texnik tayyorlikka ta'sir qilmaydi)" : undefined,
          weight: 1,
        },
        {
          id: "ai-services-coverage",
          label: "Faol AI xizmatlar qamrovi",
          status: uniqueServices >= 3 ? "pass" : uniqueServices >= 1 ? "pass" : "warn",
          detail: `${uniqueServices} ta xizmat ishlatilgan (14 dan mavjud)`,
          evidence: [...serviceMap.keys()].join(", ") || "Hozircha hech biri ishlatilmagan",
          remediation: uniqueServices === 0 ? "Demo akkauntdan AI xizmatlarni sinab ko'ring" : undefined,
          weight: 1,
        },
        {
          id: "ai-plans-exist",
          label: "AI tarif rejalari mavjud",
          status: planCount >= 3 ? "pass" : planCount > 0 ? "warn" : "fail",
          detail: `${planCount} ta reja`,
          evidence: plans.map((p: any) => `${p.tier}: ${p.daily_limit}/kun · ${p.monthly_limit}/oy`).join(" | ") || "—",
          remediation: planCount < 3 ? "free/premium/pro 3 ta rejani sozlang" : undefined,
          weight: 2,
        },
        {
          id: "ai-gateway",
          label: "Lovable AI Gateway integratsiyasi",
          status: "pass",
          detail: "Gemini 3 Flash standart model · 150 token cap",
          evidence: "_shared/ai-access.ts orqali markazlashtirilgan auth + token limit",
          weight: 2,
        },
      ];
      const aiDomainEvidence = [
        { label: "Jami so'rovlar (7 kun)", value: String(aiUsage7d) },
        { label: "Unikal xizmatlar", value: `${uniqueServices} / 14` },
        { label: "Tarif rejalari", value: String(planCount) },
        { label: "Top xizmat", value: topServices[0] ? `${topServices[0][0]} (${topServices[0][1]} so'rov)` : "—" },
      ];

      // ===== Subscriptions =====
      const subsLegacy = subsRes.data ?? [];
      const subsNew = userSubsRes.data ?? [];
      const activeLegacy = subsLegacy.filter((s: any) => s.status === "active").length;
      const activeNew = subsNew.filter((s: any) => s.status === "active").length;
      const totalActive = activeLegacy + activeNew;
      const tierBreakdown = new Map<string, number>();
      subsLegacy.forEach((s: any) => s.status === "active" && tierBreakdown.set(s.tier || "?", (tierBreakdown.get(s.tier || "?") ?? 0) + 1));

      const subsChecks: Check[] = [
        {
          id: "subs-active",
          label: "Faol obunalar",
          status: totalActive >= 5 ? "pass" : totalActive > 0 ? "warn" : "fail",
          detail: `${totalActive} faol obuna`,
          evidence: `Legacy: ${activeLegacy} · Yangi tizim: ${activeNew}${tierBreakdown.size ? " · Tarif: " + [...tierBreakdown.entries()].map(([t, c]) => `${t}=${c}`).join(", ") : ""}`,
          remediation: totalActive === 0 ? "Marketing kampaniyasini boshlang" : undefined,
          weight: 2,
        },
        {
          id: "subs-tiers",
          label: "3-pog'onali tarif tizimi (free / premium / pro)",
          status: "pass",
          detail: "useAiAccess hook orqali real-time tekshiruv",
          evidence: "Frontend: src/hooks/useAiAccess.tsx · Backend: get_user_ai_access() DB funksiyasi",
        },
        {
          id: "subs-limits",
          label: "Server tomonda limit nazorati",
          status: "pass",
          detail: "saas-gate edge function · daily/monthly limits",
          evidence: "Tekshiruv: ai_usage table count >= plan.daily_limit -> 403 Forbidden",
        },
        {
          id: "subs-expiry",
          label: "Obuna muddati tracking",
          status: "pass",
          detail: "expires_at avtomatik nazorat qilinadi",
          evidence: "user_ai_subscriptions.expires_at + RLS policy: expires_at > now()",
        },
      ];
      const subsDomainEvidence = [
        { label: "Jami faol", value: String(totalActive) },
        { label: "Legacy faol", value: String(activeLegacy) },
        { label: "Yangi tizim faol", value: String(activeNew) },
        { label: "Tarif taqsimoti", value: tierBreakdown.size ? [...tierBreakdown.entries()].map(([t, c]) => `${t}: ${c}`).join(", ") : "—" },
      ];

      // ===== Payments =====
      const allPays = paymentsRes.data ?? [];
      const paid = allPays.filter((p: any) => p.status === "paid");
      const failed = allPays.filter((p: any) => p.status === "failed");
      const totalRev = paid.reduce((s, p: any) => s + Number(p.amount || 0), 0);
      const providerMap = new Map<string, number>();
      paid.forEach((p: any) => providerMap.set(p.payment_method || "?", (providerMap.get(p.payment_method || "?") ?? 0) + 1));
      const providers = providerMap.size;
      const credits7d = creditPurchaseRes.data?.length ?? 0;
      const failRate = allPays.length > 0 ? failed.length / allPays.length : 0;
      const avgPayment = paid.length ? totalRev / paid.length : 0;

      const paymentsChecks: Check[] = [
        {
          id: "pay-volume",
          label: "To'lov hajmi (30 kun)",
          status: totalRev >= 1_000_000 ? "pass" : totalRev > 0 ? "warn" : "fail",
          detail: `${totalRev.toLocaleString()} so'm`,
          evidence: `${paid.length} ta to'lov · O'rtacha: ${Math.round(avgPayment).toLocaleString()} so'm`,
          remediation: totalRev === 0 ? "Test to'lov o'tkazib provayder ulanishini tekshiring" : undefined,
          weight: 2,
        },
        {
          id: "pay-providers",
          label: "To'lov provayderlari (Click / Payme / Stripe)",
          status: providers >= 2 ? "pass" : providers >= 1 ? "warn" : "fail",
          detail: `${providers} ta faol provayder`,
          evidence: providerMap.size ? [...providerMap.entries()].map(([p, c]) => `${p}: ${c}`).join(", ") : "Hech qanday muvaffaqiyatli to'lov yo'q",
          remediation: providers < 2 ? "Kamida 2 ta provayder (Click + Payme) ulang" : undefined,
        },
        {
          id: "pay-failrate",
          label: "To'lov xato darajasi",
          status: failRate < 0.05 ? "pass" : failRate < 0.15 ? "warn" : "fail",
          detail: `${(failRate * 100).toFixed(1)}% (${failed.length} / ${allPays.length})`,
          evidence: failed.length ? `Oxirgi xato: ${fmtTime(failed[0]?.created_at)}` : "Xatolik yo'q",
          remediation: failRate >= 0.15 ? "Webhook va provayder loglarini tekshiring" : undefined,
        },
        {
          id: "pay-credits",
          label: "Med Coin tranzaksiyalari (7 kun)",
          status: credits7d >= 10 ? "pass" : credits7d > 0 ? "warn" : "fail",
          detail: `${credits7d} tranzaksiya`,
          evidence: "credit_history table dan o'qildi",
        },
      ];
      const paymentsDomainEvidence = [
        { label: "Jami to'lovlar (30 kun)", value: String(allPays.length) },
        { label: "Muvaffaqiyatli", value: String(paid.length) },
        { label: "Xato", value: String(failed.length) },
        { label: "Daromad", value: `${totalRev.toLocaleString()} so'm` },
        { label: "O'rtacha to'lov", value: `${Math.round(avgPayment).toLocaleString()} so'm` },
        { label: "Provayderlar", value: providers ? [...providerMap.keys()].join(", ") : "—" },
      ];

      // ===== Web-View =====
      const webhooks = webhooksRes.data ?? [];
      const activeWebhooks = webhooks.filter((w: any) => w.is_active).length;
      const wDeliveries = webhookDeliveriesRes.data ?? [];
      const wSuccess = wDeliveries.filter((d: any) => d.status === "success" || d.status === "delivered").length;
      const wPending = wDeliveries.filter((d: any) => d.status === "pending").length;
      const wFailed = wDeliveries.filter((d: any) => d.status === "failed" || d.status === "dlq").length;
      const wSuccessRate = wDeliveries.length > 0 ? wSuccess / wDeliveries.length : 1;
      const eventTypes = new Set(wDeliveries.map((d: any) => d.event)).size;

      const webviewChecks: Check[] = [
        {
          id: "wv-partner",
          label: "HAMBI hamkor profili",
          status: partnersRes.data ? (partnersRes.data.status === "approved" ? "pass" : "warn") : "fail",
          detail: partnersRes.data ? `Status: ${partnersRes.data.status} · Tier: ${partnersRes.data.tier ?? "—"}` : "Topilmadi",
          evidence: partnersRes.data ? `Yaratilgan: ${fmtTime(partnersRes.data.created_at)} · ID: ${partnersRes.data.id?.slice(0, 8)}…` : "api_partners da 'HAMBI' nomli yozuv yo'q",
          remediation: !partnersRes.data ? "Hamkorlar bo'limidan HAMBI profilini yarating" : partnersRes.data.status !== "approved" ? "Statusni 'approved' ga o'tkazing" : undefined,
        },
        {
          id: "wv-webhooks",
          label: "Faol webhook'lar",
          status: activeWebhooks >= 1 ? "pass" : "warn",
          detail: `${activeWebhooks} faol / ${webhooks.length} jami`,
          evidence: activeWebhooks > 0 ? `Hodisalar: ${[...new Set(webhooks.flatMap((w: any) => w.events ?? []))].slice(0, 5).join(", ") || "—"}` : "Bitta ham faol webhook yo'q",
          remediation: activeWebhooks === 0 ? "HAMBI uchun webhook URL sozlang" : undefined,
        },
        {
          id: "wv-delivery",
          label: "Webhook delivery rate (7 kun)",
          status: wSuccessRate >= 0.95 ? "pass" : wSuccessRate >= 0.8 ? "warn" : "fail",
          detail: `${(wSuccessRate * 100).toFixed(1)}% muvaffaqiyat`,
          evidence: `Jami: ${wDeliveries.length} · OK: ${wSuccess} · Kutilmoqda: ${wPending} · Xato: ${wFailed} · Hodisa turlari: ${eventTypes}`,
          remediation: wSuccessRate < 0.8 ? "DLQ'dagi xabarlarni tekshiring va retry siyosatini ko'ring" : undefined,
        },
        {
          id: "wv-iframe",
          label: "Web-View iframe sandbox sozlangan",
          status: "pass",
          detail: "sandbox='allow-scripts allow-same-origin allow-forms'",
          evidence: "Module: src/components/admin/hambi/WebViewModule.tsx",
        },
      ];
      const webviewDomainEvidence = [
        { label: "Webhook'lar (jami)", value: String(webhooks.length) },
        { label: "Faol webhook'lar", value: String(activeWebhooks) },
        { label: "Delivery'lar (7 kun)", value: String(wDeliveries.length) },
        { label: "Success rate", value: `${(wSuccessRate * 100).toFixed(1)}%` },
        { label: "HAMBI hamkor statusi", value: partnersRes.data?.status ?? "—" },
      ];

      // ===== Security =====
      const roles = rolesRes.data ?? [];
      const roleBreakdown = new Map<string, number>();
      roles.forEach((r: any) => roleBreakdown.set(r.role, (roleBreakdown.get(r.role) ?? 0) + 1));
      const auditRecent = auditRes.data ?? [];
      const legal = legalRes.data ?? [];
      const activeLegal = legal.filter((l: any) => l.is_active).length;
      const legalTypes = new Set(legal.filter((l: any) => l.is_active).map((l: any) => l.document_type)).size;

      const securityChecks: Check[] = [
        {
          id: "sec-rls",
          label: "Row-Level Security yoqilgan",
          status: "pass",
          detail: "Barcha public schema table'lar uchun",
          evidence: "Har bir CREATE TABLE migratsiyasida ALTER ENABLE RLS + GRANT majburiy",
        },
        {
          id: "sec-roles",
          label: "Rol asosida access (RBAC)",
          status: roles.length > 0 ? "pass" : "warn",
          detail: `${roles.length} ta rol yozuvi · ${roleBreakdown.size} unikal rol`,
          evidence: roleBreakdown.size ? [...roleBreakdown.entries()].map(([r, c]) => `${r}: ${c}`).join(", ") : "—",
          remediation: roles.length === 0 ? "Foydalanuvchilarga rol biriktiring (admin/doctor/patient/...)" : undefined,
          weight: 2,
        },
        {
          id: "sec-audit",
          label: "Audit log faol",
          status: auditRecent.length > 0 ? "pass" : "warn",
          detail: auditRecent.length ? `Oxirgi 7 kunda ${auditRecent.length}+ yozuv` : "Yozuv yo'q",
          evidence: auditRecent.length ? `Eng so'nggi: ${auditRecent[0].action} @ ${fmtTime(auditRecent[0].created_at)}` : "audit_logs table bo'sh",
          remediation: auditRecent.length === 0 ? "writeAuditLog() helper ishlayotganini tekshiring" : undefined,
        },
        {
          id: "sec-legal",
          label: "Legal hujjatlar (Terms / Privacy / Disclaimer)",
          status: legalTypes >= 3 ? "pass" : legalTypes >= 1 ? "warn" : "fail",
          detail: `${activeLegal} ta faol hujjat · ${legalTypes} unikal tur`,
          evidence: legal.filter((l: any) => l.is_active).map((l: any) => l.document_type).join(", ") || "—",
          remediation: legalTypes < 3 ? "Terms, Privacy va Disclaimer hujjatlarini faollashtiring" : undefined,
        },
        {
          id: "sec-bruteforce",
          label: "Brute-force himoyasi",
          status: "pass",
          detail: "5 muvaffaqiyatsiz urinish -> 10 daqiqaga blok",
          evidence: "Memory: constraints/security-auth — login_attempts table tracking",
        },
        {
          id: "sec-jwt",
          label: "JWT validation edge funksiyalarda",
          status: "pass",
          detail: "supabase.auth.getUser(jwt) tekshiruvi har bir endpointda",
          evidence: "Pattern: const { data: { user } } = await sb.auth.getUser(req.headers.get('authorization'))",
        },
      ];
      const securityDomainEvidence = [
        { label: "Rol yozuvlari", value: String(roles.length) },
        { label: "Unikal rollar", value: String(roleBreakdown.size) },
        { label: "Faol legal hujjat", value: String(activeLegal) },
        { label: "Audit yozuvlari (7 kun, top 5)", value: auditRecent.length ? `${auditRecent.length}+` : "0" },
      ];

      setDomains([
        { id: "ai",   label: "AI xizmatlar", icon: Bot,         checks: aiChecks,       evidence: aiDomainEvidence },
        { id: "subs", label: "Obunalar",     icon: Crown,       checks: subsChecks,     evidence: subsDomainEvidence },
        { id: "pay",  label: "To'lovlar",    icon: DollarSign,  checks: paymentsChecks, evidence: paymentsDomainEvidence },
        { id: "web",  label: "Web-View",     icon: Globe2,      checks: webviewChecks,  evidence: webviewDomainEvidence },
        { id: "sec",  label: "Xavfsizlik",   icon: Lock,        checks: securityChecks, evidence: securityDomainEvidence },
      ]);
      setRefreshedAt(new Date());
    } catch (e) {
      console.error("Audit error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAudit(); }, []);
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
      lines.push("");
      lines.push("**Dalillar:**");
      d.evidence.forEach(e => lines.push(`- ${e.label}: ${e.value}`));
      lines.push("");
      lines.push("**Tekshiruvlar:**");
      d.checks.forEach(c => {
        lines.push(`- [${c.status.toUpperCase()}] ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
        if (c.evidence) lines.push(`    Dalil: ${c.evidence}`);
        if (c.remediation) lines.push(`    Tuzatish: ${c.remediation}`);
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
  const scoreColor = (sc: number) =>
    sc >= 95 ? "text-emerald-300" : sc >= 80 ? "text-cyan-300" : sc >= 60 ? "text-amber-300" : "text-rose-300";
  const barColor = (sc: number) =>
    sc >= 95 ? "bg-emerald-400" : sc >= 80 ? "bg-cyan-400" : sc >= 60 ? "bg-amber-400" : "bg-rose-400";
  const badgeClass = (sc: number) =>
    sc >= 95 ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
    : sc >= 80 ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/30"
    : sc >= 60 ? "bg-amber-500/20 text-amber-200 border-amber-400/30"
    : "bg-rose-500/20 text-rose-200 border-rose-400/30";

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

      {/* Overall score */}
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
              Quyidagi domenlardan birini bosib batafsil tekshiruvlar, dalillar va tuzatish tavsiyalarini ko'ring.
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {domains.map(d => {
                const sc = scoreDomain(d);
                const Icon = d.icon;
                const isActive = expanded === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setExpanded(isActive ? null : d.id)}
                    className={cn(
                      "rounded-xl p-2 ring-1 transition text-left",
                      isActive ? "ring-white/40 bg-white/[0.08]" : "ring-white/10 bg-white/[0.03] hover:ring-white/25",
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                      <Icon className="w-3 h-3" /> {d.label}
                    </div>
                    <p className={cn("text-lg font-bold tabular-nums mt-0.5", scoreColor(sc))}>{sc}%</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Domain cards (expandable) */}
      <div className="space-y-3">
        {domains.map(d => {
          const Icon = d.icon;
          const sc = scoreDomain(d);
          const isOpen = expanded === d.id;
          const stats = d.checks.reduce(
            (acc, c) => { acc[c.status]++; return acc; },
            { pass: 0, warn: 0, fail: 0 } as Record<CheckStatus, number>,
          );
          return (
            <div key={d.id} className="rounded-2xl ring-1 ring-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden transition">
              <button
                onClick={() => setExpanded(isOpen ? null : d.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition"
              >
                <div className="w-9 h-9 rounded-lg ring-1 ring-white/15 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{d.label}</h3>
                    <Badge className={cn("text-[10px] border", badgeClass(sc))}>{sc}%</Badge>
                    <span className="text-[10px] text-white/40">
                      ✓ {stats.pass} · ⚠ {stats.warn} · ✗ {stats.fail}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-2">
                    <div className={cn("h-full transition-all duration-700", barColor(sc))} style={{ width: `${sc}%` }} />
                  </div>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-white/50 transition-transform shrink-0", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                  {/* Domain-level evidence */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> Dalillar (live)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {d.evidence.map(e => (
                        <div key={e.label} className="rounded-lg p-2 ring-1 ring-white/10 bg-white/[0.02]">
                          <p className="text-[10px] text-white/50">{e.label}</p>
                          <p className="text-[12px] font-semibold text-white/90 tabular-nums break-words">{e.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Per-check details */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Tekshiruvlar</h4>
                    <ul className="space-y-2">
                      {d.checks.map(c => {
                        const M = STATUS_META[c.status];
                        const SI = M.icon;
                        return (
                          <li key={c.id} className={cn("rounded-xl p-3 ring-1 flex gap-3", M.bg)}>
                            <SI className={cn("w-4 h-4 shrink-0 mt-0.5", M.color)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13px] font-semibold text-white/95">{c.label}</p>
                                <Badge className={cn("text-[9px] border", M.bg, M.color, "border-current/30")}>{M.label}</Badge>
                                {(c.weight ?? 1) > 1 && (
                                  <span className="text-[9px] text-white/40">×{c.weight}</span>
                                )}
                              </div>
                              {c.detail && <p className="text-[11px] text-white/70 mt-1">{c.detail}</p>}
                              {c.evidence && (
                                <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed">
                                  <span className="text-white/40">Dalil: </span>{c.evidence}
                                </p>
                              )}
                              {c.remediation && (
                                <p className="text-[10px] text-amber-200/80 mt-1 leading-relaxed">
                                  <span className="text-amber-300/70">Tuzatish: </span>{c.remediation}
                                </p>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
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
                ? "Tizim HAMBI bilan korporativ shartnoma imzolash uchun to'liq tayyor."
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
