import { useState } from "react";
import { QrCode, FlaskConical, Stethoscope, FileCheck, Send, Download, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface LabResult {
  id: string;
  qrCode: string;
  testName: string;
  clinic: string;
  doctor: string;
  date: string;
  status: "pending" | "ready" | "viewed";
  recommendation?: string;
  results?: { param: string; value: string; norm: string; status: "normal" | "high" | "low" }[];
}

const mockResults: LabResult[] = [
  {
    id: "LAB-2026-001",
    qrCode: "QR-A1B2C3",
    testName: "Umumiy qon tahlili (OAK)",
    clinic: "Med Life klinikasi",
    doctor: "Dr. Alisher Karimov",
    date: "2026-03-27",
    status: "ready",
    recommendation: "Gemoglobin biroz past. Temir preparatlari va vitaminlar qabul qilish tavsiya etiladi. 2 haftadan keyin qayta tekshiruv.",
    results: [
      { param: "Gemoglobin", value: "118 g/L", norm: "120-160", status: "low" },
      { param: "Eritrositlar", value: "4.2 mln", norm: "3.9-5.0", status: "normal" },
      { param: "Leykotsitlar", value: "6.8 ming", norm: "4.0-9.0", status: "normal" },
      { param: "Trombositlar", value: "245 ming", norm: "180-320", status: "normal" },
      { param: "ECHT", value: "12 mm/s", norm: "2-15", status: "normal" },
    ],
  },
  {
    id: "LAB-2026-002",
    qrCode: "QR-D4E5F6",
    testName: "Bioximik qon tahlili",
    clinic: "Shifa Diagnostika",
    doctor: "Dr. Nilufar Rahimova",
    date: "2026-03-25",
    status: "viewed",
    recommendation: "Barcha ko'rsatkichlar me'yorda. 6 oy keyin profilaktik tekshiruv tavsiya etiladi.",
    results: [
      { param: "Glukoza", value: "5.2 mmol/L", norm: "3.9-6.1", status: "normal" },
      { param: "Xolesterin", value: "4.8 mmol/L", norm: "3.6-5.2", status: "normal" },
      { param: "ALT", value: "22 U/L", norm: "7-35", status: "normal" },
      { param: "AST", value: "18 U/L", norm: "8-33", status: "normal" },
      { param: "Kreatinin", value: "82 μmol/L", norm: "62-106", status: "normal" },
    ],
  },
  {
    id: "LAB-2026-003",
    qrCode: "QR-G7H8I9",
    testName: "Tireoid gormonlari",
    clinic: "Intermed Plus",
    doctor: "Dr. Sardor Mirzayev",
    date: "2026-03-26",
    status: "pending",
  },
];

const statusMap = {
  pending: { label: "Tayyorlanmoqda", color: "bg-medical-orange/10 text-medical-orange border-medical-orange/30" },
  ready: { label: "Tayyor", color: "bg-medical-green/10 text-medical-green border-medical-green/30" },
  viewed: { label: "Ko'rilgan", color: "bg-primary/10 text-primary border-primary/30" },
};

const PatientMedicalWorkflow = () => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState("");

  const selectedResult = mockResults.find((r) => r.id === selected);

  const searchQR = () => {
    const found = mockResults.find((r) => r.qrCode === qrInput || r.id === qrInput);
    if (found) {
      setSelected(found.id);
      setQrInput("");
    } else {
      toast({ title: "Topilmadi", description: "Ushbu QR kod bo'yicha natija topilmadi", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Steps */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Stethoscope, label: "Qabul", desc: "Shifokorga yozilish" },
          { icon: FlaskConical, label: "Analiz", desc: "Topshirish" },
          { icon: QrCode, label: "QR kod", desc: "Natijaga ulanish" },
          { icon: FileCheck, label: "Natija", desc: "Ko'rish" },
          { icon: Send, label: "Tavsiya", desc: "Shifokordan" },
        ].map((step, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <step.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">{step.label}</p>
            <p className="text-[10px] text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* QR Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary flex-shrink-0" />
            <input
              type="text"
              placeholder="QR kod yoki analiz raqamini kiriting..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchQR()}
              className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" onClick={searchQR}>
              Qidirish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results List */}
      <div className="grid gap-3">
        {mockResults.map((r) => {
          const st = statusMap[r.status];
          return (
            <Card
              key={r.id}
              className={`cursor-pointer transition-all hover:shadow-card-hover ${
                selected === r.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelected(r.id)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FlaskConical className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{r.testName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.clinic} • {r.doctor}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.date} • {r.id}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={st.color}>
                    {st.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail View */}
      {selectedResult && selectedResult.results && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              {selectedResult.testName} — Natijalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Ko'rsatkich</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Natija</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Me'yor</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedResult.results.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 text-foreground">{row.param}</td>
                      <td className="py-2 font-medium text-foreground">{row.value}</td>
                      <td className="py-2 text-muted-foreground">{row.norm}</td>
                      <td className="py-2">
                        <Badge
                          variant="outline"
                          className={
                            row.status === "normal"
                              ? "bg-medical-green/10 text-medical-green border-medical-green/30"
                              : row.status === "high"
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : "bg-medical-orange/10 text-medical-orange border-medical-orange/30"
                          }
                        >
                          {row.status === "normal" ? "Me'yorda" : row.status === "high" ? "Yuqori" : "Past"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Doctor Recommendation */}
            {selectedResult.recommendation && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="font-heading font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" /> Shifokor tavsiyasi
                </h4>
                <p className="text-sm text-muted-foreground">{selectedResult.recommendation}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast({ title: "Yuklab olinmoqda", description: "PDF tayyorlanmoqda..." })
                }
              >
                <Download className="w-3.5 h-3.5 mr-1" /> PDF yuklab olish
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast({ title: "QR kod", description: `QR: ${selectedResult.qrCode}` })
                }
              >
                <QrCode className="w-3.5 h-3.5 mr-1" /> QR ko'rish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientMedicalWorkflow;
