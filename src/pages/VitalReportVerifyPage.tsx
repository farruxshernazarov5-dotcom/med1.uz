import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, BadgeCheck, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

type Row = { code: string; content_hash: string; created_at: string };

const VitalReportVerifyPage = () => {
  const { code = "" } = useParams();
  const id = decodeURIComponent(code).trim().toUpperCase();
  const [row, setRow] = useState<Row | null | undefined>(undefined);

  useEffect(() => {
    supabase.rpc("verify_vital_report", { _code: id }).then(({ data, error }) => setRow(error ? null : ((data as Row[])?.[0] ?? null)));
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Vital AI xulosasini tekshirish" description="Med1.uz Vital AI PDF xulosasining haqiqiyligini tekshirish." path={`/verify/vital/${id}`} />
      <Header />
      <main className="container mx-auto flex min-h-[65vh] items-center justify-center px-4 py-12">
        <section className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-card">
          <div className={`flex items-center gap-3 border-b border-border p-6 ${row ? "bg-primary/5" : "bg-destructive/5"}`}>
            {row ? <BadgeCheck className="h-10 w-10 text-primary" /> : <XCircle className="h-10 w-10 text-destructive" />}
            <div>
              <p className="text-sm text-muted-foreground">Med AI · Vital xulosa verifikatsiyasi</p>
              <h1 className="text-2xl font-bold text-foreground">
                {row === undefined ? "Tekshirilmoqda…" : row ? "Xulosa haqiqiy" : "Xulosa topilmadi"}
              </h1>
            </div>
          </div>
          <div className="space-y-3 p-6 text-sm">
            <p><span className="text-muted-foreground">Hujjat raqami: </span><b>{id}</b></p>
            {row && (
              <>
                <p><span className="text-muted-foreground">Yaratilgan: </span>{new Date(row.created_at).toLocaleString("uz-UZ")}</p>
                <p className="break-all"><span className="text-muted-foreground">Raqamli imzo (SHA-256): </span><code>{row.content_hash}</code></p>
                <p className="text-muted-foreground">PDF pastidagi imzo shu qatorning boshi bilan mos kelishi kerak. Bemor ma'lumotlari maxfiylik uchun bu yerda ko'rsatilmaydi.</p>
              </>
            )}
            <div className="flex gap-2 rounded-md border border-border bg-muted p-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <p>Bu tashxis emas. Vital AI kamera o'lchovlari taxminiy bo'lib, shifokor ko'rigi o'rnini bosmaydi.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default VitalReportVerifyPage;
