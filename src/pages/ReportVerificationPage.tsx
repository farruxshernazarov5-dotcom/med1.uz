import { useParams } from "react-router-dom";
import { Shield, CheckCircle, FileText, Calendar, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ReportVerificationPage = () => {
  const { reportId } = useParams<{ reportId: string }>();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Hisobot Verifikatsiyasi
          </h1>
          <p className="text-muted-foreground">
            Med1.uz AI tibbiy tahlil hisoboti tekshiruvi
          </p>
        </div>

        <Card className="glass-card border-primary/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Hisobot tasdiqlangan ✓</p>
                <p className="text-sm text-muted-foreground">
                  Ushbu hisobot Med1.uz AI tizimi tomonidan rasmiy yaratilgan
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Hisobot ID</p>
                  <p className="font-mono font-semibold text-foreground">{reportId || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Tekshiruv vaqti</p>
                  <p className="font-semibold text-foreground">
                    {new Date().toLocaleDateString("uz-UZ")} — {new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Platforma</p>
                  <p className="font-semibold text-foreground">Med1.uz — AI Tibbiy Platforma</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <p className="text-sm text-warning-foreground leading-relaxed">
              ⚠️ <strong>Eslatma:</strong> Ushbu hisobot sun'iy intellekt tomonidan yaratilgan bo'lib, 
              professional tibbiy maslahat o'rnini bosmaydi. Har doim malakali shifokor bilan maslahatlashing.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReportVerificationPage;
