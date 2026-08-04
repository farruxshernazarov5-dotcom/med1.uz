import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import OfficialDocument from "@/components/legal/OfficialDocument";
import { getLegalDoc, type LegalDocId } from "@/data/legal/registry";
import { useLanguage, LANGUAGE_LABELS } from "@/hooks/useLanguage";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";

const UI: Record<SupportedLanguage, { back: string; official: string; print: string; footer: string }> = {
  uz: {
    back: "Bosh sahifa",
    official: "Rasmiy hujjat",
    print: "Chop etish",
    footer:
      '"MED-ALL AI SYSTEM" MChJ · STIR 312972027 · info@med1.uz · +998 99 214 41 03. Hujjat uch tilda (UZ/RU/EN) yuritiladi; nizo yuzaga kelganda o\'zbek tilidagi matn asosiy hisoblanadi.',
  },
  ru: {
    back: "На главную",
    official: "Официальный документ",
    print: "Печать",
    footer:
      'ООО "MED-ALL AI SYSTEM" · ИНН 312972027 · info@med1.uz · +998 99 214 41 03. Документ ведётся на трёх языках (UZ/RU/EN); при разночтениях приоритет имеет текст на узбекском языке.',
  },
  en: {
    back: "Home",
    official: "Official document",
    print: "Print",
    footer:
      "MED-ALL AI SYSTEM LLC · TIN 312972027 · info@med1.uz · +998 99 214 41 03. The document is maintained in three languages (UZ/RU/EN); in case of discrepancies the Uzbek text prevails.",
  },
};

/** Official legal document rendered in the currently selected UI language. */
export const LocalizedLegalDocument = ({ docId }: { docId: LegalDocId }) => {
  const { lang, setLanguage } = useLanguage();
  const doc = getLegalDoc(docId, lang);
  const ui = UI[lang] ?? UI.uz;

  return (
    <OfficialDocument
      title={doc.title}
      subtitle={doc.subtitle}
      edition={doc.edition}
      source={doc.source}
      pdfUrl={doc.pdfUrl}
      pdfName={doc.pdfName}
      backLabel={ui.back}
      officialLabel={ui.official}
      printLabel={ui.print}
      footerNote={ui.footer}
      toolbar={
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <Languages className="w-4 h-4 text-muted-foreground ml-1" />
          {SUPPORTED_LANGUAGES.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={l === lang ? "default" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setLanguage(l)}
            >
              {LANGUAGE_LABELS[l].code}
            </Button>
          ))}
        </div>
      }
    />
  );
};

export default LocalizedLegalDocument;
