import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, MessageCircle, Mail, Phone, Save, CheckCircle2 } from "lucide-react";

const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState({
    telegram: true,
    email: true,
    sms: false,
  });
  const [telegramChatId, setTelegramChatId] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const raw = data as any;
          const ch = raw.notification_channels as string[] | null;
          if (ch) {
            setChannels({
              telegram: ch.includes("telegram"),
              email: ch.includes("email"),
              sms: ch.includes("sms"),
            });
          }
          setTelegramChatId((raw.telegram_chat_id as string) || "");
        }
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const activeChannels = Object.entries(channels)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const { error } = await supabase
      .from("profiles")
      .update({
        notification_channels: activeChannels,
        telegram_chat_id: telegramChatId || null,
      } as any)
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saqlandi ✅", description: "Bildirishnoma sozlamalari yangilandi" });
    }
  };

  const channelList = [
    {
      id: "telegram" as const,
      label: "Telegram",
      desc: "Bot orqali xabar olish",
      icon: MessageCircle,
      color: "text-blue-500",
    },
    {
      id: "email" as const,
      label: "Email",
      desc: "Elektron pochta orqali natija PDF bilan",
      icon: Mail,
      color: "text-primary",
    },
    {
      id: "sms" as const,
      label: "SMS",
      desc: "Telefonga qisqa xabar",
      icon: Phone,
      color: "text-medical-green",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Bildirishnoma sozlamalari
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Analiz natijalari tayyor bo'lganda qaysi kanallar orqali xabar olishni tanlang:
        </p>

        <div className="space-y-3">
          {channelList.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-3">
                <ch.icon className={`w-5 h-5 ${ch.color}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{ch.label}</p>
                  <p className="text-xs text-muted-foreground">{ch.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {channels[ch.id] && (
                  <Badge variant="outline" className="text-[10px] bg-medical-green/10 text-medical-green border-medical-green/30">
                    Faol
                  </Badge>
                )}
                <Switch
                  checked={channels[ch.id]}
                  onCheckedChange={(v) => setChannels((p) => ({ ...p, [ch.id]: v }))}
                />
              </div>
            </div>
          ))}
        </div>

        {channels.telegram && (
          <div className="space-y-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Label className="text-sm font-medium">Telegram Chat ID</Label>
            <Input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Misol: 123456789"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              @Med1uzOTP_Bot ga /start yuboring va Chat ID ni kiriting.
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
