import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, Check, CheckCheck, Info, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const typeIcons: Record<string, any> = {
  info: Info,
  appointment: Calendar,
  payment: CreditCard,
};

const PatientNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    if (!user) return;
    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as any, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-bold text-foreground">🔔 Bildirishnomalar</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-primary">
            <CheckCheck className="w-4 h-4 mr-1" /> Hammasini o'qilgan
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Bildirishnomalar yo'q</h3>
          <p className="text-muted-foreground text-sm">Yangi xabarlar bu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Info;
            return (
              <div
                key={n.id}
                className={cn(
                  "bg-card rounded-xl border p-4 flex items-start gap-3 transition-colors cursor-pointer",
                  n.is_read ? "border-border opacity-60" : "border-primary/30 bg-primary/5"
                )}
                onClick={() => !n.is_read && markAsRead(n.id)}
              >
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", n.is_read ? "bg-muted" : "bg-primary/10")}>
                  <Icon className={cn("w-4 h-4", n.is_read ? "text-muted-foreground" : "text-primary")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", n.is_read ? "text-muted-foreground" : "text-foreground")}>{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleString("uz-UZ")}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientNotifications;
