import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCcw, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";

interface Issue { severity: "error" | "warning"; area: string; message: string }
interface Report {
  checked_at: string;
  status: "ok" | "warning" | "error";
  issues: Issue[];
  sitemaps: { file: string; urls: number; status: number }[];
  robots: { ok: boolean; hasSitemap: boolean };
  structured: { url: string; types: string[]; canonical: string | null; title: string | null }[];
  search_console: any;
  alert?: { sent?: boolean; reason?: string };
}

export default function SeoMonitorPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-monitor", { body: { alert: true } });
      if (error) throw error;
      setReport(data as Report);
      const errs = (data as Report).issues.filter((i) => i.severity === "error").length;
      toast[errs ? "error" : "success"](
        errs ? `${errs} ta SEO xatosi aniqlandi` : "SEO holati normal",
      );
    } catch (e) {
      toast.error("Tekshiruv bajarilmadi", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="SEO Monitoring — Med1.uz Admin" description="Sitemap, robots.txt, structured data va Google Search Console indeksatsiya holati." path="/admin/seo-monitor" noindex />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Search className="w-6 h-6 text-primary" /> SEO Monitoring</h1>
            <p className="text-sm text-muted-foreground">Sitemap, robots.txt, structured data va Search Console indeksatsiya nazorati</p>
          </div>
          <Button onClick={run} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Tekshirish
          </Button>
        </div>

        {report && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {report.status === "ok"
                    ? <><CheckCircle2 className="w-4 h-4 text-green-600" /> Holat: normal</>
                    : <><AlertTriangle className="w-4 h-4 text-amber-600" /> Holat: {report.status}</>}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tekshirildi: {new Date(report.checked_at).toLocaleString("uz-UZ")}
                {report.alert?.sent && <Badge variant="secondary" className="ml-2">Telegram alert yuborildi</Badge>}
              </CardContent>
            </Card>

            {report.issues.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Aniqlangan muammolar ({report.issues.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {report.issues.map((i, k) => (
                    <div key={k} className="flex items-start gap-2 text-sm">
                      <Badge variant={i.severity === "error" ? "destructive" : "secondary"}>{i.area}</Badge>
                      <span className="text-muted-foreground">{i.message}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Sitemap fayllari</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {report.sitemaps.map((s) => (
                  <div key={s.file} className="flex justify-between border-b py-1 last:border-0">
                    <span>{s.file}</span>
                    <span className="text-muted-foreground">{s.urls} URL · HTTP {s.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Structured data / canonical</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {report.structured.map((s) => (
                  <div key={s.url} className="border-b py-1 last:border-0">
                    <div className="font-medium break-all">{s.url}</div>
                    <div className="text-muted-foreground text-xs">
                      JSON-LD: {s.types.join(", ") || "—"} · canonical: {s.canonical ?? "—"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Google Search Console</CardTitle></CardHeader>
              <CardContent className="text-sm">
                {report.search_console?.available ? (
                  <div className="space-y-2">
                    <div className="text-muted-foreground">Property: {report.search_console.siteUrl}</div>
                    {(report.search_console.sitemaps ?? []).map((s: any) => (
                      <div key={s.path} className="flex justify-between border-b py-1 last:border-0">
                        <span className="break-all">{s.path}</span>
                        <span className="text-muted-foreground">{s.errors ?? 0} xato · {s.warnings ?? 0} ogohl.</span>
                      </div>
                    ))}
                    {(report.search_console.inspections ?? []).map((i: any) => (
                      <div key={i.url} className="text-xs text-muted-foreground">
                        {i.url}: {i.verdict} · {i.coverageState}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {report.search_console?.candidates
                      ? `Bir nechta property topildi: ${report.search_console.candidates.join(", ")}`
                      : report.search_console?.reason ?? "Ma'lumot yo'q"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!report && !loading && (
          <p className="text-sm text-muted-foreground">Tekshiruvni boshlash uchun “Tekshirish” tugmasini bosing.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
