import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Phone, Mail, Calendar, Activity, FlaskConical,
  FileText, Pill, ImageIcon, Heart, Plus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  patient: any | null;
  doctorId: string;
  open: boolean;
  onClose: () => void;
}

const Section = ({ icon: Icon, title, count, children }: any) => (
  <div className="bg-card rounded-xl border border-border p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm">
        <Icon className="w-4 h-4" /> {title}
      </h3>
      <Badge variant="secondary">{count}</Badge>
    </div>
    {children}
  </div>
);

const DocPatient360 = ({ patient, doctorId, open, onClose }: Props) => {
  const [records, setRecords] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [appts, setAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patient || !open) return;
    setLoading(true);
    (async () => {
      const [r, l, p, f, a] = await Promise.all([
        supabase.from("doctor_records").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
        supabase.from("doctor_lab_orders").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
        supabase.from("doctor_treatment_plans").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
        supabase.from("doctor_files").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false }),
        patient.phone ? supabase.from("appointments").select("*").eq("doctor_id", doctorId).eq("patient_phone", patient.phone).order("appointment_date", { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      ]);
      setRecords(r.data || []);
      setLabs(l.data || []);
      setPlans(p.data || []);
      setFiles(f.data || []);
      setAppts(a.data || []);
      setLoading(false);
    })();

    // realtime
    const ch = supabase.channel(`patient360-${patient.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_records", filter: `patient_id=eq.${patient.id}` }, () => reloadRecords())
      .on("postgres_changes", { event: "*", schema: "public", table: "doctor_lab_orders", filter: `patient_id=eq.${patient.id}` }, () => reloadLabs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [patient?.id, open, doctorId]);

  const reloadRecords = async () => {
    const { data } = await supabase.from("doctor_records").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false });
    setRecords(data || []);
  };
  const reloadLabs = async () => {
    const { data } = await supabase.from("doctor_lab_orders").select("*").eq("doctor_id", doctorId).eq("patient_id", patient.id).order("created_at", { ascending: false });
    setLabs(data || []);
  };

  const quickLabOrder = async () => {
    const tests = prompt("Tahlillar (vergul bilan ajrating):");
    if (!tests?.trim()) return;
    const { error } = await supabase.from("doctor_lab_orders").insert({
      doctor_id: doctorId, patient_id: patient.id, patient_name: patient.full_name,
      tests: tests.split(",").map((t) => t.trim()).filter(Boolean),
      status: "pending", urgency: "normal",
    });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else toast({ title: "✅ Analiz buyurtma qilindi" });
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="font-bold text-lg">{patient.full_name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal mt-1">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{patient.phone}</span>
                {patient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{patient.email}</span>}
                {patient.blood_group && <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" />{patient.blood_group}</span>}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-secondary/10 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Tashriflar</p>
            <p className="font-bold text-foreground">{patient.total_visits || 0}</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Analizlar</p>
            <p className="font-bold text-foreground">{patient.total_lab_orders || 0}</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Yozuvlar</p>
            <p className="font-bold text-foreground">{patient.total_records || 0}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Retseptlar</p>
            <p className="font-bold text-foreground">{patient.total_prescriptions || 0}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={quickLabOrder}>
            <FlaskConical className="w-4 h-4 mr-1" /> Tez analiz
          </Button>
        </div>

        <Tabs defaultValue="timeline" className="mt-2">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="timeline">Tarix</TabsTrigger>
            <TabsTrigger value="records">Tashxislar ({records.length})</TabsTrigger>
            <TabsTrigger value="labs">Analizlar ({labs.length})</TabsTrigger>
            <TabsTrigger value="plans">Davolash ({plans.length})</TabsTrigger>
            <TabsTrigger value="files">Fayllar ({files.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-3 mt-4">
            {[...records.map((r) => ({ ...r, _type: "record" })), ...labs.map((l) => ({ ...l, _type: "lab" })), ...appts.map((a) => ({ ...a, _type: "appt" }))]
              .sort((a, b) => new Date(b.created_at || b.appointment_date).getTime() - new Date(a.created_at || a.appointment_date).getTime())
              .slice(0, 30)
              .map((item: any) => (
                <div key={`${item._type}-${item.id}`} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    {item._type === "record" && <FileText className="w-4 h-4 text-blue-500" />}
                    {item._type === "lab" && <FlaskConical className="w-4 h-4 text-amber-500" />}
                    {item._type === "appt" && <Calendar className="w-4 h-4 text-secondary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item._type === "record" && (item.diagnosis || "Tashxis")}
                      {item._type === "lab" && (item.tests?.join(", ") || "Analiz")}
                      {item._type === "appt" && `Qabul (${item.status})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at || item.appointment_date).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                </div>
              ))}
            {records.length + labs.length + appts.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8 text-sm">Hali yozuvlar yo'q</p>
            )}
          </TabsContent>

          <TabsContent value="records" className="space-y-2 mt-4">
            {records.map((r) => (
              <div key={r.id} className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">{r.diagnosis}</p>
                {r.icd_code && <Badge variant="outline" className="mt-1 text-xs">{r.icd_code}</Badge>}
                {r.symptoms && <p className="text-xs text-muted-foreground mt-1">{r.symptoms}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("uz-UZ")}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="labs" className="space-y-2 mt-4">
            {labs.map((l) => (
              <div key={l.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{l.tests?.join(", ")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("uz-UZ")}</p>
                </div>
                <Badge>{l.status}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="plans" className="space-y-2 mt-4">
            {plans.map((p) => (
              <div key={p.id} className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">{p.title}</p>
                <Badge variant="outline" className="mt-1 text-xs">{p.status}</Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="files" className="space-y-2 mt-4">
            {files.map((f) => (
              <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className="block p-3 bg-muted/30 rounded-lg hover:bg-muted transition-colors">
                <p className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> {f.file_name}
                </p>
                <p className="text-xs text-muted-foreground">{f.category}</p>
              </a>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DocPatient360;
