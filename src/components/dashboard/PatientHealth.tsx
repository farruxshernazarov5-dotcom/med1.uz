import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Heart, Activity, Scale, Droplets, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: "Kam vazn", color: "text-blue-500" };
  if (bmi < 25) return { label: "Normal", color: "text-green-500" };
  if (bmi < 30) return { label: "Ortiqcha vazn", color: "text-yellow-500" };
  return { label: "Semizlik", color: "text-red-500" };
};

const PatientHealth = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // BMI calculator state
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // Blood pressure state
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("health_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(50);
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const bmi = height && weight ? (parseFloat(weight) / (parseFloat(height) / 100) ** 2) : null;
  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  const saveBMI = async () => {
    if (!user || !bmi) return;
    await supabase.from("health_records").insert({
      user_id: user.id,
      record_type: "bmi",
      value: { height: parseFloat(height), weight: parseFloat(weight), bmi: Math.round(bmi * 10) / 10 },
      recorded_at: new Date().toISOString(),
    });
    toast({ title: "BMI saqlandi ✅" });
    fetchRecords();
  };

  const saveBP = async () => {
    if (!user || !systolic || !diastolic) return;
    await supabase.from("health_records").insert({
      user_id: user.id,
      record_type: "blood_pressure",
      value: { systolic: parseInt(systolic), diastolic: parseInt(diastolic) },
      recorded_at: new Date().toISOString(),
    });
    toast({ title: "Qon bosimi saqlandi ✅" });
    setSystolic("");
    setDiastolic("");
    fetchRecords();
  };

  const deleteRecord = async (id: string) => {
    await supabase.from("health_records").delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const bmiRecords = records.filter((r) => r.record_type === "bmi");
  const bpRecords = records.filter((r) => r.record_type === "blood_pressure");

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">📊 Sog'liq monitoringi</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* BMI Calculator */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">BMI Kalkulyator</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">Bo'y (sm)</Label>
              <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vazn (kg)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
            </div>
          </div>
          {bmi && bmiInfo && (
            <div className="bg-muted/50 rounded-xl p-4 mb-3">
              <p className="text-3xl font-bold text-foreground mb-1">{Math.round(bmi * 10) / 10}</p>
              <p className={cn("text-sm font-medium", bmiInfo.color)}>{bmiInfo.label}</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full bg-hero-gradient transition-all"
                  style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
          <Button onClick={saveBMI} disabled={!bmi} size="sm" className="bg-hero-gradient text-primary-foreground border-0">
            <Plus className="w-3 h-3 mr-1" /> Saqlash
          </Button>
        </div>

        {/* Blood Pressure */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-foreground">Qon bosimi</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label className="text-xs text-muted-foreground">Sistolik (yuqori)</Label>
              <Input type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} placeholder="120" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Diastolik (pastki)</Label>
              <Input type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} placeholder="80" />
            </div>
          </div>
          {systolic && diastolic && (
            <div className="bg-muted/50 rounded-xl p-4 mb-3">
              <p className="text-3xl font-bold text-foreground">{systolic}/{diastolic}</p>
              <p className={cn("text-sm font-medium",
                parseInt(systolic) <= 120 && parseInt(diastolic) <= 80 ? "text-green-500" :
                parseInt(systolic) <= 140 && parseInt(diastolic) <= 90 ? "text-yellow-500" : "text-red-500"
              )}>
                {parseInt(systolic) <= 120 && parseInt(diastolic) <= 80 ? "Normal" :
                 parseInt(systolic) <= 140 && parseInt(diastolic) <= 90 ? "Biroz yuqori" : "Yuqori bosim"}
              </p>
            </div>
          )}
          <Button onClick={saveBP} disabled={!systolic || !diastolic} size="sm" className="bg-hero-gradient text-primary-foreground border-0">
            <Plus className="w-3 h-3 mr-1" /> Saqlash
          </Button>
        </div>
      </div>

      {/* History */}
      <h3 className="font-heading text-lg font-bold text-foreground mb-4">Yozuvlar tarixi</h3>
      {loading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Hali yozuvlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.slice(0, 20).map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {r.record_type === "bmi" ? <Scale className="w-4 h-4 text-primary" /> : <Droplets className="w-4 h-4 text-red-500" />}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.record_type === "bmi"
                      ? `BMI: ${r.value?.bmi} (${r.value?.height}sm / ${r.value?.weight}kg)`
                      : `${r.value?.systolic}/${r.value?.diastolic} mmHg`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{new Date(r.recorded_at).toLocaleDateString("uz-UZ")}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(r.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHealth;
