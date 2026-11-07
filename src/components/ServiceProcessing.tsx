import { useEffect, useState } from "react";
import { Activity, ArrowLeftRight, Bot, FileCheck2, FileScan, ShieldCheck } from "lucide-react";
import { MOBILE_AI_SERVICES } from "@/data/mobileAiCatalog";
import { useLanguage } from "@/hooks/useLanguage";

export default function ServiceProcessing({ service = "page", compact = false }: { service?: string; compact?: boolean }) {
  const { lang } = useLanguage();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { setElapsed(0); const timer = window.setInterval(() => setElapsed(n => n + 1), 1000); return () => clearInterval(timer); }, [service]);
  const entry = MOBILE_AI_SERVICES.find(s => s.id === service || s.path === window.location.pathname);
  const payment = service === "payment";
  const page = service === "page";
  const Source = payment ? ArrowLeftRight : /scan|report|radiology/.test(service) ? FileScan : Activity;
  const Target = payment ? ShieldCheck : page ? FileCheck2 : entry?.icon || Bot;
  const title = payment ? (lang === "ru" ? "Проверка платежа" : lang === "en" ? "Checking payment" : "To‘lov tekshirilmoqda") : page ? (lang === "ru" ? "Загрузка" : lang === "en" ? "Loading" : "Sahifa ochilmoqda") : entry?.title || "MED ALL";
  const phrases = lang === "ru" ? ["Обрабатываем ваш запрос", "Ожидаем ответ сервиса", "Это занимает больше времени. Ожидаем ответ…"] : lang === "en" ? ["Processing your request", "Waiting for the service response", "This is taking longer. Still waiting for a response…"] : ["So‘rovingiz qayta ishlanmoqda", "Xizmat javobi kutilmoqda", "Odatdagidan uzoqroq. Javob hali kutilmoqda…"];
  return <div className={`service-processing ${compact ? "service-processing-compact" : ""}`} role="status" aria-live="polite" aria-busy="true">
    <p className="text-xs font-semibold text-secondary">MED ALL</p>
    <div className="service-connection" aria-hidden="true"><div className="service-node"><Source /></div><div className="service-wire"><i/><i/><i/></div><div className="service-node service-node-target"><Target /></div></div>
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">{phrases[elapsed >= 45 ? 2 : elapsed >= 8 ? 1 : 0]}</p>
    {!page && <p className="mt-4 text-xs tabular-nums text-muted-foreground" aria-live="off">{elapsed} {lang === "en" ? "sec" : lang === "ru" ? "сек" : "soniya"}</p>}
  </div>;
}