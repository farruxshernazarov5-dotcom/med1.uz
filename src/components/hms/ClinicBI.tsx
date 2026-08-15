import { useMemo, useState } from "react";
import { PeriodKey, PERIOD_LABELS, getRange } from "@/lib/clinicBI";
import { computeBIMetrics } from "@/lib/clinicBIMetrics";
import { useClinicBI, logReportAudit } from "@/hooks/useClinicBI";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, Wallet, Stethoscope, Users, Activity,
  TrendingUp, Bot, Target, LayoutGrid, RefreshCw, FileBarChart, Radio,
} from "lucide-react";
import BIExecutive from "./bi/BIExecutive";
import BIFinance from "./bi/BIFinance";
import BIDoctors from "./bi/BIDoctors";
import BIPatients from "./bi/BIPatients";
import BIOperations from "./bi/BIOperations";
import BIGrowth from "./bi/BIGrowth";
import BITargets from "./bi/BITargets";
import BIAnalyst from "./bi/BIAnalyst";
import BIBuilder from "./bi/BIBuilder";
import HMSReports from "./HMSReports";

const TABS = [
  { key: "executive", label: "Executive", icon: LayoutDashboard },
  { key: "finance", label: "Moliya", icon: Wallet },
  { key: "doctors", label: "Shifokorlar", icon: Stethoscope },
  { key: "patients", label: "Bemorlar", icon: Users },
  { key: "operations", label: "Operatsion", icon: Activity },
  { key: "growth", label: "O'sish", icon: TrendingUp },
  { key: "targets", label: "Maqsadlar", icon: Target },
  { key: "analyst", label: "AI Analitik", icon: Bot },
  { key: "builder", label: "Hisobot yig'ish", icon: LayoutGrid },
  { key: "classic", label: "Klassik hisobot", icon: FileBarChart },
] as const;

type TabKey = typeof TABS[number]["key"];

const PERIODS: PeriodKey[] = ["today", "yesterday", "week", "month", "quarter", "year"];

interface Props {
  clinicId: string;
  clinicName?: string;
}

const ClinicBI = ({ clinicId, clinicName = "Klinika" }: Props) => {
  const [tab, setTab] = useState<TabKey>("executive");
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({});
  const { data, loading, lastSync, refresh } = useClinicBI(clinicId);

  const range = useMemo(() => getRange(period, custom), [period, custom.from, custom.to]);
  const metrics = useMemo(() => (data ? computeBIMetrics(data, range) : null), [data, range]);

  const changeTab = (k: TabKey) => {
    setTab(k);
    logReportAudit(clinicId, k, "view", { period });
  };

  if (loading && !data) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin w-9 h-9 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Business Intelligence yuklanmoqda…</p>
      </div>
    );
  }

  if (!metrics) return <p className="text-sm text-muted-foreground py-12 text-center">Ma'lumot topilmadi</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" /> Hisobotlar & Business Intelligence
          </h2>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            Real-time · oxirgi yangilanish {lastSync ? lastSync.toLocaleTimeString("uz-UZ") : "—"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} className="gap-1 h-8 text-xs">
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} /> Yangilash
        </Button>
      </div>

      {/* Period filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PERIODS.map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn("text-[11px] px-2.5 py-1.5 rounded-full border transition-colors",
              period === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-1">
          <Input type="date" value={custom.from || ""} className="h-7 w-[130px] text-[11px]"
            onChange={(e) => { setCustom({ ...custom, from: e.target.value }); setPeriod("custom"); }} />
          <span className="text-[11px] text-muted-foreground">—</span>
          <Input type="date" value={custom.to || ""} className="h-7 w-[130px] text-[11px]"
            onChange={(e) => { setCustom({ ...custom, to: e.target.value }); setPeriod("custom"); }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => changeTab(t.key)}
            className={cn("shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition-all",
              tab === t.key ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-muted")}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "executive" && <BIExecutive m={metrics} clinicName={clinicName} onDrill={(k) => changeTab(k as TabKey)} />}
      {tab === "finance" && <BIFinance m={metrics} clinicName={clinicName} />}
      {tab === "doctors" && <BIDoctors m={metrics} clinicName={clinicName} />}
      {tab === "patients" && <BIPatients m={metrics} clinicName={clinicName} />}
      {tab === "operations" && <BIOperations m={metrics} clinicName={clinicName} />}
      {tab === "growth" && <BIGrowth m={metrics} referrals={data!.referrals} />}
      {tab === "targets" && <BITargets m={metrics} clinicId={clinicId} targets={data!.targets} onSaved={refresh} />}
      {tab === "analyst" && <BIAnalyst m={metrics} clinicId={clinicId} />}
      {tab === "builder" && <BIBuilder m={metrics} clinicId={clinicId} clinicName={clinicName} />}
      {tab === "classic" && <HMSReports />}
    </div>
  );
};

export default ClinicBI;
