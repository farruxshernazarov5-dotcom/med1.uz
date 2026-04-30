import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Image as ImageIcon, Upload, Save, Eye, Trash2, FileImage } from "lucide-react";

interface Study {
  id: string; order_id: string; modality: string; body_part: string | null;
  radiologist_id: string | null; technician_id: string | null;
  images: any; findings: string | null; impression: string | null;
  status: string; performed_at: string | null; reported_at: string | null;
}

interface Order {
  id: string; order_number: string; patient_id: string; order_type?: string | null;
}

interface Patient { id: string; full_name: string; }
interface Staff { id: string; full_name: string; role: string; }

interface Props {
  centerId: string;
  orders: Order[];
  patients: Patient[];
  staff: Staff[];
  onReload: () => void;
}

const MODALITIES = ["UZI", "MRT", "KT", "RENTGEN", "EKG", "EEG", "MAMMOGRAFIYA"];

const DiagRadiology = ({ centerId, orders, patients, staff, onReload }: Props) => {
  const { user } = useAuth();
  const [studies, setStudies] = useState<Study[]>([]);
  const [selected, setSelected] = useState<Study | null>(null);
  const [findings, setFindings] = useState("");
  const [impression, setImpression] = useState("");
  const [radiologistId, setRadiologistId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStudies(); }, [centerId]);

  const loadStudies = async () => {
    setLoading(true);
    const { data } = await supabase.from("diagnostics_radiology_studies" as any)
      .select("*").eq("center_id", centerId).order("created_at", { ascending: false }) as any;
    setStudies(data || []);
    setLoading(false);
  };

  const select = (s: Study) => {
    setSelected(s);
    setFindings(s.findings || "");
    setImpression(s.impression || "");
    setRadiologistId(s.radiologist_id || "");
  };

  const uploadImage = async (file: File) => {
    if (!selected || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `radiology/${user.id}/${selected.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("diagnostics-files").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("diagnostics-files").getPublicUrl(path);
      const newImages = [...(Array.isArray(selected.images) ? selected.images : []), { url: publicUrl, path, name: file.name, uploaded_at: new Date().toISOString() }];
      await supabase.from("diagnostics_radiology_studies" as any).update({ images: newImages } as any).eq("id", selected.id);
      toast({ title: "✅ Tasvir yuklandi" });
      setSelected({ ...selected, images: newImages });
      loadStudies();
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (idx: number) => {
    if (!selected) return;
    const imgs = Array.isArray(selected.images) ? [...selected.images] : [];
    const removed = imgs.splice(idx, 1)[0];
    if (removed?.path) await supabase.storage.from("diagnostics-files").remove([removed.path]);
    await supabase.from("diagnostics_radiology_studies" as any).update({ images: imgs } as any).eq("id", selected.id);
    setSelected({ ...selected, images: imgs });
    loadStudies();
  };

  const saveReport = async () => {
    if (!selected) return;
    const update: any = {
      findings, impression,
      radiologist_id: radiologistId || null,
      status: impression ? "reported" : "in_progress",
    };
    if (impression && !selected.reported_at) update.reported_at = new Date().toISOString();
    if (!selected.performed_at) update.performed_at = new Date().toISOString();

    const { error } = await supabase.from("diagnostics_radiology_studies" as any).update(update).eq("id", selected.id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Hisobot saqlandi" });

    if (impression) {
      await supabase.from("diagnostics_lab_orders" as any).update({ status: "completed" } as any).eq("id", selected.order_id);
    }
    loadStudies();
    onReload();
  };

  const aiAssist = async () => {
    if (!selected || !Array.isArray(selected.images) || selected.images.length === 0) {
      toast({ title: "Avval tasvir yuklang", variant: "destructive" }); return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("diag-ai-workflow", {
        body: {
          action: "radiology_assist",
          modality: selected.modality,
          body_part: selected.body_part,
          image_url: selected.images[0]?.url,
        },
      });
      if (error) throw error;
      if (data?.findings) setFindings(data.findings);
      if (data?.impression) setImpression(data.impression);
      toast({ title: "🤖 AI taklifi qo'shildi" });
    } catch (e: any) {
      toast({ title: "AI xatolik", description: e.message, variant: "destructive" });
    }
  };

  const getOrderInfo = (orderId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return { num: "—", patient: "—" };
    return { num: o.order_number, patient: patients.find((p) => p.id === o.patient_id)?.full_name || "—" };
  };

  if (loading) return <p className="text-center text-muted-foreground py-8">Yuklanmoqda...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground">Radiologiya (RIS)</h3>
        <Badge variant="outline">{studies.length} tadqiqot</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Studies list */}
        <div className="space-y-2 lg:col-span-1 max-h-[600px] overflow-y-auto">
          {studies.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Radiologiya buyurtmalari yo'q
            </CardContent></Card>
          ) : studies.map((s) => {
            const info = getOrderInfo(s.order_id);
            return (
              <Card key={s.id} className={`cursor-pointer ${selected?.id === s.id ? "border-primary" : ""}`} onClick={() => select(s)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="text-[10px]">{s.modality}</Badge>
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{info.patient}</p>
                  <p className="text-xs text-muted-foreground">{info.num}</p>
                  {s.body_part && <p className="text-xs text-muted-foreground mt-0.5">{s.body_part}</p>}
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <FileImage className="w-3 h-3" /> {Array.isArray(s.images) ? s.images.length : 0} tasvir
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
              Tadqiqotni tanlang
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{selected.modality} — {getOrderInfo(selected.order_id).patient}</span>
                  <Button size="sm" variant="outline" onClick={aiAssist}>🤖 AI Taklif</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Images */}
                <div>
                  <Label className="mb-2 block">Tasvirlar</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                    {Array.isArray(selected.images) && selected.images.map((img: any, i: number) => (
                      <div key={i} className="relative group">
                        <img src={img.url} alt={img.name} className="w-full h-32 object-cover rounded border" />
                        <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => removeImage(i)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <label className="border-2 border-dashed border-muted rounded h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary text-muted-foreground hover:text-primary text-xs">
                      <Upload className="w-5 h-5 mb-1" />
                      {uploading ? "Yuklanmoqda..." : "Yuklash"}
                      <input type="file" accept="image/*,.dcm" className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Radiolog</Label>
                  <select value={radiologistId} onChange={(e) => setRadiologistId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="">Tanlang...</option>
                    {staff.filter((s) => s.role === "radiolog" || s.role === "shifokor").map((s) =>
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    )}
                  </select>
                </div>

                <div>
                  <Label>Topilmalar (Findings)</Label>
                  <Textarea value={findings} onChange={(e) => setFindings(e.target.value)} rows={4} className="mt-1" placeholder="Tasvirda kuzatilgan o'zgarishlar..." />
                </div>

                <div>
                  <Label>Xulosa (Impression)</Label>
                  <Textarea value={impression} onChange={(e) => setImpression(e.target.value)} rows={3} className="mt-1" placeholder="Diagnostik xulosa va tavsiyalar..." />
                </div>

                <Button onClick={saveReport} className="w-full">
                  <Save className="w-4 h-4 mr-2" /> Hisobotni saqlash
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagRadiology;
