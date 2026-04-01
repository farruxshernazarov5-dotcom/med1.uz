import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Shield, CheckCircle, XCircle, FileText, Calendar, Globe, Loader2, Building2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const ReportVerificationPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);

  useEffect(() => {
    if (!reportId) { setLoading(false); return; }
    const verify = async () => {
      const { data } = await supabase
        .from("document_verifications")
        .select("*")
        .eq("verification_code", reportId)
        .maybeSingle();
      setDoc(data);
      // Increment scan count
      if (data) {
        await supabase.from("document_verifications")
          .update({ scanned_count: (data.scanned_count || 0) + 1 } as any)
          .eq("id", data.id);
      }
      setLoading(false);
    };
    verify();
  }, [reportId]);

  const isValid = doc?.status === "valid";
  const docTypeLabels: Record<string, string> = {
    lab_result: "Laboratoriya natijasi",
    prescription: "Retsept",
    invoice: "To'lov cheki",
    appointment: "Qabul hujjati",
    emr: "Tibbiy karta",
    discharge: "Chiqish hujjati",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            loading ? "bg-muted" : isValid ? "bg-primary/10" : "bg-destructive/10"
          }`}>
            {loading ? <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" /> :
             isValid ? <Shield className="w-10 h-10 text-primary" /> :
             <XCircle className="w-10 h-10 text-destructive" />}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Hujjat Verifikatsiyasi
          </h1>
          <p className="text-muted-foreground">
            Med1.uz — tibbiy hujjat tekshiruv tizimi
          </p>
        </div>

        {loading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Tekshirilmoqda...</CardContent></Card>
        ) : doc ? (
          <>
            <Card className={`border-2 mb-6 ${isValid ? "border-primary/30" : "border-destructive/30"}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  {isValid ? <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" /> :
                   <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />}
                  <div>
                    <p className="font-semibold text-foreground">
                      {isValid ? "Hujjat tasdiqlangan ✓" : "Hujjat yaroqsiz ✗"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isValid ? "Ushbu hujjat Med1.uz tizimi orqali rasmiy yaratilgan" : `Status: ${doc.status}`}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Hujjat turi</p>
                      <p className="font-semibold text-foreground">{docTypeLabels[doc.document_type] || doc.document_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Verifikatsiya kodi</p>
                      <p className="font-mono font-semibold text-foreground text-sm">{doc.verification_code}</p>
                    </div>
                  </div>

                  {doc.patient_name && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <User className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Bemor</p>
                        <p className="font-semibold text-foreground">{doc.patient_name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Yaratilgan sana</p>
                      <p className="font-semibold text-foreground">
                        {new Date(doc.document_date || doc.created_at).toLocaleDateString("uz-UZ")}
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

                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {doc.scanned_count || 0} marta tekshirilgan
                  </Badge>
                  <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
                    {isValid ? "✓ Haqiqiy" : "✗ Yaroqsiz"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-destructive/30">
            <CardContent className="p-6 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Hujjat topilmadi</h3>
              <p className="text-sm text-muted-foreground">
                Ushbu verifikatsiya kodi bo'yicha hujjat topilmadi: <span className="font-mono">{reportId}</span>
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-yellow-500/30 bg-yellow-500/5 mt-4">
          <CardContent className="p-4">
            <p className="text-sm text-foreground leading-relaxed">
              ⚠️ <strong>Eslatma:</strong> Ushbu tizim hujjatlarning haqiqiyligini tasdiqlash uchun mo'ljallangan.
              Tibbiy hujjatlar professional tibbiy maslahat o'rnini bosmaydi.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReportVerificationPage;
