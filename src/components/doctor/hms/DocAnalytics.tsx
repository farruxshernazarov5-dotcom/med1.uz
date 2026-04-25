import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  BarChart3, TrendingUp, TrendingDown, Users, Calendar, FlaskConical,
  Pill, Wallet, Activity, Sparkles, Send, Bot, User as UserIcon,
  PieChart as PieIcon, LineChart as LineIcon, Target, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

interface Props { doctorId: string }

const COLORS = ["hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const PERIODS = [
  { key: "7d", label: "7 kun" },
  { key: "30d", label: "30 kun" },
  { key: "90d", label: "3 oy" },
  { key: "365d", label: "1 yil" },
];

const QUICK_PROMPTS = [
  { icon: TrendingUp, text: "Daromadimni qanday oshirishim mumkin?" },
  { icon: Users, text: "Eng faol bemorlar qaysilar?" },
  { icon: Activity, text: "Qaysi xizmatlar eng ko'p sotiladi?" },
  { icon: Target, text: "Marketing bo'yicha tavsiyalar bering" },
  { icon: Zap, text: "Qabul jadvalimni qanday yaxshilash mumkin?" },
  { icon: PieIcon, text: "Demografik tahlil qiling" },
];

export default function DocAnalytics({ doctorId }: Props) {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [chartData, setChartData] = useState<any>({});
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [doctorId, period]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [patients, apps, invs, exps, rxs, labs, telemed] = await Promise.all([
      supabase.from("doctor_patients").select("*").eq("doctor_id", doctorId),
      supabase.from("appointments").select("*").eq("doctor_id", doctorId).gte("created_at", since),
      supabase.from("doctor_invoices").select("*").eq("doctor_id", doctorId).gte("created_at", since),
      supabase.from("doctor_expenses").select("*").eq("doctor_id", doctorId).gte("expense_date", since.slice(0, 10)),
      supabase.from("doctor_prescriptions").select("*").eq("doctor_id", doctorId).gte("created_at", since),
      supabase.from("doctor_lab_orders").select("*").eq("doctor_id", doctorId).gte("created_at", since),
      supabase.from("doctor_telemed_sessions").select("*").eq("doctor_id", doctorId).gte("created_at", since),
    ]);

    const allPatients = patients.data || [];
    const allApps = apps.data || [];
    const allInvs = invs.data || [];
    const allExps = exps.data || [];
    const allRxs = rxs.data || [];
    const allLabs = labs.data || [];
    const allTelemed = telemed.data || [];

    const revenue = allInvs.reduce((s, i: any) => s + Number(i.paid_amount || 0), 0);
    const expense = allExps.reduce((s, e: any) => s + Number(e.amount || 0), 0);
    const profit = revenue - expense;
    const completedApps = allApps.filter((a: any) => a.status === "completed").length;
    const cancelRate = allApps.length > 0 ? (allApps.filter((a: any) => a.status === "cancelled").length / allApps.length * 100) : 0;

    setStats({
      totalPatients: allPatients.length,
      newPatients: allPatients.filter((p: any) => new Date(p.created_at) >= new Date(since)).length,
      totalAppointments: allApps.length,
      completedAppointments: completedApps,
      cancelRate: cancelRate.toFixed(1),
      revenue, expense, profit,
      profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0",
      totalPrescriptions: allRxs.length,
      totalLabOrders: allLabs.length,
      totalTelemed: allTelemed.length,
      avgRevenuePerPatient: completedApps > 0 ? Math.round(revenue / completedApps) : 0,
    });

    // Daily revenue chart
    const dailyMap: Record<string, { date: string; revenue: number; expense: number; appointments: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      dailyMap[d] = { date: d.slice(5), revenue: 0, expense: 0, appointments: 0 };
    }
    allInvs.forEach((i: any) => {
      const d = i.created_at.slice(0, 10);
      if (dailyMap[d]) dailyMap[d].revenue += Number(i.paid_amount || 0);
    });
    allExps.forEach((e: any) => {
      const d = e.expense_date;
      if (dailyMap[d]) dailyMap[d].expense += Number(e.amount || 0);
    });
    allApps.forEach((a: any) => {
      const d = a.created_at.slice(0, 10);
      if (dailyMap[d]) dailyMap[d].appointments += 1;
    });

    // Service breakdown
    const serviceMap: Record<string, number> = {};
    allInvs.forEach((i: any) => {
      const t = i.service_type || "boshqa";
      serviceMap[t] = (serviceMap[t] || 0) + Number(i.paid_amount || 0);
    });

    // Status breakdown
    const statusMap: Record<string, number> = { completed: 0, cancelled: 0, scheduled: 0, no_show: 0 };
    allApps.forEach((a: any) => {
      statusMap[a.status] = (statusMap[a.status] || 0) + 1;
    });

    // Patient gender
    const genderMap: Record<string, number> = { male: 0, female: 0, other: 0 };
    allPatients.forEach((p: any) => {
      genderMap[p.gender || "other"] = (genderMap[p.gender || "other"] || 0) + 1;
    });

    // Hour distribution
    const hourMap: Record<number, number> = {};
    for (let h = 8; h <= 20; h++) hourMap[h] = 0;
    allApps.forEach((a: any) => {
      if (a.appointment_time) {
        const h = parseInt(a.appointment_time.slice(0, 2));
        if (hourMap[h] !== undefined) hourMap[h]++;
      }
    });

    setChartData({
      daily: Object.values(dailyMap),
      services: Object.entries(serviceMap).map(([name, value]) => ({ name, value })),
      status: Object.entries(statusMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value })),
      gender: Object.entries(genderMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value })),
      hours: Object.entries(hourMap).map(([h, c]) => ({ hour: `${h}:00`, count: c })),
    });

    setLoading(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setAiLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/doctor-ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: {
            period,
            stats,
            top_services: chartData.services?.slice(0, 5),
          },
        }),
      });

      if (resp.status === 429) { toast({ title: "Juda ko'p so'rov", variant: "destructive" }); setAiLoading(false); return; }
      if (resp.status === 402) { toast({ title: "Kreditlar tugadi", variant: "destructive" }); setAiLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("AI xizmati ishlamayapti");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let done = false;

      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantText += c;
              setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: assistantText } : m));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto" /></div>;
  }

  const KPI = ({ icon: Icon, label, value, sub, color, trend }: any) => (
    <div className={cn("rounded-2xl border border-border p-4 bg-gradient-to-br", color)}>
      <div className="flex items-start justify-between mb-2">
        <Icon className="w-7 h-7" />
        {trend !== undefined && (
          <Badge variant="outline" className={cn("text-[10px] gap-0.5", trend >= 0 ? "text-emerald-600 border-emerald-300" : "text-red-600 border-red-300")}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </Badge>
        )}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-secondary" />
            Statistika & AI Assistant
          </h2>
          <p className="text-sm text-muted-foreground">Real-vaqt analitika va aqlli tavsiyalar</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn("px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  period === p.key ? "bg-secondary text-white shadow" : "text-muted-foreground hover:text-foreground"
                )}>{p.label}</button>
            ))}
          </div>
          <Button onClick={() => setAiOpen(!aiOpen)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
            <Sparkles className="w-4 h-4 mr-1" /> AI Yordamchi
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Wallet} label="Daromad" value={`${(stats.revenue / 1000).toFixed(0)}K`} sub={`Foyda: ${stats.profitMargin}%`} color="from-emerald-500/20 to-emerald-500/5 text-emerald-600" />
        <KPI icon={TrendingDown} label="Xarajat" value={`${(stats.expense / 1000).toFixed(0)}K`} sub={`${stats.profit >= 0 ? "+" : ""}${(stats.profit / 1000).toFixed(0)}K foyda`} color="from-red-500/20 to-red-500/5 text-red-600" />
        <KPI icon={Users} label="Bemorlar" value={stats.totalPatients} sub={`+${stats.newPatients} yangi`} color="from-secondary/20 to-secondary/5 text-secondary" />
        <KPI icon={Calendar} label="Qabullar" value={stats.totalAppointments} sub={`${stats.completedAppointments} bajarilgan`} color="from-accent/20 to-accent/5 text-accent" />
        <KPI icon={Pill} label="Retseptlar" value={stats.totalPrescriptions} color="from-purple-500/20 to-purple-500/5 text-purple-600" />
        <KPI icon={FlaskConical} label="Lab buyurtma" value={stats.totalLabOrders} color="from-cyan-500/20 to-cyan-500/5 text-cyan-600" />
        <KPI icon={Activity} label="Telemeditsina" value={stats.totalTelemed} color="from-pink-500/20 to-pink-500/5 text-pink-600" />
        <KPI icon={Target} label="O'rt. daromad" value={`${(stats.avgRevenuePerPatient / 1000).toFixed(0)}K`} sub="bemor uchun" color="from-amber-500/20 to-amber-500/5 text-amber-600" />
      </div>

      {/* Daily chart */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2 mb-4">
          <LineIcon className="w-5 h-5 text-secondary" /> Kunlik daromad va xarajat
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData.daily}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Legend />
            <Area type="monotone" dataKey="revenue" name="Daromad" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#rev)" />
            <Area type="monotone" dataKey="expense" name="Xarajat" stroke="#ef4444" fillOpacity={1} fill="url(#exp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-accent" /> Xizmatlar bo'yicha
          </h3>
          {chartData.services?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData.services} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.services.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12">Ma'lumot yo'q</p>}
        </div>

        {/* Appointment status */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-500" /> Qabullar holati
          </h3>
          {chartData.status?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.status}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12">Ma'lumot yo'q</p>}
        </div>

        {/* Hours */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" /> Eng faol soatlar
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.hours}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-pink-500" /> Bemorlar demografiyasi
          </h3>
          {chartData.gender?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData.gender} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                  {chartData.gender.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-12">Ma'lumot yo'q</p>}
        </div>
      </div>

      {/* AI Assistant Drawer */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setAiOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-card border-l border-border shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border bg-gradient-to-r from-secondary/10 to-accent/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-foreground">AI Yordamchi</h3>
                  <p className="text-[11px] text-muted-foreground">Statistikangiz tahlilchisi</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAiOpen(false)}>✕</Button>
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <>
                  <div className="text-center py-6">
                    <Sparkles className="w-12 h-12 text-secondary mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">Salom, Doktor!</p>
                    <p className="text-xs text-muted-foreground mt-1">Statistikangizni tahlil qilishga yordam beraman</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Tezkor savollar:</p>
                    {QUICK_PROMPTS.map((p, i) => (
                      <button key={i} onClick={() => sendMessage(p.text)}
                        className="w-full text-left p-3 rounded-xl border border-border hover:border-secondary hover:bg-secondary/5 transition-all flex items-center gap-2">
                        <p.icon className="w-4 h-4 text-secondary flex-shrink-0" />
                        <span className="text-xs text-foreground">{p.text}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user" ? "bg-secondary text-white" : "bg-muted text-foreground"
                  )}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:my-1 [&>p]:text-sm [&>ul]:text-sm [&>ol]:text-sm">
                        <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                      </div>
                    ) : m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {aiLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-2xl px-3 py-2 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  placeholder="Savol yozing..." disabled={aiLoading} />
                <Button onClick={() => sendMessage(input)} disabled={aiLoading || !input.trim()}
                  className="bg-gradient-to-r from-secondary to-accent text-white border-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
