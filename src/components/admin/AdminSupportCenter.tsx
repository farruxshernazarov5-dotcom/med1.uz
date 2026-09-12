import { useCallback, useEffect, useState } from "react";
import { Headphones, Inbox, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SupportChat from "@/components/support/SupportChat";
import { useToast } from "@/hooks/use-toast";

type ConversationRow = { id: string; user_id: string; subject: string; status: string; last_message_at: string };

const AdminSupportCenter = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("support_conversations").select("id,user_id,subject,status,last_message_at").order("last_message_at", { ascending: false });
    if (error) toast({ title: "Murojaatlar yuklanmadi", description: error.message, variant: "destructive" });
    const conversations = data ?? [];
    setRows(conversations);
    setSelected((current) => current || conversations[0]?.id || "");
    const ids = [...new Set(conversations.map((item) => item.user_id))];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("user_id,full_name").in("user_id", ids);
      setNames(Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile.full_name || "Foydalanuvchi"])));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const channel = supabase.channel("admin-support-conversations").on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const changeStatus = async (status: "open" | "closed") => {
    if (!selected) return;
    const { error } = await supabase.from("support_conversations").update({ status, admin_last_read_at: new Date().toISOString() }).eq("id", selected);
    if (error) toast({ title: "Holat saqlanmadi", description: error.message, variant: "destructive" });
    else void load();
  };

  const active = rows.find((row) => row.id === selected);
  return (
    <div className="grid min-h-[620px] overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-border lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-border p-4"><div><h2 className="flex items-center gap-2 font-bold"><Headphones className="h-5 w-5 text-primary" /> Jonli yordam</h2><p className="text-xs text-muted-foreground">{rows.length} ta suhbat</p></div><Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Yangilash"><RotateCcw className="h-4 w-4" /></Button></div>
        <div className="max-h-[552px] overflow-y-auto p-2">
          {loading ? <p className="p-4 text-sm text-muted-foreground">Yuklanmoqda...</p> : rows.length === 0 ? <div className="p-8 text-center text-muted-foreground"><Inbox className="mx-auto mb-2 h-8 w-8" /><p className="text-sm">Hozircha murojaat yo‘q</p></div> : rows.map((row) => (
            <button key={row.id} onClick={() => setSelected(row.id)} className={cn("mb-1 w-full rounded-md p-3 text-left transition", selected === row.id ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{names[row.user_id] || "Bemor"}</p><Badge variant={row.status === "closed" ? "secondary" : "default"} className="text-[9px]">{row.status === "closed" ? "Yopiq" : "Faol"}</Badge></div>
              <p className={cn("mt-1 truncate text-xs", selected === row.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{row.subject}</p>
              <p className={cn("mt-1 text-[10px]", selected === row.id ? "text-primary-foreground/60" : "text-muted-foreground")}>{new Date(row.last_message_at).toLocaleString("uz-UZ")}</p>
            </button>
          ))}
        </div>
      </aside>
      <div className="min-w-0 p-3 md:p-4">
        {active ? <><div className="mb-3 flex justify-end"><Button size="sm" variant={active.status === "closed" ? "outline" : "destructive"} onClick={() => void changeStatus(active.status === "closed" ? "open" : "closed")}>{active.status === "closed" ? "Qayta ochish" : "Suhbatni yopish"}</Button></div><SupportChat key={active.id} conversationId={active.id} operator className="min-h-[540px]" /></> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Suhbatni tanlang</div>}
      </div>
    </div>
  );
};

export default AdminSupportCenter;