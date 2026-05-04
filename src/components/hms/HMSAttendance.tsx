import { useEffect, useState, useMemo } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { QrCode, MapPin, RefreshCw, Save, Users, Clock, AlertTriangle, Download } from "lucide-react";
import { format } from "date-fns";

interface Props { clinicId: string; }

const HMSAttendance = ({ clinicId }: Props) => {
  const [tab, setTab] = useState("today");
  const [settings, setSettings] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [qrToken, setQrToken] = useState<{ token: string; expires_at: string } | null>(null);
  const [qrImg, setQrImg] = useState<string>("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterStaff, setFilterStaff] = useState<string>("");

  const fetchAll = async () => {
    const [{ data: s }, { data: st }, { data: rec }] = await Promise.all([
      supabase.from("hms_attendance_settings").select("*").eq("clinic_id", clinicId).maybeSingle(),
      supabase.from("hms_staff").select("*").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_attendance").select("*").eq("clinic_id", clinicId).order("attendance_date", { ascending: false }).limit(500),
    ]);
    setSettings(s || { clinic_id: clinicId, radius_m: 100, work_start: "09:00", work_end: "18:00", late_threshold_min: 10, qr_rotate_seconds: 60, enforce_geo: true, enforce_qr: true });
    setStaff(st || []);
    setRecords(rec || []);
  };

  useEffect(() => { fetchAll(); }, [clinicId]);

  const saveSettings = async () => {
    const payload = { ...settings, clinic_id: clinicId };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const { error } = await supabase.from("hms_attendance_settings").upsert(payload, { onConflict: "clinic_id" });
    if (error) return toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    toast({ title: "✅ Saqlandi" });
    fetchAll();
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => setSettings((s: any) => ({ ...s, location_lat: p.coords.latitude, location_lng: p.coords.longitude })),
      (e) => toast({ title: "GPS xatosi", description: e.message, variant: "destructive" })
    );
  };

  const generateQr = async () => {
    const { data, error } = await supabase.functions.invoke("attendance-qr", { body: { clinic_id: clinicId } });
    if (error || data?.error) return toast({ title: "Xatolik", description: data?.error || error?.message, variant: "destructive" });
    setQrToken({ token: data.token, expires_at: data.expires_at });
    const img = await QRCode.toDataURL(data.token, { width: 320, margin: 2 });
    setQrImg(img);
  };

  // auto-rotate
  useEffect(() => {
    if (tab !== "qr") return;
    generateQr();
    const interval = setInterval(generateQr, (settings?.qr_rotate_seconds ?? 60) * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, settings?.qr_rotate_seconds]);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecs = records.filter((r) => r.attendance_date === today);
  const lateCount = todayRecs.filter((r) => r.is_late).length;
  const presentCount = todayRecs.filter((r) => r.check_in).length;
  const absentCount = staff.length - presentCount;

  const filtered = useMemo(() => {
    return records.filter((r) => (!filterDate || r.attendance_date === filterDate) && (!filterStaff || r.staff_id === filterStaff));
  }, [records, filterDate, filterStaff]);

  const staffName = (id: string) => staff.find((s) => s.id === id)?.full_name || "—";

  const exportCsv = () => {
    const rows = [["Sana", "Xodim", "Check-in", "Check-out", "Kechikish", "Ishlangan (daq)", "Status"]];
    filtered.forEach((r) => rows.push([
      r.attendance_date,
      staffName(r.staff_id),
      r.check_in ? format(new Date(r.check_in), "HH:mm") : "",
      r.check_out ? format(new Date(r.check_out), "HH:mm") : "",
      r.is_late ? `${r.late_minutes}` : "0",
      `${r.worked_minutes || 0}`,
      r.status || "",
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${filterDate}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Attendance — Keldi-Ketdi</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="today">Bugun</TabsTrigger>
          <TabsTrigger value="list">Yozuvlar</TabsTrigger>
          <TabsTrigger value="qr">QR Kod</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Jami xodim</div><div className="text-2xl font-bold">{staff.length}</div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Keldi</div><div className="text-2xl font-bold text-emerald-600">{presentCount}</div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Kechikkan</div><div className="text-2xl font-bold text-amber-600">{lateCount}</div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Kelmagan</div><div className="text-2xl font-bold text-rose-600">{absentCount}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Bugungi xodimlar</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Xodim</TableHead><TableHead>Check-in</TableHead><TableHead>Check-out</TableHead><TableHead>Holat</TableHead></TableRow></TableHeader>
                <TableBody>
                  {staff.map((s) => {
                    const r = todayRecs.find((x) => x.staff_id === s.id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell>{r?.check_in ? format(new Date(r.check_in), "HH:mm") : "—"}</TableCell>
                        <TableCell>{r?.check_out ? format(new Date(r.check_out), "HH:mm") : "—"}</TableCell>
                        <TableCell>
                          {!r ? <Badge variant="outline">Yo'q</Badge> :
                            r.is_late ? <Badge className="bg-amber-100 text-amber-800">Kechikkan</Badge> :
                            r.check_out ? <Badge variant="secondary">Tugatdi</Badge> :
                            <Badge className="bg-emerald-100 text-emerald-800">Ishda</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div><Label className="text-xs">Sana</Label><Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /></div>
            <div className="min-w-[180px]">
              <Label className="text-xs">Xodim</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filterStaff} onChange={(e) => setFilterStaff(e.target.value)}>
                <option value="">Hammasi</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" /> CSV</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Sana</TableHead><TableHead>Xodim</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead><TableHead>Ishlangan</TableHead><TableHead>Holat</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.attendance_date}</TableCell>
                    <TableCell>{staffName(r.staff_id)}</TableCell>
                    <TableCell>{r.check_in ? format(new Date(r.check_in), "HH:mm") : "—"}</TableCell>
                    <TableCell>{r.check_out ? format(new Date(r.check_out), "HH:mm") : "—"}</TableCell>
                    <TableCell>{r.worked_minutes ? `${Math.floor(r.worked_minutes / 60)}s ${r.worked_minutes % 60}d` : "—"}</TableCell>
                    <TableCell>
                      {r.is_late ? <Badge className="bg-amber-100 text-amber-800">Kechikkan {r.late_minutes}d</Badge> :
                        <Badge variant="secondary">{r.status || "present"}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Yozuvlar yo'q</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-3">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" /> Dinamik QR Kod</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {qrImg ? <img src={qrImg} className="w-72 h-72" alt="QR" /> : <div className="w-72 h-72 bg-muted animate-pulse rounded" />}
              {qrToken && <p className="text-xs text-muted-foreground">Yangilanadi: {format(new Date(qrToken.expires_at), "HH:mm:ss")}</p>}
              <Button variant="outline" size="sm" onClick={generateQr}><RefreshCw className="w-4 h-4 mr-1" /> Hozir yangilash</Button>
              <p className="text-xs text-muted-foreground text-center max-w-md">Xodim ushbu QR kodni <code>/check-in</code> sahifasida skaner qiladi. QR har {settings?.qr_rotate_seconds ?? 60} soniyada yangilanadi.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          {settings && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Klinika joylashuvi</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Latitude</Label><Input type="number" step="0.000001" value={settings.location_lat ?? ""} onChange={(e) => setSettings({ ...settings, location_lat: parseFloat(e.target.value) || null })} /></div>
                  <div><Label>Longitude</Label><Input type="number" step="0.000001" value={settings.location_lng ?? ""} onChange={(e) => setSettings({ ...settings, location_lng: parseFloat(e.target.value) || null })} /></div>
                </div>
                <Button variant="outline" size="sm" onClick={useMyLocation}><MapPin className="w-4 h-4 mr-1" /> Joriy joylashuvni olish</Button>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Radius (metr)</Label><Input type="number" value={settings.radius_m} onChange={(e) => setSettings({ ...settings, radius_m: parseInt(e.target.value) || 100 })} /></div>
                  <div><Label>QR yangilanish (soniya)</Label><Input type="number" value={settings.qr_rotate_seconds} onChange={(e) => setSettings({ ...settings, qr_rotate_seconds: parseInt(e.target.value) || 60 })} /></div>
                  <div><Label>Ish boshlash</Label><Input type="time" value={settings.work_start} onChange={(e) => setSettings({ ...settings, work_start: e.target.value })} /></div>
                  <div><Label>Ish tugashi</Label><Input type="time" value={settings.work_end} onChange={(e) => setSettings({ ...settings, work_end: e.target.value })} /></div>
                  <div><Label>Kechikish chegarasi (daq)</Label><Input type="number" value={settings.late_threshold_min} onChange={(e) => setSettings({ ...settings, late_threshold_min: parseInt(e.target.value) || 10 })} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>Geolocation majburiy</Label><Switch checked={settings.enforce_geo} onCheckedChange={(v) => setSettings({ ...settings, enforce_geo: v })} /></div>
                <div className="flex items-center justify-between"><Label>QR majburiy</Label><Switch checked={settings.enforce_qr} onCheckedChange={(v) => setSettings({ ...settings, enforce_qr: v })} /></div>
                <Button onClick={saveSettings}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSAttendance;
