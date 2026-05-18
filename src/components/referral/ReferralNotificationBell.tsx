import { useMemo, useState } from "react";
import { Bell, Gift, AlertTriangle, UserPlus, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReferral } from "@/hooks/useReferral";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type NotifType = "new_referral" | "reward_granted" | "fraud_alert" | string;

const ICONS: Record<string, { Icon: typeof Gift; cls: string }> = {
  new_referral: { Icon: UserPlus, cls: "text-blue-600 bg-blue-50" },
  reward_granted: { Icon: Gift, cls: "text-emerald-600 bg-emerald-50" },
  fraud_alert: { Icon: AlertTriangle, cls: "text-red-600 bg-red-50" },
  default: { Icon: Bell, cls: "text-muted-foreground bg-muted" },
};

interface Props {
  className?: string;
  variant?: "ghost" | "outline";
}

export default function ReferralNotificationBell({ className, variant = "ghost" }: Props) {
  const { notifications, markNotifRead } = useReferral();
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter((n) => !n.is_read).map((n) => markNotifRead(n.id))
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={cn("relative", className)}
          aria-label="Referral bildirishnomalari"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h4 className="font-semibold text-sm">Referral bildirishnomalari</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} ta yangi` : "Hammasi o'qilgan"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-8 text-xs">
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Hammasini o'qish
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[420px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              Hozircha bildirishnoma yo'q
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const meta = ICONS[n.type as NotifType] ?? ICONS.default;
                const { Icon, cls } = meta;
                return (
                  <li
                    key={n.id}
                    onClick={() => !n.is_read && markNotifRead(n.id)}
                    className={cn(
                      "flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition",
                      !n.is_read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", cls)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">{n.title}</p>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {n.created_at
                          ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                          : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
