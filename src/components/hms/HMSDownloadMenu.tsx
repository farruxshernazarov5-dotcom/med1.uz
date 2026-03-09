import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadHMSReportHTML, downloadHMSReportCSV, downloadHMSReportTXT } from "@/utils/downloadHMSReport";
import type { HMSReportData } from "@/utils/downloadHMSReport";

interface Props {
  data: HMSReportData;
  className?: string;
}

const HMSDownloadMenu = ({ data, className }: Props) => {
  const [open, setOpen] = useState(false);

  const formats = [
    {
      icon: FileText,
      label: "PDF / Chop etish",
      desc: "Logo, QR kod, professional shakl",
      color: "text-primary",
      bg: "bg-primary/10",
      action: () => { downloadHMSReportHTML(data); setOpen(false); },
    },
    {
      icon: FileSpreadsheet,
      label: "Excel (CSV)",
      desc: "Jadvallar va ko'rsatkichlar",
      color: "text-green-600",
      bg: "bg-green-500/10",
      action: () => { downloadHMSReportCSV(data); setOpen(false); },
    },
    {
      icon: File,
      label: "Matn (TXT)",
      desc: "Oddiy matn formati",
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      action: () => { downloadHMSReportTXT(data); setOpen(false); },
    },
  ];

  return (
    <div className={cn("relative", className)}>
      <Button size="sm" variant="outline" onClick={() => setOpen(!open)} className="gap-2">
        <Download className="w-4 h-4" />
        Yuklab olish
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-2xl shadow-lg p-2 min-w-[240px]">
            {formats.map((f) => (
              <button
                key={f.label}
                onClick={f.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", f.bg)}>
                  <f.icon className={cn("w-4 h-4", f.color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HMSDownloadMenu;
