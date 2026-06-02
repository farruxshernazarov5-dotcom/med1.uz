import { AlertTriangle, RefreshCcw, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TokenLimitErrorProps {
  message?: string;
  onRetry?: () => void;
  onShorten?: () => void;
}

/**
 * Shown when the backend returns 413 (so'rov juda uzun) or token limit exceeded.
 * Always advises the user to send a "yengilroq so'rov" with concrete tips.
 */
const TokenLimitError = ({ message, onRetry, onShorten }: TokenLimitErrorProps) => {
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-5 my-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-1">
            So'rov hajmi limitdan oshdi
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
            {message || "Sizning savolingiz juda uzun. AI har bir javob uchun cheklangan token (so'z) hajmidan foydalanadi."}
          </p>
          <div className="rounded-xl bg-white/70 dark:bg-black/20 p-3 mb-3 border border-amber-200/60 dark:border-amber-800/30">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2">💡 Yengilroq so'rov tavsiyalari:</p>
            <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside">
              <li>Faqat 1 ta asosiy savolni so'rang (masalan: simptomingiz nomi)</li>
              <li>Eski xabarlar va keraksiz tafsilotlarni olib tashlang</li>
              <li>Yuklangan PDF/hujjatlarni faqat 1 tasini "aktiv" qiling</li>
              <li>So'rovni 2–3 jumla bilan cheklab yozing</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            {onShorten && (
              <Button size="sm" onClick={onShorten} variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Scissors className="w-4 h-4 mr-1.5" /> So'rovni qisqartirish
              </Button>
            )}
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} className="border-amber-300">
                <RefreshCcw className="w-4 h-4 mr-1.5" /> Qayta urinib ko'rish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenLimitError;
