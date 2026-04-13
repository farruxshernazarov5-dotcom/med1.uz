import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Send, Sparkles, MessageSquare, AlertTriangle, Stethoscope,
  BarChart3, Loader2, TrendingUp, TrendingDown, Users, Calendar,
  DollarSign, Activity, Bell, Zap, Target, PieChart, ArrowUp, ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DentalAIProps {
  clinicId: string;
  patients: any[];
  appointments: any[];
  treatments: any[];
  services: any[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DentalAI = ({ clinicId, patients, appointments, treatments, services }: DentalAIProps) => {
  const [tab, setTab] = useState<"dashboard" | "insights" | "recommendations" | "alerts" | "chatbot" | "patients" | "finance">("dashboard");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Salom! Men klinika AI boshqaruv yordamchisiman. Daromad, bemorlar, xizmatlar va boshqa ko'rsatkichlar bo'yicha savollaringizga javob beraman. 🦷" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (!clinicId) return;
    const fetchFinancial = async () => {
      const [tx, ex] = await Promise.all([
        supabase.from("dental_transactions").select("*").eq("clinic_id", clinicId),
        supabase.from("dental_expenses").select("*").eq("clinic_id", clinicId),
      ]);
      setTransactions(tx.data || []);
      setExpenses(ex.data || []);
    };
    fetchFinancial();
  }, [clinicId]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const monthlyRevenue = transactions
      .filter(t => { const d = new Date(t.created_at); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const lastMonthRevenue = transactions
      .filter(t => { const d = new Date(t.created_at); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; })
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const monthlyExpense = expenses
      .filter(e => { const d = new Date(e.expense_date || e.created_at); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : "0";

    const todayStr = today.toISOString().split("T")[0];
    const todayAppts = appointments.filter(a => a.appointment_date === todayStr);
    const completedAppts = appointments.filter(a => a.status === "completed");
    const cancelledAppts = appointments.filter(a => a.status === "cancelled");
    const cancelRate = appointments.length > 0 ? (cancelledAppts.length / appointments.length * 100).toFixed(1) : "0";

    const newPatientsThisMonth = patients.filter(p => {
      const d = new Date(p.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const avgRevenuePerPatient = patients.length > 0 ? Math.round(transactions.reduce((s, t) => s + Number(t.amount || 0), 0) / patients.length) : 0;

    const serviceUsage: Record<string, number> = treatments.reduce((acc: Record<string, number>, t: any) => {
      const key = t.treatment_type || "Boshqa";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topServices: [string, number][] = Object.entries(serviceUsage).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5);

    return {
      monthlyRevenue, lastMonthRevenue, monthlyExpense,
      profit: monthlyRevenue - monthlyExpense,
      revenueGrowth: parseFloat(revenueGrowth as string),
      todayAppts: todayAppts.length,
      totalPatients: patients.length,
      newPatientsThisMonth,
      cancelRate: parseFloat(cancelRate as string),
      avgRevenuePerPatient,
      topServices: topServices as [string, number][],
      completedAppts: completedAppts.length,
    };
  }, [patients, appointments, treatments, transactions, expenses]);

  // Generate AI insights
  const insights = useMemo(() => {
    const items: { type: "success" | "warning" | "info"; title: string; desc: string }[] = [];

    if (analytics.revenueGrowth > 10) {
      items.push({ type: "success", title: "Daromad o'sishi", desc: `Bu oy daromad ${analytics.revenueGrowth}% ga oshdi. Ajoyib natija!` });
    } else if (analytics.revenueGrowth < -10) {
      items.push({ type: "warning", title: "Daromad pasayishi", desc: `Bu oy daromad ${Math.abs(analytics.revenueGrowth)}% ga tushdi. Sabab tahlil qilish kerak.` });
    }

    if (analytics.cancelRate > 20) {
      items.push({ type: "warning", title: "Yuqori bekor qilish", desc: `Qabullarning ${analytics.cancelRate}% bekor qilingan. SMS eslatmalar yoqilsin.` });
    }

    if (analytics.newPatientsThisMonth === 0) {
      items.push({ type: "warning", title: "Yangi bemorlar yo'q", desc: "Bu oy yangi bemor kelmagan. Marketing faoliyatini kuchaytiring." });
    } else if (analytics.newPatientsThisMonth > 5) {
      items.push({ type: "success", title: "Yangi bemorlar", desc: `Bu oy ${analytics.newPatientsThisMonth} ta yangi bemor qo'shildi.` });
    }

    if (analytics.profit < 0) {
      items.push({ type: "warning", title: "Zarar", desc: `Bu oy ${Math.abs(analytics.profit).toLocaleString()} so'm zarar. Xarajatlarni kamaytiring.` });
    }

    if (analytics.topServices.length > 0) {
      items.push({ type: "info", title: "Top xizmat", desc: `Eng ko'p ishlatiladigan xizmat: "${analytics.topServices[0][0]}" (${analytics.topServices[0][1]} marta)` });
    }

    if (items.length === 0) {
      items.push({ type: "info", title: "Ma'lumot yetarli emas", desc: "Ko'proq ma'lumot kiritilgach AI tahlillar paydo bo'ladi." });
    }

    return items;
  }, [analytics]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: { icon: string; title: string; desc: string; priority: "high" | "medium" | "low" }[] = [];

    if (analytics.cancelRate > 15) {
      recs.push({ icon: "📱", title: "SMS eslatmalar yoqing", desc: "Qabul oldidan avtomatik SMS yuborilsa bekor qilishlar kamayadi", priority: "high" });
    }

    if (analytics.avgRevenuePerPatient < 200000) {
      recs.push({ icon: "💰", title: "Qo'shimcha xizmatlar taklif qiling", desc: "Oqartirish, gigiena kabi qo'shimcha xizmatlar daromadni oshiradi", priority: "medium" });
    }

    if (analytics.newPatientsThisMonth < 3) {
      recs.push({ icon: "📣", title: "Marketing kampaniya", desc: "Ijtimoiy tarmoqlar va Google Ads orqali yangi bemorlarni jalb qiling", priority: "high" });
    }

    if (analytics.topServices.length > 0 && (analytics.topServices[0][1] as number) > 10) {
      recs.push({ icon: "⭐", title: `"${analytics.topServices[0][0]}" narxini ko'ring`, desc: "Eng mashhur xizmat narxini bozor bilan solishtirib ko'ring", priority: "medium" });
    }

    recs.push({ icon: "🔄", title: "Qayta qabul eslatmalari", desc: "6 oydan keyin profilaktik tekshiruv eslatmasi yuborish", priority: "low" });

    return recs;
  }, [analytics]);

  // Alerts
  const alerts = useMemo(() => {
    const items: { type: "danger" | "warning" | "info"; message: string }[] = [];

    if (analytics.profit < 0) items.push({ type: "danger", message: `⚠️ Bu oy ${Math.abs(analytics.profit).toLocaleString()} so'm zarar qayd etildi` });
    if (analytics.cancelRate > 25) items.push({ type: "danger", message: `🚨 Qabullarning ${analytics.cancelRate}% bekor qilinmoqda` });
    if (analytics.revenueGrowth < -20) items.push({ type: "warning", message: `📉 Daromad ${Math.abs(analytics.revenueGrowth)}% tushdi` });
    if (analytics.todayAppts === 0) items.push({ type: "info", message: "📅 Bugun qabul rejasi yo'q" });
    if (analytics.newPatientsThisMonth === 0) items.push({ type: "warning", message: "👤 Bu oy yangi bemor yo'q" });

    return items;
  }, [analytics]);

  const callAI = async (messages: ChatMessage[]): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("dental-ai-chat", {
      body: {
        messages,
        mode: "management",
        context: {
          totalPatients: analytics.totalPatients,
          monthlyRevenue: analytics.monthlyRevenue,
          monthlyExpense: analytics.monthlyExpense,
          profit: analytics.profit,
          todayAppts: analytics.todayAppts,
          cancelRate: analytics.cancelRate,
          topServices: analytics.topServices,
        },
      },
    });
    if (error) throw new Error(error.message);
    return data.reply;
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const reply = await callAI(newMessages.slice(-10));
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Kechirasiz, xatolik yuz berdi." }]);
    }
    setChatLoading(false);
  };

  const tabs = [
    { id: "dashboard" as const, label: "📊 Dashboard", icon: BarChart3 },
    { id: "insights" as const, label: "🧠 Insights", icon: Brain },
    { id: "recommendations" as const, label: "💡 Tavsiyalar", icon: Target },
    { id: "alerts" as const, label: "🔔 Alertlar", icon: Bell },
    { id: "finance" as const, label: "💰 Moliya", icon: DollarSign },
    { id: "patients" as const, label: "👥 Bemorlar", icon: Users },
    { id: "chatbot" as const, label: "💬 AI Chat", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">🤖 AI Klinika Boshqaruv Tizimi</h2>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>
            <t.icon className="w-4 h-4 mr-1" /> {t.label}
          </Button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Oylik daromad", value: `${analytics.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", sub: `${analytics.revenueGrowth > 0 ? "+" : ""}${analytics.revenueGrowth}%` },
              { label: "Sof foyda", value: `${analytics.profit.toLocaleString()}`, icon: TrendingUp, color: analytics.profit >= 0 ? "text-green-600" : "text-red-600", sub: "so'm" },
              { label: "Bemorlar", value: `${analytics.totalPatients}`, icon: Users, color: "text-blue-600", sub: `+${analytics.newPatientsThisMonth} bu oy` },
              { label: "Bugungi qabul", value: `${analytics.todayAppts}`, icon: Calendar, color: "text-indigo-600", sub: "navbatda" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={cn("w-5 h-5", s.color)} />
                  {alerts.length > 0 && s.label === "Sof foyda" && analytics.profit < 0 && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold text-foreground">{analytics.completedAppts}</p>
              <p className="text-xs text-muted-foreground">Bajarilgan qabullar</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <p className="text-lg font-bold text-foreground">{analytics.cancelRate}%</p>
              <p className="text-xs text-muted-foreground">Bekor qilish</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 text-center">
              <PieChart className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <p className="text-lg font-bold text-foreground">{analytics.avgRevenuePerPatient.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">O'rtacha/bemor (so'm)</p>
            </div>
          </div>

          {/* Top services */}
          {analytics.topServices.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="font-heading font-bold text-foreground mb-3">📊 Top xizmatlar</h3>
              <div className="space-y-2">
                {analytics.topServices.map(([name, count], i) => (
                  <div key={name} className="flex items-center justify-between p-2 bg-muted/30 rounded-xl">
                    <span className="text-sm text-foreground">{i + 1}. {name}</span>
                    <Badge variant="outline">{count} marta</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* INSIGHTS */}
      {tab === "insights" && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground">🧠 AI tahlillar</h3>
          {insights.map((item, i) => (
            <div key={i} className={cn(
              "rounded-2xl border p-5",
              item.type === "success" && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
              item.type === "warning" && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
              item.type === "info" && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
            )}>
              <div className="flex items-start gap-3">
                <Sparkles className={cn("w-5 h-5 shrink-0 mt-0.5",
                  item.type === "success" && "text-green-600",
                  item.type === "warning" && "text-yellow-600",
                  item.type === "info" && "text-blue-600",
                )} />
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECOMMENDATIONS */}
      {tab === "recommendations" && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground">💡 AI tavsiyalari</h3>
          {recommendations.map((rec, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{rec.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{rec.title}</p>
                    <Badge variant="outline" className={cn(
                      rec.priority === "high" && "text-red-600 border-red-300",
                      rec.priority === "medium" && "text-yellow-600 border-yellow-300",
                      rec.priority === "low" && "text-green-600 border-green-300",
                    )}>{rec.priority === "high" ? "Muhim" : rec.priority === "medium" ? "O'rta" : "Past"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{rec.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALERTS */}
      {tab === "alerts" && (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-foreground">🔔 AI alertlar</h3>
          {alerts.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 p-6 text-center">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-green-500" />
              <p className="font-semibold text-green-700 dark:text-green-400">Hamma narsa yaxshi!</p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">Hozircha ogohlantirishlar yo'q</p>
            </div>
          ) : alerts.map((a, i) => (
            <div key={i} className={cn(
              "rounded-2xl border p-4 flex items-center gap-3",
              a.type === "danger" && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
              a.type === "warning" && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
              a.type === "info" && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
            )}>
              <Bell className={cn("w-5 h-5 shrink-0",
                a.type === "danger" && "text-red-600",
                a.type === "warning" && "text-yellow-600",
                a.type === "info" && "text-blue-600",
              )} />
              <p className="text-sm font-medium text-foreground">{a.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* FINANCE AI */}
      {tab === "finance" && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-foreground">💰 Moliyaviy tahlil</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 p-5 text-center">
              <ArrowUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-xl font-bold text-green-700">{analytics.monthlyRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600">Oylik daromad</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-5 text-center">
              <ArrowDown className="w-5 h-5 mx-auto mb-1 text-red-600" />
              <p className="text-xl font-bold text-red-700">{analytics.monthlyExpense.toLocaleString()}</p>
              <p className="text-xs text-red-600">Oylik xarajat</p>
            </div>
          </div>
          <div className={cn(
            "rounded-2xl border p-5 text-center",
            analytics.profit >= 0 ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
          )}>
            <p className={cn("text-2xl font-bold", analytics.profit >= 0 ? "text-green-700" : "text-red-700")}>
              {analytics.profit.toLocaleString()} so'm
            </p>
            <p className="text-xs text-muted-foreground">Sof foyda</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-3">📈 AI prognoz</h4>
            <p className="text-sm text-muted-foreground">
              {analytics.revenueGrowth > 0
                ? `Daromad o'sish trendida (+${analytics.revenueGrowth}%). Agar shu sur'at davom etsa, keyingi oyda taxminan ${Math.round(analytics.monthlyRevenue * (1 + analytics.revenueGrowth / 100)).toLocaleString()} so'm daromad kutiladi.`
                : analytics.revenueGrowth < 0
                  ? `Daromad pasayish trendida (${analytics.revenueGrowth}%). Marketing va bemor jalb qilish choralarini ko'ring.`
                  : "Yetarli tarixiy ma'lumot yo'q. Kamida 2 oy ma'lumot kerak."}
            </p>
          </div>
        </div>
      )}

      {/* PATIENT ANALYSIS */}
      {tab === "patients" && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-foreground">👥 Bemor tahlili</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-primary">{analytics.totalPatients}</p>
              <p className="text-xs text-muted-foreground">Jami bemorlar</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{analytics.newPatientsThisMonth}</p>
              <p className="text-xs text-muted-foreground">Bu oy yangi</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <p className="text-2xl font-bold text-orange-600">{analytics.avgRevenuePerPatient.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">O'rtacha daromad/bemor</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <h4 className="font-semibold text-foreground mb-3">🧠 AI bemor tahlili</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {analytics.totalPatients === 0 ? (
                <p>Bemorlar ma'lumoti yo'q</p>
              ) : (
                <>
                  <p>• Jami {analytics.totalPatients} bemor ro'yxatda</p>
                  <p>• Bu oy {analytics.newPatientsThisMonth} ta yangi bemor qo'shildi</p>
                  <p>• Har bir bemordan o'rtacha {analytics.avgRevenuePerPatient.toLocaleString()} so'm daromad</p>
                  {analytics.cancelRate > 15 && <p className="text-yellow-600">• ⚠️ Qabul bekor qilish darajasi yuqori: {analytics.cancelRate}%</p>}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHATBOT */}
      {tab === "chatbot" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground">🤖 AI Boshqaruv Yordamchi</p>
            <p className="text-xs text-muted-foreground">Klinika ko'rsatkichlari, moliya, bemorlar haqida so'rang</p>
          </div>
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              placeholder="Masalan: Bu oy daromad qancha?"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendChat()}
              disabled={chatLoading}
            />
            <Button onClick={handleSendChat} disabled={chatLoading}>
              {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalAI;
