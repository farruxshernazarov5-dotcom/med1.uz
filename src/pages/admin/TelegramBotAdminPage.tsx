import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Send, Users, Activity, UserPlus, Ban, BellOff, Link2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Broadcast = { id: string; kind: string; message: string; sent_count: number; failed_count: number; created_at: string };
type Stats = {
  total: number; active24h: number; active7d: number; new7d: number; blocked: number;
  dailyOptOut: number; linkedProfiles: number; broadcasts: Broadcast[];
  termsAccepted?: number; channelMembers?: number; fullAccess?: number;
};

const FN_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/emedinfo-bot`;

async function callBot(path: string, body?: unknown) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`${FN_URL}/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Xato: ${res.status}`);
  return json;
}

const KIND_LABEL: Record<string, string> = { manual: "Eslatma (hammaga)", manual_linked: "Eslatma (ulanganlar)", daily_ai: "Kunlik AI xabari" };

const TelegramBotAdminPage = () => {
  const { user, loading, userRole } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonPath, setButtonPath] = useState("");
  const [segment, setSegment] = useState<"all" | "linked">("all");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try { setStats(await callBot("stats")); } catch (e) { toast.error((e as Error).message); }
  }, []);

  useEffect(() => { if (userRole === "admin") void load(); }, [userRole, load]);

  if (loading) return null;
  if (!user || userRole !== "admin") return <Navigate to="/" replace />;

  const send = async () => {
    if (!message.trim()) return toast.error("Xabar matnini yozing");
    if (!confirm("Eslatma bot foydalanuvchilariga yuborilsinmi?")) return;
    setSending(true);
    try {
      const r = await callBot("broadcast", { message, button_text: buttonText, button_path: buttonPath, segment });
      toast.success(`Yuborildi: ${r.sent}, xato: ${r.failed}`);
      setMessage(""); setButtonText(""); setButtonPath("");
      void load();
    } catch (e) { toast.error((e as Error).message); } finally { setSending(false); }
  };

  const cards = stats ? [
    { label: "Jami start berganlar", value: stats.total, icon: Users },
    { label: "Faol (24 soat)", value: stats.active24h, icon: Activity },
    { label: "Faol (7 kun)", value: stats.active7d, icon: Activity },
    { label: "Yangi (7 kun)", value: stats.new7d, icon: UserPlus },
    { label: "@Med1uz kanal a’zolari", value: stats.channelMembers ?? 0, icon: Users },
    { label: "Shartlarni qabul qilgan", value: stats.termsAccepted ?? 0, icon: Link2 },
    { label: "To‘liq ruxsat olgan", value: stats.fullAccess ?? 0, icon: UserPlus },
    { label: "Ulangan profillar", value: stats.linkedProfiles, icon: Link2 },
    { label: "Botni bloklagan", value: stats.blocked, icon: Ban },
    { label: "Kunlik xabarni o‘chirgan", value: stats.dailyOptOut, icon: BellOff },
  ] : [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">Telegram bot — statistika va eslatmalar</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-1" /> Yangilash</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <c.icon className="w-4 h-4 text-primary mb-2" />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
        {!stats && <p className="text-sm text-muted-foreground col-span-full">Yuklanmoqda...</p>}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Eslatma yuborish</h2>
        <Textarea rows={4} maxLength={3500} placeholder="Masalan: Ertaga profilaktik ko‘rik kuni! Qabulga yoziling." value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="grid md:grid-cols-2 gap-2">
          <Input placeholder="Tugma matni (ixtiyoriy)" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
          <Input placeholder="Sayt yo‘li, masalan /booking" value={buttonPath} onChange={(e) => setButtonPath(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={segment === "all" ? "default" : "outline"} size="sm" onClick={() => setSegment("all")}>Hammaga</Button>
          <Button variant={segment === "linked" ? "default" : "outline"} size="sm" onClick={() => setSegment("linked")}>Faqat hisobi ulanganlarga</Button>
          <Button className="ml-auto" onClick={() => void send()} disabled={sending}><Send className="w-4 h-4 mr-1" /> {sending ? "Yuborilmoqda..." : "Yuborish"}</Button>
        </div>
        <p className="text-xs text-muted-foreground">Kunlik AI taklif xabari har kuni 09:00 (Toshkent) da avtomatik yuboriladi — har bir foydalanuvchiga kuniga faqat 1 marta.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold mb-3">Yuborilgan xabarlar tarixi</h2>
        <div className="space-y-2">
          {stats?.broadcasts.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-3 border-b border-border pb-2 text-sm">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString("uz-UZ")} · {KIND_LABEL[b.kind] ?? b.kind}</div>
                <div className="truncate">{b.message.replace(/<[^>]+>/g, "")}</div>
              </div>
              <div className="text-xs shrink-0 text-right">✅ {b.sent_count}<br />⚠️ {b.failed_count}</div>
            </div>
          ))}
          {stats && !stats.broadcasts.length && <p className="text-sm text-muted-foreground">Hali xabar yuborilmagan.</p>}
        </div>
      </div>
    </div>
  );
};

export default TelegramBotAdminPage;
