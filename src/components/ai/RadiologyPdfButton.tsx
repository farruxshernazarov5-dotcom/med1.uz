import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function RadiologyPdfButton({ title, name, analysis, images }: {
  title: string; name: string; analysis: unknown; images: string[];
}) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { downloadAiReport } = await import("@/lib/vitals/report");
      await downloadAiReport({ title, name, conclusion: JSON.stringify(analysis), images });
    } catch (error) {
      toast({ title: "PDF yaratilmadi", description: error instanceof Error ? error.message : "Qayta urinib ko'ring", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  return <Button variant="outline" disabled={busy} onClick={() => void download()}>
    {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
    {busy ? "PDF tayyorlanmoqda..." : "PDF yuklab olish"}
  </Button>;
}