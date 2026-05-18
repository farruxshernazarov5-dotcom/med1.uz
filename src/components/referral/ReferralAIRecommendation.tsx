import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ReferralStats } from "@/hooks/useReferral";

type Props = {
  stats: ReferralStats | null;
  orgRole?: string | null;
};

export const ReferralAIRecommendation = ({ stats, orgRole }: Props) => {
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string[]>([]);

  const ask = async () => {
    setLoading(true);
    try {
      const prompt = `Sen MED-ALL AI / med1.uz platformasi uchun referral marketing maslahatchisisan.
Foydalanuvchi roli: ${orgRole ?? "user"}.
Statistika: jami taklif ${stats?.total_invites ?? 0}, konversiya ${stats?.conversion_rate ?? 0}%, daraja ${stats?.current_tier ?? "Bronze"}.

5 ta amaliy, qisqa va aniq tavsiya ber — kimga, qaysi kanal orqali, qanday matn bilan referral yuborish kerakligi haqida. Faqat o'zbek tilida, har biri 1 qatordan oshmasin. Faqat ro'yxat bilan javob ber.`;

      const { data, error } = await supabase.functions.invoke("ai-health-assistant", {
        body: { prompt, mode: "text" },
      });

      if (error) throw error;
      const text: string = data?.response ?? data?.text ?? "";
      const items = text
        .split(/\n+/)
        .map((l) => l.replace(/^[\d•\-.\s]+/, "").trim())
        .filter((l) => l.length > 5)
        .slice(0, 5);
      setTips(items.length ? items : ["Hozircha tavsiyalar mavjud emas. Keyinroq urinib ko'ring."]);
    } catch (e: any) {
      setTips([
        "Telegram guruhlaringizdagi tibbiyot xodimlariga shaxsiy xabar yuboring.",
        "LinkedIn'da klinika rahbarlariga professional taklif yo'llang.",
        "Vrach-konferensiyalarda QR kodingizni vizitkaga qo'shing.",
        "Hamkor dorixonalarga email orqali platforma afzalliklarini yuboring.",
        "WhatsApp orqali yaqin hamkasblaringizga havolani ulashing.",
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-dark rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7B61FF]" />
          <h3 className="font-semibold">AI tavsiyalari</h3>
        </div>
        <Button size="sm" variant="outline" className="border-white/10" onClick={ask} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
          {tips.length ? "Yangilash" : "Tavsiya olish"}
        </Button>
      </div>

      {!tips.length ? (
        <p className="text-sm text-muted-foreground">
          AI sizning rolingiz va statistikangiz asosida kim va qaysi kanal orqali taklif qilishni tavsiya qiladi.
        </p>
      ) : (
        <ul className="space-y-2">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-[#7B61FF]/20 text-[#7B61FF] text-xs font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-foreground/90">{t}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReferralAIRecommendation;
