import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, ShieldAlert, ShieldCheck, KeyRound, Activity, AlertTriangle,
  RefreshCw, Clock, Ban, Eye, TrendingUp, Globe, Lock, FileDown, FileText, Repeat,
  Settings, Calendar, Archive, Save,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const RULES_KEY = "med1.security.jwtRules";
const HISTORY_KEY = "med1.security.dailyHistory";

interface JwtRules {
  reuseThreshold: number;       // distinct IPs that triggers reuse flag
  requireMultiIp: boolean;       // if false, single-IP heavy use also flags
  dailyCallLimit: number;        // per-key 24h call ceiling
  suspiciousIpFailures: number;  // min failed requests from an IP
  suspiciousFailRate: number;    // 0..1 ratio
}

const DEFAULT_RULES: JwtRules = {
  reuseThreshold: 2,
  requireMultiIp: true,
  dailyCallLimit: 5000,
  suspiciousIpFailures: 5,
  suspiciousFailRate: 0.4,
};

interface DailySnapshot {
  date: string; // YYYY-MM-DD
  savedAt: string;
  score: number;
  totalCalls: number;
  failedCalls: number;
  unauthorized: number;
  reusedKeys: number;
  expired: number;
  overLimitKeys: number;
  rules: JwtRules;
  rows: Array<{
    name: string; prefix: string; partner: string; status: string;
    expires: string; calls: number; failed: number; distinctIps: number;
    reused: boolean; overLimit: boolean;
  }>;
}

interface ApiKeyRow {
  id: string;
  partner_id: string;
  name: string;
  key_prefix: string;
  environment: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  revoked_at: string | null;
  rate_limit_per_day: number;
  created_at: string;
  api_partners?: { name: string } | null;
}

interface LogRow {
  id: string;
  api_key_id: string | null;
  partner_id: string | null;
  endpoint: string;
  status_code: number;
  ip_address: string | null;
  error_message: string | null;
  created_at: string;
}

interface Alert {
  id: string;
  level: "critical" | "high" | "medium" | "low";
  title: string;
  detail: string;
  time: string;
}

const COLORS = {
  ok: "#27AE60",
  warn: "#F2994A",
  bad: "#EB5757",
  info: "#2F80ED",
  purple: "#7B61FF",
};

const SecurityCenterModule = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [rules, setRules] = useState<JwtRules>(() => {
    try {
      const raw = localStorage.getItem(RULES_KEY);
      return raw ? { ...DEFAULT_RULES, ...JSON.parse(raw) } : DEFAULT_RULES;
    } catch { return DEFAULT_RULES; }
  });
  const [history, setHistory] = useState<DailySnapshot[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const saveRules = (next: JwtRules) => {
    setRules(next);
    localStorage.setItem(RULES_KEY, JSON.stringify(next));
    toast({ title: "Qoidalar saqlandi" });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [keysRes, logsRes, auditRes] = await Promise.all([
        supabase
          .from("api_keys")
          .select("*, api_partners(name)")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("api_request_logs")
          .select("id, api_key_id, partner_id, endpoint, status_code, ip_address, error_message, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(2000),
        supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
      ]);
      if (keysRes.error) throw keysRes.error;
      if (logsRes.error) throw logsRes.error;
      setKeys((keysRes.data as any) || []);
      setLogs((logsRes.data as any) || []);
      setAuditCount(auditRes.count || 0);
      setLastRefresh(new Date());
    } catch (e: any) {
      toast({ title: "Yuklash xatosi", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  // ---- Derived metrics ----
  const now = Date.now();
  const stats = useMemo(() => {
    const active = keys.filter((k) => k.is_active && !k.revoked_at);
    const revoked = keys.filter((k) => k.revoked_at);
    const expired = keys.filter(
      (k) => k.expires_at && new Date(k.expires_at).getTime() < now,
    );
    const expiringSoon = keys.filter(
      (k) =>
        k.expires_at &&
        new Date(k.expires_at).getTime() > now &&
        new Date(k.expires_at).getTime() - now < 7 * 86400000,
    );
    const stale = active.filter(
      (k) =>
        !k.last_used_at ||
        now - new Date(k.last_used_at).getTime() > 30 * 86400000,
    );

    const totalCalls = logs.length;
    const failedCalls = logs.filter((l) => l.status_code >= 400).length;
    const unauthorized = logs.filter((l) => l.status_code === 401 || l.status_code === 403).length;
    const errors5xx = logs.filter((l) => l.status_code >= 500).length;
    const errorRate = totalCalls ? (failedCalls / totalCalls) * 100 : 0;

    // IP frequency
    const ipMap = new Map<string, { total: number; failed: number }>();
    logs.forEach((l) => {
      const ip = l.ip_address || "unknown";
      const cur = ipMap.get(ip) || { total: 0, failed: 0 };
      cur.total++;
      if (l.status_code >= 400) cur.failed++;
      ipMap.set(ip, cur);
    });
    const suspiciousIps = Array.from(ipMap.entries())
      .filter(([, v]) => v.failed >= rules.suspiciousIpFailures && v.failed / v.total > rules.suspiciousFailRate)
      .sort((a, b) => b[1].failed - a[1].failed)
      .slice(0, 10);

    // Key usage map (+ distinct IPs for reuse detection)
    const keyCalls = new Map<string, { total: number; failed: number; ips: Set<string> }>();
    logs.forEach((l) => {
      if (!l.api_key_id) return;
      const cur = keyCalls.get(l.api_key_id) || { total: 0, failed: 0, ips: new Set<string>() };
      cur.total++;
      if (l.status_code >= 400) cur.failed++;
      if (l.ip_address) cur.ips.add(l.ip_address);
      keyCalls.set(l.api_key_id, cur);
    });
    const reusedKeys = keys.filter((k) => {
      const c = keyCalls.get(k.id);
      if (!c) return false;
      if (rules.requireMultiIp) return c.ips.size >= rules.reuseThreshold;
      return c.ips.size >= rules.reuseThreshold || c.total >= rules.dailyCallLimit;
    });
    const overLimitKeys = keys.filter((k) => (keyCalls.get(k.id)?.total || 0) > rules.dailyCallLimit);

    // Hourly series (24h)
    const hourBuckets = Array.from({ length: 24 }, (_, i) => {
      const ts = new Date(now - (23 - i) * 3600000);
      return {
        hour: ts.getHours().toString().padStart(2, "0") + ":00",
        ok: 0,
        fail: 0,
      };
    });
    logs.forEach((l) => {
      const age = now - new Date(l.created_at).getTime();
      const idx = 23 - Math.floor(age / 3600000);
      if (idx >= 0 && idx < 24) {
        if (l.status_code >= 400) hourBuckets[idx].fail++;
        else hourBuckets[idx].ok++;
      }
    });

    // Security score (0-100)
    let score = 100;
    if (expired.length) score -= Math.min(20, expired.length * 4);
    if (stale.length) score -= Math.min(10, stale.length * 2);
    if (errorRate > 20) score -= 15;
    else if (errorRate > 10) score -= 8;
    if (suspiciousIps.length) score -= Math.min(20, suspiciousIps.length * 4);
    if (expiringSoon.length) score -= Math.min(8, expiringSoon.length * 2);
    if (reusedKeys.length) score -= Math.min(15, reusedKeys.length * 3);
    score = Math.max(0, Math.round(score));

    // Alerts
    const alerts: Alert[] = [];
    expired.forEach((k) =>
      alerts.push({
        id: "exp-" + k.id,
        level: "high",
        title: `Token muddati o'tgan: ${k.name}`,
        detail: `${k.api_partners?.name || k.partner_id} — ${k.key_prefix}***`,
        time: k.expires_at!,
      }),
    );
    expiringSoon.forEach((k) =>
      alerts.push({
        id: "soon-" + k.id,
        level: "medium",
        title: `Token tez orada tugaydi: ${k.name}`,
        detail: `${k.key_prefix}*** — ${new Date(k.expires_at!).toLocaleDateString("uz-UZ")}`,
        time: k.expires_at!,
      }),
    );
    suspiciousIps.slice(0, 5).forEach(([ip, v]) =>
      alerts.push({
        id: "ip-" + ip,
        level: "critical",
        title: `Shubhali IP: ${ip}`,
        detail: `${v.failed}/${v.total} muvaffaqiyatsiz urinish (24s)`,
        time: new Date().toISOString(),
      }),
    );
    if (errorRate > 20)
      alerts.push({
        id: "err-rate",
        level: "high",
        title: `Yuqori xato darajasi: ${errorRate.toFixed(1)}%`,
        detail: `${failedCalls}/${totalCalls} so'rov muvaffaqiyatsiz`,
        time: new Date().toISOString(),
      });
    reusedKeys.forEach((k) => {
      const ips = keyCalls.get(k.id)?.ips;
      alerts.push({
        id: "reuse-" + k.id,
        level: "high",
        title: `Token qayta ishlatilmoqda: ${k.name}`,
        detail: `${ips?.size || 0} ta turli IP-dan (24s) — ${k.key_prefix}***`,
        time: new Date().toISOString(),
      });
    });
    overLimitKeys.forEach((k) => {
      const c = keyCalls.get(k.id);
      alerts.push({
        id: "limit-" + k.id,
        level: "medium",
        title: `Kunlik limit oshib ketdi: ${k.name}`,
        detail: `${c?.total || 0} so'rov / limit ${rules.dailyCallLimit} — ${k.key_prefix}***`,
        time: new Date().toISOString(),
      });
    });
    if (overLimitKeys.length) score -= Math.min(10, overLimitKeys.length * 3);
    score = Math.max(0, score);

    return {
      active, revoked, expired, expiringSoon, stale,
      totalCalls, failedCalls, unauthorized, errors5xx, errorRate,
      suspiciousIps, keyCalls, hourBuckets, score, alerts, reusedKeys, overLimitKeys,
    };
  }, [keys, logs, now, rules]);

  const scoreColor =
    stats.score >= 80 ? COLORS.ok : stats.score >= 60 ? COLORS.warn : COLORS.bad;
  const scoreLabel =
    stats.score >= 80 ? "Yaxshi" : stats.score >= 60 ? "O'rtacha" : "Xavfli";

  const revokeKey = async (id: string) => {
    if (!confirm("Ushbu API kalitni bekor qilasizmi?")) return;
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Xato", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Token bekor qilindi" });
      load();
    }
  };

  // ---- Daily Report Export ----
  const buildJwtReport = () => {
    const rows = keys.map((k) => {
      const usage = stats.keyCalls.get(k.id) || { total: 0, failed: 0, ips: new Set<string>() };
      const isExpired = k.expires_at && new Date(k.expires_at).getTime() < now;
      const isSoon = k.expires_at && !isExpired && new Date(k.expires_at).getTime() - now < 7 * 86400000;
      const status = k.revoked_at ? "Bekor qilingan"
        : isExpired ? "Muddati o'tgan"
        : isSoon ? "Tez orada tugaydi"
        : k.is_active ? "Faol" : "O'chirilgan";
      const reused = rules.requireMultiIp
        ? usage.ips.size >= rules.reuseThreshold
        : usage.ips.size >= rules.reuseThreshold || usage.total >= rules.dailyCallLimit;
      return {
        name: k.name,
        prefix: k.key_prefix,
        partner: k.api_partners?.name || "—",
        env: k.environment,
        status,
        expires: k.expires_at ? new Date(k.expires_at).toLocaleString("uz-UZ") : "—",
        lastUsed: k.last_used_at ? new Date(k.last_used_at).toLocaleString("uz-UZ") : "—",
        calls: usage.total,
        failed: usage.failed,
        distinctIps: usage.ips.size,
        reused,
        overLimit: usage.total > rules.dailyCallLimit,
      };
    });
    return rows;
  };

  // ---- Snapshot save & filter ----
  const saveDailySnapshot = useCallback((silent = false) => {
    const rows = keys.map((k) => {
      const usage = stats.keyCalls.get(k.id) || { total: 0, failed: 0, ips: new Set<string>() };
      const isExpired = k.expires_at && new Date(k.expires_at).getTime() < now;
      const status = k.revoked_at ? "Bekor qilingan"
        : isExpired ? "Muddati o'tgan"
        : k.is_active ? "Faol" : "O'chirilgan";
      const reused = rules.requireMultiIp
        ? usage.ips.size >= rules.reuseThreshold
        : usage.ips.size >= rules.reuseThreshold || usage.total >= rules.dailyCallLimit;
      return {
        name: k.name, prefix: k.key_prefix,
        partner: k.api_partners?.name || "—", status,
        expires: k.expires_at ? new Date(k.expires_at).toLocaleDateString("uz-UZ") : "—",
        calls: usage.total, failed: usage.failed,
        distinctIps: usage.ips.size, reused,
        overLimit: usage.total > rules.dailyCallLimit,
      };
    });
    const today = new Date().toISOString().slice(0, 10);
    const snap: DailySnapshot = {
      date: today,
      savedAt: new Date().toISOString(),
      score: stats.score,
      totalCalls: stats.totalCalls,
      failedCalls: stats.failedCalls,
      unauthorized: stats.unauthorized,
      reusedKeys: stats.reusedKeys.length,
      expired: stats.expired.length,
      overLimitKeys: stats.overLimitKeys.length,
      rules,
      rows,
    };
    const next = [snap, ...history.filter((h) => h.date !== today)].slice(0, 90);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    if (!silent) toast({ title: `Hisobot saqlandi: ${today}` });
  }, [keys, stats, rules, history, now, toast]);

  // Auto-save snapshot once per day after first successful load
  useEffect(() => {
    if (loading || keys.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    if (!history.find((h) => h.date === today)) saveDailySnapshot(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, keys.length]);

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      if (filterFrom && h.date < filterFrom) return false;
      if (filterTo && h.date > filterTo) return false;
      return true;
    });
  }, [history, filterFrom, filterTo]);


  const exportMarkdown = () => {
    const rows = buildJwtReport();
    const d = new Date().toLocaleString("uz-UZ");
    let md = `# Security Center — Kunlik Hisobot\n\n**Sana:** ${d}\n\n`;
    md += `## Xavfsizlik Reytingi: ${stats.score}/100 (${scoreLabel})\n\n`;
    md += `| Ko'rsatkich | Qiymat |\n|---|---|\n`;
    md += `| Faol kalitlar | ${stats.active.length} |\n`;
    md += `| Muddati o'tgan | ${stats.expired.length} |\n`;
    md += `| Bekor qilingan | ${stats.revoked.length} |\n`;
    md += `| Tez orada tugaydi | ${stats.expiringSoon.length} |\n`;
    md += `| Qayta ishlatilayotgan | ${stats.reusedKeys.length} |\n`;
    md += `| 24s so'rovlar | ${stats.totalCalls} |\n`;
    md += `| Muvaffaqiyatsiz | ${stats.failedCalls} |\n`;
    md += `| 401/403 urinishlar | ${stats.unauthorized} |\n`;
    md += `| Xato darajasi | ${stats.errorRate.toFixed(1)}% |\n\n`;
    md += `## JWT / API Kalit Monitoringi\n\n`;
    md += `| Kalit | Hamkor | Muhit | Holat | Muddati | 24s | Xato | IP-lar | Qayta |\n|---|---|---|---|---|---|---|---|---|\n`;
    rows.forEach((r) => {
      md += `| ${r.name} (${r.prefix}***) | ${r.partner} | ${r.env} | ${r.status} | ${r.expires} | ${r.calls} | ${r.failed} | ${r.distinctIps} | ${r.reused ? "⚠️ HA" : "—"} |\n`;
    });
    if (stats.alerts.length) {
      md += `\n## Faol Alertlar (${stats.alerts.length})\n\n`;
      stats.alerts.forEach((a) => {
        md += `- **[${a.level.toUpperCase()}]** ${a.title} — ${a.detail}\n`;
      });
    }
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Markdown hisobot yuklab olindi" });
  };

  const exportPDF = () => {
    const rows = buildJwtReport();
    const d = new Date().toLocaleString("uz-UZ");
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Security Report</title>
<style>
body{font-family:-apple-system,Segoe UI,sans-serif;padding:32px;color:#0A2540;}
h1{border-bottom:3px solid #2F80ED;padding-bottom:8px;}
.score{display:inline-block;padding:12px 24px;border-radius:12px;background:${scoreColor};color:#fff;font-size:32px;font-weight:bold;}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:11px;}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}
th{background:#F4F8FB;}
.kpi{display:inline-block;margin:4px 8px 4px 0;padding:6px 12px;background:#F4F8FB;border-radius:6px;}
.alert{padding:8px;margin:4px 0;border-left:4px solid #EB5757;background:#FFF5F5;}
@media print{button{display:none}}
</style></head><body>
<h1>🛡️ Security Center — Kunlik Hisobot</h1>
<p><b>Sana:</b> ${d}</p>
<div class="score">${stats.score} / 100 — ${scoreLabel}</div>
<h2>Asosiy Ko'rsatkichlar</h2>
<div>
<span class="kpi">Faol: <b>${stats.active.length}</b></span>
<span class="kpi">Muddati o'tgan: <b>${stats.expired.length}</b></span>
<span class="kpi">Bekor qilingan: <b>${stats.revoked.length}</b></span>
<span class="kpi">Tez tugaydi: <b>${stats.expiringSoon.length}</b></span>
<span class="kpi">Qayta ishlatilayotgan: <b>${stats.reusedKeys.length}</b></span>
<span class="kpi">24s so'rovlar: <b>${stats.totalCalls}</b></span>
<span class="kpi">Muvaffaqiyatsiz: <b>${stats.failedCalls}</b></span>
<span class="kpi">401/403: <b>${stats.unauthorized}</b></span>
<span class="kpi">Xato: <b>${stats.errorRate.toFixed(1)}%</b></span>
</div>
<h2>JWT / API Kalit Monitoringi</h2>
<table><thead><tr><th>Kalit</th><th>Hamkor</th><th>Muhit</th><th>Holat</th><th>Muddati</th><th>Oxirgi</th><th>24s</th><th>Xato</th><th>IP-lar</th><th>Qayta</th></tr></thead><tbody>
${rows.map((r) => `<tr><td><b>${r.name}</b><br><code>${r.prefix}***</code></td><td>${r.partner}</td><td>${r.env}</td><td>${r.status}</td><td>${r.expires}</td><td>${r.lastUsed}</td><td>${r.calls}</td><td>${r.failed}</td><td>${r.distinctIps}</td><td>${r.reused ? "⚠️ HA" : "—"}</td></tr>`).join("")}
</tbody></table>
${stats.alerts.length ? `<h2>Faol Alertlar</h2>${stats.alerts.map((a) => `<div class="alert"><b>[${a.level.toUpperCase()}]</b> ${a.title}<br><small>${a.detail}</small></div>`).join("")}` : ""}
<button onclick="window.print()" style="margin-top:24px;padding:10px 20px;background:#2F80ED;color:#fff;border:none;border-radius:6px;cursor:pointer;">🖨️ Chop etish / PDF saqlash</button>
</body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
    toast({ title: "PDF hisobot tayyor" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#2F80ED]" />
            Security Center
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            JWT, API kalit va so'rov xavfsizligi monitoringi · Oxirgi yangilanish:{" "}
            {lastRefresh.toLocaleTimeString("uz-UZ")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={exportPDF} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={exportMarkdown} variant="outline" size="sm">
            <FileDown className="w-4 h-4 mr-2" /> Markdown
          </Button>
          <Button onClick={() => saveDailySnapshot(false)} variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" /> Snapshot
          </Button>
          <Button onClick={load} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Yangilash
          </Button>
        </div>
      </div>

      {/* Security Score + KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 border-2" style={{ borderColor: scoreColor + "40" }}>
          <CardContent className="p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Xavfsizlik Reytingi
            </p>
            <div className="my-3 relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                <circle
                  cx="56" cy="56" r="48" stroke={scoreColor} strokeWidth="8" fill="none"
                  strokeDasharray={`${(stats.score / 100) * 301.6} 301.6`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>
                  {stats.score}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">/ 100</span>
              </div>
            </div>
            <Badge style={{ background: scoreColor, color: "#fff" }}>{scoreLabel}</Badge>
          </CardContent>
        </Card>

        <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={KeyRound} label="Faol kalitlar" value={stats.active.length} color={COLORS.info} />
          <Kpi icon={Clock} label="Muddati o'tgan" value={stats.expired.length} color={COLORS.bad} />
          <Kpi icon={Ban} label="Bekor qilingan" value={stats.revoked.length} color="#94a3b8" />
          <Kpi icon={AlertTriangle} label="Tez orada tugaydi" value={stats.expiringSoon.length} color={COLORS.warn} />
          <Kpi icon={Activity} label="24s so'rovlar" value={stats.totalCalls} color={COLORS.purple} />
          <Kpi icon={ShieldAlert} label="Muvaffaqiyatsiz" value={stats.failedCalls} color={COLORS.bad} />
          <Kpi icon={Lock} label="401/403" value={stats.unauthorized} color={COLORS.warn} />
          <Kpi icon={Repeat} label="Qayta ishlatilayotgan" value={stats.reusedKeys.length} color={COLORS.purple} />
          <Kpi icon={Eye} label="Audit yozuvlar" value={auditCount} color={COLORS.ok} />
        </div>
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <Card className="border-l-4 border-l-[#EB5757]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#EB5757]" />
              Real-time Alertlar ({stats.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-auto">
            {stats.alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition"
              >
                <div className="flex items-start gap-3">
                  <Badge
                    className={cn(
                      "uppercase text-[10px]",
                      a.level === "critical" && "bg-red-600",
                      a.level === "high" && "bg-orange-600",
                      a.level === "medium" && "bg-yellow-600",
                      a.level === "low" && "bg-blue-600",
                    )}
                  >
                    {a.level}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(a.time).toLocaleString("uz-UZ")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> 24 soatlik so'rov oqimi
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourBuckets}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="ok" stackId="1" stroke={COLORS.ok} fill={COLORS.ok} fillOpacity={0.4} name="Muvaffaqiyatli" />
                <Area type="monotone" dataKey="fail" stackId="1" stroke={COLORS.bad} fill={COLORS.bad} fillOpacity={0.5} name="Muvaffaqiyatsiz" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" /> Shubhali IP-lar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-auto">
            {stats.suspiciousIps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-[#27AE60]" />
                Shubhali faollik yo'q
              </p>
            ) : (
              stats.suspiciousIps.map(([ip, v]) => (
                <div key={ip} className="flex items-center justify-between p-2 rounded bg-muted/40">
                  <code className="text-xs">{ip}</code>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[10px]">{v.failed} fail</Badge>
                    <span className="text-xs text-muted-foreground">/{v.total}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Keys monitoring table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> API Kalitlar Monitoringi
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="p-2">Kalit</th>
                <th className="p-2">Hamkor</th>
                <th className="p-2">Muhit</th>
                <th className="p-2">Holat</th>
                <th className="p-2">Muddati</th>
                <th className="p-2 text-right">24s so'rov</th>
                <th className="p-2 text-right">Xato</th>
                <th className="p-2 text-right">IP-lar</th>
                <th className="p-2">Qayta</th>
                <th className="p-2">Oxirgi</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => {
                const usage = stats.keyCalls.get(k.id) || { total: 0, failed: 0, ips: new Set<string>() };
                const isExpired = k.expires_at && new Date(k.expires_at).getTime() < now;
                const isSoon = k.expires_at && !isExpired && new Date(k.expires_at).getTime() - now < 7 * 86400000;
                const reused = rules.requireMultiIp
                  ? usage.ips.size >= rules.reuseThreshold
                  : usage.ips.size >= rules.reuseThreshold || usage.total >= rules.dailyCallLimit;
                const overLimit = usage.total > rules.dailyCallLimit;
                const status = k.revoked_at
                  ? { label: "Bekor", color: "bg-gray-500" }
                  : isExpired
                  ? { label: "Muddati o'tgan", color: "bg-red-600" }
                  : isSoon
                  ? { label: "Tugaydi", color: "bg-orange-500" }
                  : k.is_active
                  ? { label: "Faol", color: "bg-green-600" }
                  : { label: "O'chirilgan", color: "bg-gray-400" };
                return (
                  <tr key={k.id} className={cn("border-b hover:bg-muted/30", reused && "bg-purple-50/40")}>
                    <td className="p-2 font-mono text-xs">
                      <div className="font-semibold">{k.name}</div>
                      <div className="text-muted-foreground">{k.key_prefix}***</div>
                    </td>
                    <td className="p-2">{k.api_partners?.name || "—"}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px]">{k.environment}</Badge></td>
                    <td className="p-2"><Badge className={cn("text-[10px] text-white", status.color)}>{status.label}</Badge></td>
                    <td className="p-2 text-xs">
                      {k.expires_at ? new Date(k.expires_at).toLocaleDateString("uz-UZ") : "—"}
                    </td>
                    <td className="p-2 text-right font-mono">{usage.total}</td>
                    <td className="p-2 text-right">
                      {usage.failed > 0 ? (
                        <span className="text-red-600 font-mono">{usage.failed}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-2 text-right font-mono text-xs">{usage.ips.size}</td>
                    <td className="p-2">
                      {reused ? (
                        <Badge className="bg-purple-600 text-white text-[10px]">
                          <Repeat className="w-3 h-3 mr-1" /> HA
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleString("uz-UZ") : "—"}
                    </td>
                    <td className="p-2">
                      {k.is_active && !k.revoked_at && (
                        <Button size="sm" variant="ghost" onClick={() => revokeKey(k.id)}>
                          <Ban className="w-3 h-3 mr-1" /> Bekor qilish
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {keys.length === 0 && (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">API kalitlari topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* JWT Detection Rules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" /> JWT qayta ishlatish — Aniqlash qoidalari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RulesEditor rules={rules} onSave={saveRules} onReset={() => saveRules(DEFAULT_RULES)} />
        </CardContent>
      </Card>

      {/* Daily Reports Archive */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="w-4 h-4" /> Kunlik JWT monitoring arxivi ({history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div>
              <Label className="text-xs">Dan</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Gacha</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-9" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFilterFrom(""); setFilterTo(""); }}>
              Tozalash
            </Button>
            <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {filteredHistory.length} ta yozuv
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="p-2">Sana</th>
                  <th className="p-2 text-right">Reyting</th>
                  <th className="p-2 text-right">So'rovlar</th>
                  <th className="p-2 text-right">Xato</th>
                  <th className="p-2 text-right">401/403</th>
                  <th className="p-2 text-right">Qayta</th>
                  <th className="p-2 text-right">Limit oshgan</th>
                  <th className="p-2 text-right">Muddati o'tgan</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 && (
                  <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Tanlangan oraliqda yozuv yo'q</td></tr>
                )}
                {filteredHistory.map((h) => (
                  <tr key={h.date} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-mono text-xs">{h.date}</td>
                    <td className="p-2 text-right font-bold" style={{
                      color: h.score >= 80 ? COLORS.ok : h.score >= 60 ? COLORS.warn : COLORS.bad,
                    }}>{h.score}</td>
                    <td className="p-2 text-right font-mono">{h.totalCalls}</td>
                    <td className="p-2 text-right font-mono text-red-600">{h.failedCalls}</td>
                    <td className="p-2 text-right font-mono">{h.unauthorized}</td>
                    <td className="p-2 text-right">
                      {h.reusedKeys > 0
                        ? <Badge className="bg-purple-600 text-white text-[10px]">{h.reusedKeys}</Badge>
                        : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="p-2 text-right">
                      {h.overLimitKeys > 0
                        ? <Badge className="bg-orange-500 text-white text-[10px]">{h.overLimitKeys}</Badge>
                        : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="p-2 text-right font-mono">{h.expired}</td>
                    <td className="p-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        const blob = new Blob([JSON.stringify(h, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `jwt-snapshot-${h.date}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}>
                        <FileDown className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RulesEditor = ({
  rules, onSave, onReset,
}: { rules: JwtRules; onSave: (r: JwtRules) => void; onReset: () => void }) => {
  const [draft, setDraft] = useState<JwtRules>(rules);
  useEffect(() => setDraft(rules), [rules]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <Label className="text-xs">Qayta ishlatish chegarasi (IP soni)</Label>
        <Input type="number" min={2} value={draft.reuseThreshold}
          onChange={(e) => setDraft({ ...draft, reuseThreshold: Math.max(2, +e.target.value || 2) })} />
        <p className="text-[11px] text-muted-foreground mt-1">≥ shu sondagi turli IP-dan kelsa — Repeat flag</p>
      </div>
      <div>
        <Label className="text-xs">Kunlik so'rov limiti (per kalit)</Label>
        <Input type="number" min={1} value={draft.dailyCallLimit}
          onChange={(e) => setDraft({ ...draft, dailyCallLimit: Math.max(1, +e.target.value || 1) })} />
        <p className="text-[11px] text-muted-foreground mt-1">Limitdan oshsa — alert + score jarima</p>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <Label className="text-xs">Faqat ko'p IP talab qilinsin</Label>
          <p className="text-[11px] text-muted-foreground">O'chirilsa — limit oshishi ham flag bo'ladi</p>
        </div>
        <Switch checked={draft.requireMultiIp}
          onCheckedChange={(v) => setDraft({ ...draft, requireMultiIp: v })} />
      </div>
      <div>
        <Label className="text-xs">Shubhali IP — min muvaffaqiyatsiz</Label>
        <Input type="number" min={1} value={draft.suspiciousIpFailures}
          onChange={(e) => setDraft({ ...draft, suspiciousIpFailures: Math.max(1, +e.target.value || 1) })} />
      </div>
      <div>
        <Label className="text-xs">Shubhali IP — xato darajasi (0–1)</Label>
        <Input type="number" step="0.05" min={0} max={1} value={draft.suspiciousFailRate}
          onChange={(e) => setDraft({ ...draft, suspiciousFailRate: Math.min(1, Math.max(0, +e.target.value || 0)) })} />
      </div>
      <div className="flex items-end gap-2">
        <Button onClick={() => onSave(draft)} className="flex-1">
          <Save className="w-4 h-4 mr-2" /> Saqlash
        </Button>
        <Button variant="outline" onClick={onReset}>Reset</Button>
      </div>
    </div>
  );
};

const Kpi = ({ icon: Icon, label, value, color }: any) => (
  <Card>
    <CardContent className="p-3">
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </CardContent>
  </Card>
);

export default SecurityCenterModule;
