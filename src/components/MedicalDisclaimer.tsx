import { AlertTriangle } from "lucide-react";

interface Props {
  className?: string;
  compact?: boolean;
}

const DISCLAIMER_TEXT = "Ushbu sun'iy intellekt tahlili faqat axborot maqsadida taqdim etiladi va yakuniy tibbiy tashxis hisoblanmaydi. Aniq tashxis va davolanish uchun malakali shifokor yoki tibbiy mutaxassis bilan maslahatlashish tavsiya etiladi.";

const MedicalDisclaimer = ({ className = "", compact = false }: Props) => (
  <div className={`bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg ${compact ? "p-3" : "p-4"} flex items-start gap-2 ${className}`}>
    <AlertTriangle className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-amber-600 flex-shrink-0 mt-0.5`} />
    <p className={`${compact ? "text-xs" : "text-sm"} text-amber-800 dark:text-amber-200`}>
      {DISCLAIMER_TEXT}
    </p>
  </div>
);

export const DISCLAIMER_TEXT_PLAIN = DISCLAIMER_TEXT;

export default MedicalDisclaimer;
