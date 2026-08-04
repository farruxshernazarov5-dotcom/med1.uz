import { Link } from "react-router-dom";
import { ArrowLeft, Download, FileCheck2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownView } from "@/lib/markdownRender";

interface Props {
  title: string;
  subtitle: string;
  edition?: string;
  source: string;
  pdfUrl: string;
  pdfName: string;
  backLabel?: string;
  officialLabel?: string;
  printLabel?: string;
  footerNote?: string;
  toolbar?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Renders an official, legally binding MED1.UZ document
 * with PDF download and print support.
 */
export const OfficialDocument = ({
  title,
  subtitle,
  edition = "Tahrir 1.0",
  source,
  pdfUrl,
  pdfName,
  backLabel = "Bosh sahifa",
  officialLabel = "Rasmiy hujjat",
  printLabel = "Chop etish",
  footerNote,
  toolbar,
  children,
}: Props) => (

  <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="gap-1"><FileCheck2 className="w-3 h-3" /> {officialLabel}</Badge>
            <Badge variant="secondary">{edition}</Badge>
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {toolbar}
          <Button asChild size="sm">
            <a href={pdfUrl} download={pdfName} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-1" /> PDF
            </a>
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> {printLabel}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 md:p-8 shadow-card">
        <MarkdownView source={source} className="text-sm text-foreground leading-relaxed" />
      </div>

      {children}

      <p className="text-xs text-muted-foreground mt-6">
        {footerNote ??
          `"MED-ALL AI SYSTEM" MChJ · STIR 312972027 · info@med1.uz · +998 99 214 41 03. Ushbu matn o'zbek tilida asosiy hisoblanadi va saytdagi barcha hujjatlar shu asosda yuritiladi.`}
      </p>

    </div>
  </div>
);

export default OfficialDocument;
