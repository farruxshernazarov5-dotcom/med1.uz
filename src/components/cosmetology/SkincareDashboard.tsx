import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Calendar, Droplets, Sun, Shield, Activity } from "lucide-react";

interface ScanResult {
  date: string;
  score: number;
  skinType: string;
  concerns: string[];
}

interface Props {
  scanHistory: ScanResult[];
  latestResult: string | null;
  onNewScan: () => void;
}

const SkincareDashboard = ({ scanHistory, latestResult, onNewScan }: Props) => {
  const latest = scanHistory[scanHistory.length - 1];
  const previous = scanHistory.length > 1 ? scanHistory[scanHistory.length - 2] : null;
  const improvement = previous ? latest.score - previous.score : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{latest?.score || "—"}</p>
            <p className="text-xs text-muted-foreground">Teri sog'ligi bali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Droplets className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{latest?.skinType || "—"}</p>
            <p className="text-xs text-muted-foreground">Teri turi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className={`w-6 h-6 mx-auto mb-1 ${improvement >= 0 ? "text-emerald-500" : "text-red-500"}`} />
            <p className="text-2xl font-bold text-foreground">{improvement > 0 ? `+${improvement}` : improvement || "—"}</p>
            <p className="text-xs text-muted-foreground">O'zgarish</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{scanHistory.length}</p>
            <p className="text-xs text-muted-foreground">Jami skanlar</p>
          </CardContent>
        </Card>
      </div>

      {/* Skincare routine reminder */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Kundalik parvarish eslatmasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-xs font-medium text-foreground">Ertalab</p>
                <p className="text-[10px] text-muted-foreground">Cleanser → Toner → Serum → SPF</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
              <Shield className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-foreground">Kechqurun</p>
                <p className="text-[10px] text-muted-foreground">Remover → Cleanser → Treatment</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs font-medium text-foreground">Haftalik</p>
                <p className="text-[10px] text-muted-foreground">Peeling + Maska</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress history */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Teri progress tarixi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scanHistory.map((scan, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{scan.date}</span>
                  <div className="flex-1">
                    <Progress value={scan.score} className="h-3" />
                  </div>
                  <span className="text-sm font-bold text-foreground w-10 text-right">{scan.score}</span>
                  {i > 0 && (
                    <Badge variant={scan.score >= scanHistory[i - 1].score ? "default" : "destructive"} className="text-xs">
                      {scan.score >= scanHistory[i - 1].score ? "↑" : "↓"} {Math.abs(scan.score - scanHistory[i - 1].score)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {scanHistory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Scan className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Hali teri skaneri ishlatilmagan</p>
            <Button onClick={onNewScan}>Birinchi skanerni boshlash</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Need this import for the icon used in empty state
import { Scan } from "lucide-react";

export default SkincareDashboard;
