import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, MessageSquare, Bell, TrendingUp, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
  doctorName: string;
  replied: boolean;
}

interface Notification {
  id: string;
  patientName: string;
  type: "sms" | "telegram" | "email";
  message: string;
  sentAt: string;
  status: "sent" | "delivered" | "failed";
}

const SAMPLE_REVIEWS: Review[] = [
  { id: "1", patientName: "Aliyev Jasur", rating: 5, comment: "Juda yaxshi xizmat! Dr. Karimov professional shifokor.", date: "2026-03-28", doctorName: "Dr. Karimov", replied: true },
  { id: "2", patientName: "Rahimova Dilnoza", rating: 4, comment: "Yaxshi, lekin kutish vaqti biroz uzoq edi.", date: "2026-03-25", doctorName: "Dr. Sultonova", replied: false },
  { id: "3", patientName: "Toshmatov Rustam", rating: 5, comment: "Og'riqsiz davolash. Rahmat!", date: "2026-03-22", doctorName: "Dr. Azimov", replied: true },
  { id: "4", patientName: "Usmonova Gulnora", rating: 3, comment: "Xizmat yaxshi, narxlar biroz baland.", date: "2026-03-20", doctorName: "Dr. Karimov", replied: false },
];

const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id: "1", patientName: "Aliyev Jasur", type: "telegram", message: "6 oylik profilaktik tekshiruv eslatmasi", sentAt: "2026-03-30 10:00", status: "delivered" },
  { id: "2", patientName: "Rahimova Dilnoza", type: "sms", message: "Ertangi qabulingiz 09:00 da", sentAt: "2026-03-29 15:00", status: "sent" },
  { id: "3", patientName: "Karimova Sarvar", type: "telegram", message: "Breket tekshiruvi uchun yoziling", sentAt: "2026-03-28 12:00", status: "failed" },
];

const DentalFeedback = ({ patients }: { patients: any[] }) => {
  const [tab, setTab] = useState<"reviews" | "reminders" | "notifications">("reviews");
  const [search, setSearch] = useState("");

  const avgRating = SAMPLE_REVIEWS.reduce((a, r) => a + r.rating, 0) / SAMPLE_REVIEWS.length;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">💬 Qayta aloqa & CRM</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "O'rtacha baho", value: avgRating.toFixed(1), icon: Star, color: "text-yellow-600" },
          { label: "Jami sharhlar", value: SAMPLE_REVIEWS.length, icon: MessageSquare, color: "text-blue-600" },
          { label: "Eslatmalar", value: patients.length, icon: Bell, color: "text-purple-600" },
          { label: "Qaytib kelish %", value: "78%", icon: TrendingUp, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "reviews" as const, label: "⭐ Sharhlar" },
          { id: "reminders" as const, label: "🔔 Eslatmalar" },
          { id: "notifications" as const, label: "📨 Yuborilganlar" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "reviews" && (
        <div className="space-y-4">
          <Input placeholder="🔍 Sharh qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
          {SAMPLE_REVIEWS.filter(r => r.patientName.toLowerCase().includes(search.toLowerCase())).map(review => (
            <div key={review.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{review.patientName}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">👨‍⚕️ {review.doctorName} • {review.date}</p>
                </div>
                <div>
                  {review.replied ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">Javob berildi</Badge>
                  ) : (
                    <Button size="sm" variant="outline">Javob berish</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reminders" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Avtomatik eslatmalar</h3>
            <div className="space-y-3">
              {[
                { trigger: "6 oylik profilaktik tekshiruv", channel: "Telegram + SMS", active: true },
                { trigger: "Davolash kursi davomi", channel: "Telegram", active: true },
                { trigger: "Qabul eslatmasi (1 kun oldin)", channel: "SMS", active: true },
                { trigger: "Tug'ilgan kun tabrigi", channel: "Telegram", active: false },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.trigger}</p>
                    <p className="text-xs text-muted-foreground">{r.channel}</p>
                  </div>
                  <Badge variant={r.active ? "default" : "outline"}>{r.active ? "Faol" : "O'chiq"}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="space-y-4">
          {SAMPLE_NOTIFICATIONS.map(n => (
            <div key={n.id} className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{n.patientName}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{n.sentAt}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="uppercase text-xs">{n.type}</Badge>
                <p className={cn("text-xs mt-1",
                  n.status === "delivered" && "text-green-600",
                  n.status === "sent" && "text-blue-600",
                  n.status === "failed" && "text-red-600",
                )}>{n.status === "delivered" ? "✅ Yetkazildi" : n.status === "sent" ? "📤 Yuborildi" : "❌ Xato"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DentalFeedback;
