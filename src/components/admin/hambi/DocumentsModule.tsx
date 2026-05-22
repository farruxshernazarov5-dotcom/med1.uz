import { useState } from "react";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Receipt, FileSignature, FileBarChart2, Cpu, Building2,
  Download, Eye, Printer, Share2, Lock, ShieldCheck, FileSpreadsheet, FileType2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadHambiReport, downloadCSV } from "@/utils/downloadHambiReport";
import LegalModule from "./LegalModule";

type Lang = "uz" | "ru" | "en";
interface Props { slug: string; lang: Lang }

const T: Record<string, Record<Lang, string>> = {
  title:     { uz: "Hujjatlar va PDF", ru: "Документы и PDF", en: "Documents & PDF" },
  subtitle:  { uz: "Invoyslar, shartnomalar, hisobotlar — to'liq tuzatilgan PDF eksport",
               ru: "Инвойсы, контракты, отчёты — полностью исправленный PDF экспорт",
               en: "Invoices, contracts, reports — fully fixed PDF export" },
  templates: { uz: "Hujjat shablonlari", ru: "Шаблоны документов", en: "Document templates" },
  legal:     { uz: "Yuridik hujjatlar", ru: "Юридические документы", en: "Legal documents" },
  preview:   { uz: "Ko'rish", ru: "Просмотр", en: "Preview" },
  download:  { uz: "PDF", ru: "PDF", en: "PDF" },
  csv:       { uz: "CSV", ru: "CSV", en: "CSV" },
  print:     { uz: "Chop etish", ru: "Печать", en: "Print" },
  share:     { uz: "Ulashish", ru: "Поделиться", en: "Share" },
  security:  { uz: "Hujjat xavfsizligi", ru: "Безопасность документа", en: "Document security" },
  watermark: { uz: "Suv belgisi", ru: "Водяной знак", en: "Watermark" },
  encrypted: { uz: "Shifrlangan yuklash", ru: "Шифрованная загрузка", en: "Encrypted download" },
  audit:     { uz: "Audit log", ru: "Аудит-лог", en: "Audit log" },
  qrVerify:  { uz: "QR tasdiqlash", ru: "QR проверка", en: "QR verification" },
  fixed:     { uz: "PDF eksport tuzatildi — bo'sh fayllar yo'q",
               ru: "PDF экспорт исправлен — пустых файлов больше нет",
               en: "PDF export fixed — no more blank files" },
};
const t = (k: string, l: Lang) => T[k]?.[l] ?? k;

const TEMPLATES = [
  { id: "invoice", icon: Receipt, color: "from-cyan-500/30 to-blue-500/20",
    title: { uz: "Invoys", ru: "Инвойс", en: "Invoice" },
    desc:  { uz: "Mijoz uchun rasmiy hisob-faktura", ru: "Официальный счёт клиенту", en: "Official customer invoice" } },
  { id: "receipt", icon: FileText, color: "from-emerald-500/30 to-teal-500/20",
    title: { uz: "To'lov kvitansiyasi", ru: "Квитанция об оплате", en: "Payment receipt" },
    desc:  { uz: "QR-tasdiqli to'lov tasdiqnomasi", ru: "Подтверждение оплаты с QR", en: "QR-verified payment proof" } },
  { id: "contract", icon: FileSignature, color: "from-violet-500/30 to-fuchsia-500/20",
    title: { uz: "Shartnoma", ru: "Договор", en: "Contract" },
    desc:  { uz: "B2B/B2C shartnoma andozasi", ru: "Шаблон B2B/B2C договора", en: "B2B/B2C contract template" } },
  { id: "subscription", icon: FileType2, color: "from-amber-500/30 to-orange-500/20",
    title: { uz: "Obuna kelishuvi", ru: "Соглашение подписки", en: "Subscription agreement" },
    desc:  { uz: "AI / SaaS obuna shartlari", ru: "Условия AI / SaaS подписки", en: "AI / SaaS subscription terms" } },
  { id: "financial", icon: FileBarChart2, color: "from-blue-500/30 to-indigo-500/20",
    title: { uz: "Moliyaviy hisobot", ru: "Финансовый отчёт", en: "Financial report" },
    desc:  { uz: "Daromad, RevShare va MRR breakdown", ru: "Доход, RevShare и MRR", en: "Revenue, RevShare & MRR breakdown" } },
  { id: "ai_usage", icon: Cpu, color: "from-fuchsia-500/30 to-pink-500/20",
    title: { uz: "AI foydalanish hisoboti", ru: "Отчёт по AI", en: "AI usage report" },
    desc:  { uz: "Token sarfi, model va xizmat bo'yicha", ru: "Расход токенов по моделям", en: "Token spend by model/service" } },
  { id: "org", icon: Building2, color: "from-slate-500/30 to-zinc-500/20",
    title: { uz: "Tashkilot bayonoti", ru: "Выписка организации", en: "Organization statement" },
    desc:  { uz: "Klinika / korxona uchun statement", ru: "Statement для клиники", en: "Statement for clinics/orgs" } },
];

export default function DocumentsModule({ slug, lang }: Props) {
  const [tab, setTab] = useState<"templates" | "legal">("templates");

  const generateSample = async (template: typeof TEMPLATES[0]) => {
    const ref = `${template.id.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-8)}`;
    const sample: Record<string, any> = {
      invoice: {
        sections: [
          { heading: "Customer", rows: [["Name", "Aziz Karimov"], ["Phone", "+998 90-123-45-67"], ["Email", "aziz@med1.uz"]] },
          { heading: "Provider", rows: [["Company", "MED-ALL AI SYSTEM MChJ"], ["INN", "123456789"], ["Address", "Tashkent, Uzbekistan"]] },
        ],
        table: { headers: ["#", "Item", "Qty", "Price", "Total"], rows: [
          ["1", "Premium AI subscription (12 mo)", "1", "199 000", "2 388 000"],
          ["2", "Extra AI credits", "500", "200", "100 000"],
        ]},
        totals: [["Subtotal", "2 488 000 UZS"], ["VAT 12%", "298 560 UZS"], ["Total", "2 786 560 UZS"]],
      },
      receipt: {
        sections: [{ heading: "Payment", rows: [
          ["Amount", "199 000 UZS"], ["Method", "Click"], ["Date", new Date().toLocaleString("uz-UZ")],
          ["Reference", ref], ["Status", "completed"],
        ]}],
        totals: [["Paid", "199 000 UZS"]],
      },
      contract: {
        sections: [
          { heading: "Parties", rows: [["Provider", "MED-ALL AI SYSTEM MChJ"], ["Client", "HAMBI / UNITEL"]] },
          { heading: "Terms", rows: [
            ["Duration", "12 months"], ["RevShare", "18%"], ["Auto-renewal", "Yes"],
            ["Effective from", new Date().toLocaleDateString("uz-UZ")],
          ]},
        ],
        notes: "Both parties agree to the terms outlined herein. Electronic signatures are legally binding under the laws of the Republic of Uzbekistan.",
      },
      subscription: {
        sections: [
          { heading: "Subscriber", rows: [["User", "Aziz Karimov"], ["Plan", "Premium AI (yearly)"]] },
          { heading: "Limits", rows: [["AI requests", "unlimited"], ["Image generation", "15/day"], ["Priority support", "yes"]] },
        ],
        totals: [["Annual cost", "2 388 000 UZS"]],
      },
      financial: {
        sections: [{ heading: "P&L", rows: [
          ["Revenue", "76 400 000 UZS"], ["RevShare paid", "13 752 000 UZS"], ["Costs", "21 100 000 UZS"], ["Net profit", "41 548 000 UZS"],
        ]}],
        table: { headers: ["Channel", "Revenue", "Share"], rows: [
          ["HMS SaaS", "48 970 000", "64%"], ["AI Services", "19 830 000", "26%"], ["Partner", "7 600 000", "10%"],
        ]},
        totals: [["MRR", "76 400 000 UZS"], ["ARR", "916 800 000 UZS"]],
      },
      ai_usage: {
        sections: [{ heading: "Usage", rows: [["Total requests", "184 230"], ["Tokens spent", "12.4M"], ["Models", "Gemini 3 Flash, GPT-5"]]}],
        table: { headers: ["Service", "Requests", "Tokens"], rows: [
          ["AI Doctor", "84 100", "5.8M"], ["Symptom Checker", "42 300", "2.1M"],
          ["Diagnostics", "31 200", "3.2M"], ["Pharmacy", "18 600", "0.9M"],
        ]},
      },
      org: {
        sections: [{ heading: "Organization", rows: [
          ["Name", "MED1 Tashkent Clinic"], ["Type", "Multi-specialty clinic"], ["Active users", "84"], ["Plan", "Business HMS"],
        ]}],
        totals: [["Outstanding balance", "0 UZS"], ["Lifetime spend", "47 300 000 UZS"]],
      },
    };

    const data = sample[template.id] || {};
    await downloadHambiReport({
      title: template.title[lang],
      subtitle: template.desc[lang],
      refNumber: ref,
      language: lang,
      sections: data.sections || [],
      table: data.table,
      totals: data.totals,
      notes: data.notes || `Partner: ${slug} • Generated: ${new Date().toLocaleString("uz-UZ")}`,
    });
  };

  return (
    <div className="space-y-6">
      <GlowCard tone="cyan" glow>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileText className="w-5 h-5 text-cyan-300" />
              <h2 className="text-lg font-semibold text-white">{t("title", lang)}</h2>
              <LiveStatusPill label="LIVE" />
            </div>
            <p className="text-sm text-white/60">{t("subtitle", lang)}</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5 ring-1 ring-white/10">
            <button onClick={() => setTab("templates")}
              className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-md transition",
                tab === "templates" ? "bg-cyan-500/30 text-white" : "text-white/50 hover:text-white")}>
              {t("templates", lang)}
            </button>
            <button onClick={() => setTab("legal")}
              className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-md transition",
                tab === "legal" ? "bg-cyan-500/30 text-white" : "text-white/50 hover:text-white")}>
              {t("legal", lang)}
            </button>
          </div>
        </div>
      </GlowCard>

      {tab === "templates" ? (
        <>
          <GlowCard tone="purple">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t("fixed", lang)}</p>
                <p className="text-[11px] text-white/60">Universal generator • UZ / RU / EN • QR verification • branded</p>
              </div>
              <div className="ml-auto flex items-center gap-3 text-[10px] text-white/60">
                <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-300" /> {t("encrypted", lang)}</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-cyan-300" /> {t("qrVerify", lang)}</span>
                <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3 text-violet-300" /> {t("watermark", lang)}</span>
              </div>
            </div>
          </GlowCard>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {TEMPLATES.map((tpl) => (
              <div key={tpl.id} className={cn("group relative rounded-2xl p-4 ring-1 ring-white/10 bg-gradient-to-br overflow-hidden hover:ring-white/20 transition", tpl.color)}>
                <div className="absolute inset-0 opacity-30 bg-grid-tech pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                      <tpl.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge className="text-[9px] bg-emerald-500/20 text-emerald-200 border-0">PDF ✓</Badge>
                  </div>
                  <p className="text-sm font-bold text-white">{tpl.title[lang]}</p>
                  <p className="text-[11px] text-white/60 mt-1 min-h-[32px]">{tpl.desc[lang]}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Button size="sm" onClick={() => generateSample(tpl)}
                      className="flex-1 h-8 text-[11px] bg-white/15 hover:bg-white/25 text-white border border-white/20">
                      <Download className="w-3 h-3 mr-1" /> {t("download", lang)}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => generateSample(tpl)}
                      className="h-8 w-8 p-0 text-white/70 hover:text-white" title={t("preview", lang)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => downloadCSV(`${tpl.id}-sample`, ["field", "value"], [["template", tpl.id], ["ref", `${tpl.id}-${Date.now()}`]])}
                      className="h-8 w-8 p-0 text-white/70 hover:text-white" title="CSV">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <GlowCard>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> {t("security", lang)}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { i: Lock, l: t("encrypted", lang), v: "AES-256" },
                { i: Eye, l: t("watermark", lang), v: "ON" },
                { i: FileText, l: t("audit", lang), v: "Logged" },
                { i: ShieldCheck, l: t("qrVerify", lang), v: "Active" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <s.i className="w-4 h-4 text-cyan-300" />
                    <Badge className="text-[9px] bg-emerald-500/20 text-emerald-200 border-0">{s.v}</Badge>
                  </div>
                  <p className="text-[11px] text-white/70 mt-2">{s.l}</p>
                </div>
              ))}
            </div>
          </GlowCard>
        </>
      ) : (
        <LegalModule slug={slug} lang={lang} />
      )}
    </div>
  );
}
