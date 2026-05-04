import { useEffect, useState, useMemo } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, MapPin, RefreshCw, Save, Users, Download, Plus, Trash2, ShieldCheck, Pencil, Search, Copy, Link2 } from "lucide-react";
import { format } from "date-fns";

interface Props {
  /** Defaults to current user. Pass a different owner_id only when admin manages another tenant. */
  ownerId?: string;
  orgType?: string;
  orgName?: string;
}

const OrgAttendance = ({ ownerId, orgType = "clinic", orgName }: Props) => {
  const { user } = useAuth();
  const owner = ownerId || user?.id || "";
  const [tab, setTab] = useState("today");
  const [settings, setSettings] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [qrToken, setQrToken] = useState<{ token: string; expires_at: string } | null>(null);
  const [qrImg, setQrImg] = useState<string>("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterStaff, setFilterStaff] = useState<string>("");
  const [staffForm, setStaffForm] = useState<{ id?: string; full_name: string; role: string; phone: string; user_id: string; is_active: boolean }>({ full_name: "", role: "", phone: "", user_id: "", is_active: true });
  const [openAdd, setOpenAdd] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchAll = async () => {
    if (!owner) return;
    const [{ data: s }, { data: st }, { data: rec }, { data: aud }] = await Promise.all([
      supabase.from("org_attendance_settings" as any).select("*").eq("owner_id", owner).maybeSingle(),
      supabase.from("org_attendance_staff" as any).select("*").eq("owner_id", owner).order("created_at", { ascending: false }),
      supabase.from("org_attendance_records" as any).select("*").eq("owner_id", owner).order("attendance_date", { ascending: false }).limit(500),
      supabase.from("org_attendance_audit_logs" as any).select("*").eq("owner_id", owner).order("created_at", { ascending: false }).limit(500),
    ]);
    setSettings(s || { owner_id: owner, org_type: orgType, org_name: orgName, radius_m: 100, work_start: "09:00", work_end: "18:00", late_threshold_min: 10, qr_rotate_seconds: 60, enforce_geo: true, enforce_qr: true });
    setStaff((st as any[]) || []);
    setRecords((rec as any[]) || []);
    setAudits((aud as any[]) || []);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [owner]);

  const saveSettings = async () => {
    const payload = { ...settings, owner_id: owner, org_type: orgType, org_name: orgName ?? settings?.org_name };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const { error } = await supabase.from("org_attendance_settings" as any).upsert(payload, { onConflict: "owner_id" });
    if (error) return toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    toast({ title: "✅ Saqlandi" }); fetchAll();
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => setSettings((s: any) => ({ ...s, location_lat: p.coords.latitude, location_lng: p.coords.longitude })),
      (e) => toast({ title: "GPS xatosi", description: e.message, variant: "destructive" })
    );
  };

  const generateQr = async () => {
    const { data, error } = await supabase.functions.invoke("org-attendance-qr", { body: { owner_id: owner } });
    if (error || (data as any)?.error) return toast({ title: "Xatolik", description: (data as any)?.error || error?.message, variant: "destructive" });
    setQrToken({ token: (data as any).token, expires_at: (data as any).expires_at });
    const img = await QRCode.toDataURL((data as any).token, { width: 320, margin: 2 });
    setQrImg(img);
  };

  useEffect(() => {
    if (tab !== "qr" || !owner) return;
    generateQr();
    const id = setInterval(generateQr, (settings?.qr_rotate_seconds ?? 60) * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [tab, settings?.qr_rotate_seconds, owner]);

  const resetStaffForm = () => setStaffForm({ full_name: "", role: "", phone: "", user_id: "", is_active: true });

  const saveStaff = async () => {
    if (!staffForm.full_name) return toast({ title: "F.I.Sh majburiy", variant: "destructive" });
    const payload: any = {
      owner_id: owner, org_type: orgType,
      full_name: staffForm.full_name,
      role: staffForm.role || null,
      phone: staffForm.phone || null,
      user_id: staffForm.user_id || null,
      is_active: staffForm.is_active,
    };
    const res = staffForm.id
      ? await supabase.from("org_attendance_staff" as any).update(payload).eq("id", staffForm.id)
      : await supabase.from("org_attendance_staff" as any).insert(payload);
    if (res.error) return toast({ title: "Xatolik", description: res.error.message, variant: "destructive" });
    toast({ title: staffForm.id ? "✅ Yangilandi" : "✅ Qo'shildi" });
    resetStaffForm(); setOpenAdd(false); setSearchResults([]); setUserSearch("");
    fetchAll();
  };

  const editStaff = (s: any) => {
    setStaffForm({ id: s.id, full_name: s.full_name || "", role: s.role || "", phone: s.phone || "", user_id: s.user_id || "", is_active: s.is_active ?? true });
    setSearchResults([]); setUserSearch("");
    setOpenAdd(true);
  };

  const removeStaff = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("org_attendance_staff" as any).delete().eq("id", id);
    fetchAll();
  };

  const findUser = async () => {
    if (!userSearch.trim()) return;
    setSearching(true);
    const { data, error } = await supabase.functions.invoke("org-attendance-find-user", { body: { query: userSearch.trim() } });
    setSearching(false);
    if (error || (data as any)?.error) return toast({ title: "Xatolik", description: (data as any)?.error || error?.message, variant: "destructive" });
    setSearchResults((data as any)?.results || []);
    if (!(data as any)?.results?.length) toast({ title: "Topilmadi", description: "Bu email/telefon bo'yicha foydalanuvchi yo'q. Xodim avval ro'yxatdan o'tishi kerak." });
  };

  const pickUser = (r: any) => {
    setStaffForm((f) => ({ ...f, user_id: r.user_id, full_name: f.full_name || r.full_name || "", phone: f.phone || r.phone || "" }));
    toast({ title: "✅ User ID bog'landi" });
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayRecs = records.filter((r) => r.attendance_date === today);
  const lateCount = todayRecs.filter((r) => r.is_late).length;
  const presentCount = todayRecs.filter((r) => r.check_in).length;
  const absentCount = staff.filter((s) => s.is_active).length - presentCount;

  const filtered = useMemo(() => records.filter((r) =>
    (!filterDate || r.attendance_date === filterDate) && (!filterStaff || r.staff_id === filterStaff)
  ), [records, filterDate, filterStaff]);

  const staffName = (id: string) => staff.find((s) => s.id === id)?.full_name || "—";

  const exportCsv = () => {
    const rows = [["Sana","Xodim","Check-in","Check-out","Kechikish","Ishlangan (daq)","Status"]];
    filtered.forEach((r) => rows.push([
      r.attendance_date, staffName(r.staff_id),
      r.check_in ? format(new Date(r.check_in), "HH:mm") : "",
      r.check_out ? format(new Date(r.check_out), "HH:mm") : "",
      r.is_late ? `${r.late_minutes}` : "0",
      `${r.worked_minutes || 0}`, r.status || "",
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `attendance-${filterDate}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Attendance — Keldi-Ketdi</h2>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="today">Bugun</TabsTrigger>
          <TabsTrigger value="list">Yozuvlar</TabsTrigger>
          <TabsTrigger value="staff">Xodimlar</TabsTrigger>
          <TabsTrigger value="qr">QR Kod</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="settings">Sozlamalar</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Jami</div><div className="text-2xl font-bold">{staff.filter(s=>s.is_active).length}</div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Keldi</div><div className="text-2xl font-bold text-emerald-600">{presentCount}</div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Kechikkan</div><div className="text-2xl font-bold text-amber-600">{lateCount}</div></CardContent></Card>
            <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Kelmagan</div><div className="text-2xl font-bold text-rose-600">{absentCount}</div></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Bugun</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Xodim</TableHead><TableHead>In</TableHead><TableHead>Out</TableHead><TableHead>Holat</TableHead></TableRow></TableHeader>
                <TableBody>
                  {staff.filter(s=>s.is_active).map((s) => {
                    const r = todayRecs.find((x) => x.staff_id === s.id);
                    return (<TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{r?.check_in ? format(new Date(r.check_in),"HH:mm"):"—"}</TableCell>
                      <TableCell>{r?.check_out ? format(new Date(r.check_out),"HH:mm"):"—"}</TableCell>
                      <TableCell>{!r ? <Badge variant="outline">Yo'q</Badge> :
                        r.is_late ? <Badge className="bg-amber-100 text-amber-800">Kechikkan</Badge> :
                        r.check_out ? <Badge variant="secondary">Tugatdi</Badge> :
                        <Badge className="bg-emerald-100 text-emerald-800">Ishda</Badge>}</TableCell>
                    </TableRow>);
                  })}
                  {staff.length===0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Xodimlar yo'q. "Xodimlar" tabiga o'ting.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent></Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div><Label className="text-xs">Sana</Label><Input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} /></div>
            <div className="min-w-[180px]"><Label className="text-xs">Xodim</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={filterStaff} onChange={(e)=>setFilterStaff(e.target.value)}>
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
                {filtered.map((r)=>(<TableRow key={r.id}>
                  <TableCell>{r.attendance_date}</TableCell>
                  <TableCell>{staffName(r.staff_id)}</TableCell>
                  <TableCell>{r.check_in?format(new Date(r.check_in),"HH:mm"):"—"}</TableCell>
                  <TableCell>{r.check_out?format(new Date(r.check_out),"HH:mm"):"—"}</TableCell>
                  <TableCell>{r.worked_minutes?`${Math.floor(r.worked_minutes/60)}s ${r.worked_minutes%60}d`:"—"}</TableCell>
                  <TableCell>{r.is_late?<Badge className="bg-amber-100 text-amber-800">Kechikkan {r.late_minutes}d</Badge>:<Badge variant="secondary">{r.status||"present"}</Badge>}</TableCell>
                </TableRow>))}
                {filtered.length===0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Yozuvlar yo'q</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Xodim qo'shish</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Yangi xodim</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <div><Label>F.I.Sh *</Label><Input value={staffForm.full_name} onChange={(e)=>setStaffForm({...staffForm, full_name:e.target.value})} /></div>
                  <div><Label>Lavozim</Label><Input value={staffForm.role} onChange={(e)=>setStaffForm({...staffForm, role:e.target.value})} /></div>
                  <div><Label>Telefon</Label><Input value={staffForm.phone} onChange={(e)=>setStaffForm({...staffForm, phone:e.target.value})} /></div>
                  <div><Label>User ID (ixtiyoriy)</Label><Input placeholder="UUID — check-in qila olish uchun" value={staffForm.user_id} onChange={(e)=>setStaffForm({...staffForm, user_id:e.target.value})} /></div>
                  <Button onClick={addStaff} className="w-full">Saqlash</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>F.I.Sh</TableHead><TableHead>Lavozim</TableHead><TableHead>Telefon</TableHead><TableHead>Hisob</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {staff.map((s)=>(<TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell>{s.role || "—"}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{s.user_id ? <Badge variant="secondary">Bog'langan</Badge> : <Badge variant="outline">Yo'q</Badge>}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={()=>removeStaff(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>))}
                {staff.length===0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Xodim yo'q</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" /> Dinamik QR Kod</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {qrImg ? <img src={qrImg} className="w-72 h-72" alt="QR" /> : <div className="w-72 h-72 bg-muted animate-pulse rounded" />}
              {qrToken && <p className="text-xs text-muted-foreground">Amal qiladi: {format(new Date(qrToken.expires_at),"HH:mm:ss")} gacha</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={generateQr}><RefreshCw className="w-4 h-4 mr-1" /> Yangilash</Button>
                <Button size="sm" onClick={() => window.open("/check-in", "_blank")}>📱 /check-in ochish</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">📖 Xodimlar uchun yo'riqnoma — QR orqali Check-in/Check-out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-primary mb-1">1️⃣ Tayyorgarlik (bir martalik)</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Xodim tizimda ro'yxatdan o'tgan bo'lishi kerak (email/telefon orqali).</li>
                  <li>Admin "Xodimlar" tabidan xodimni qo'shadi va uning <b>User ID</b> sini bog'laydi.</li>
                  <li>"Sozlamalar" tabida klinika joylashuvi (GPS) va ruxsat etilgan radius belgilanadi.</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-1">2️⃣ Check-in qilish (ish boshlanganda)</h4>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Telefonda tizimga kiring va <code className="bg-background px-1 rounded">/check-in</code> sahifasini oching.</li>
                  <li>Brauzerga <b>Kamera</b> va <b>Joylashuv</b> ruxsatlarini bering.</li>
                  <li><b>"Check-in"</b> tugmasini bosing — kamera ochiladi.</li>
                  <li>Klinikada osilgan QR kodga kamerani yo'naltiring (1-2 soniya).</li>
                  <li>Tizim joylashuvingizni tekshiradi — ✅ tasdiq xabari chiqadi.</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-1">3️⃣ Check-out qilish (ish tugaganda)</h4>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Yana <code className="bg-background px-1 rounded">/check-in</code> sahifasiga kiring.</li>
                  <li><b>"Check-out"</b> tugmasini bosing va QR'ni qayta skaner qiling.</li>
                  <li>Ishlangan vaqt avtomatik hisoblab chiqiladi.</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-primary mb-1">⚠️ Muhim qoidalar</h4>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>QR kod har <b>{settings?.qr_rotate_seconds ?? 60} soniyada</b> avtomatik yangilanadi — eski screenshot ishlamaydi.</li>
                  <li>Klinika hududidan <b>{settings?.radius_m ?? 100}m</b> uzoqdan check-in qilib bo'lmaydi.</li>
                  <li>Soxta GPS aniqlansa, urinish bloklanadi va loglanadi.</li>
                  <li>Kechikish: ish boshlanishidan {settings?.late_threshold_min ?? 10} daqiqa o'tgach "Kechikkan" deb belgilanadi.</li>
                </ul>
              </div>
              <div className="rounded-lg bg-background border p-3">
                <h4 className="font-semibold mb-1">💡 Maslahat admin uchun</h4>
                <p className="text-muted-foreground">Bu sahifani katta ekran/planshetda ochib qoldiring va kirish eshigi yoniga qo'ying. Xodimlar kelganda telefon kamerasi bilan skaner qiladi. QR avtomatik yangilanib turadi.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Har bir check-in/out urinishi: QR token, vaqt, GPS, masofa, natija va sabab.</p>
            <Button variant="outline" size="sm" onClick={() => {
              const rows = [["Vaqt","Xodim","Action","Natija","Sabab","QR (qisqa)","Lat","Lng","Masofa(m)","Qurilma","IP"]];
              audits.forEach((a) => rows.push([
                format(new Date(a.created_at), "yyyy-MM-dd HH:mm:ss"),
                staffName(a.staff_id) || "—",
                a.action || "", a.result || "", a.reason || "",
                a.qr_token || "", a.lat ?? "", a.lng ?? "", a.distance_m ?? "",
                (a.device_info || "").slice(0,60), a.ip_address || "",
              ]));
              const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              const a = document.createElement("a"); a.href = url; a.download = `attendance-audit-${new Date().toISOString().slice(0,10)}.csv`; a.click();
            }}><Download className="w-4 h-4 mr-1" /> CSV eksport</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vaqt</TableHead><TableHead>Xodim</TableHead><TableHead>Action</TableHead>
                <TableHead>Natija</TableHead><TableHead>Sabab</TableHead><TableHead>GPS</TableHead>
                <TableHead>Masofa</TableHead><TableHead>QR</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {audits.map((a) => (<TableRow key={a.id}>
                  <TableCell className="text-xs">{format(new Date(a.created_at), "dd.MM HH:mm:ss")}</TableCell>
                  <TableCell className="text-xs">{staffName(a.staff_id)}</TableCell>
                  <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                  <TableCell>
                    {a.result === "success" ? <Badge className="bg-emerald-100 text-emerald-800">OK</Badge> :
                     a.result === "late" ? <Badge className="bg-amber-100 text-amber-800">Kech</Badge> :
                     a.result === "denied" ? <Badge variant="destructive">Rad</Badge> :
                     <Badge variant="secondary">{a.result}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{a.reason || "—"}</TableCell>
                  <TableCell className="text-xs">{a.lat ? `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}` : "—"}</TableCell>
                  <TableCell className="text-xs">{a.distance_m != null ? `${a.distance_m}m` : "—"}</TableCell>
                  <TableCell className="text-xs font-mono">{a.qr_token || "—"}</TableCell>
                </TableRow>))}
                {audits.length===0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Audit yozuvi yo'q</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          {settings && (<Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Sozlamalar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Latitude</Label><Input type="number" step="0.000001" value={settings.location_lat ?? ""} onChange={(e)=>setSettings({...settings, location_lat:parseFloat(e.target.value)||null})} /></div>
                <div><Label>Longitude</Label><Input type="number" step="0.000001" value={settings.location_lng ?? ""} onChange={(e)=>setSettings({...settings, location_lng:parseFloat(e.target.value)||null})} /></div>
              </div>
              <Button variant="outline" size="sm" onClick={useMyLocation}><MapPin className="w-4 h-4 mr-1" /> Joriy joylashuv</Button>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Radius (m)</Label><Input type="number" value={settings.radius_m} onChange={(e)=>setSettings({...settings, radius_m:parseInt(e.target.value)||100})} /></div>
                <div><Label>QR (sek)</Label><Input type="number" value={settings.qr_rotate_seconds} onChange={(e)=>setSettings({...settings, qr_rotate_seconds:parseInt(e.target.value)||60})} /></div>
                <div><Label>Ish boshlash</Label><Input type="time" value={settings.work_start} onChange={(e)=>setSettings({...settings, work_start:e.target.value})} /></div>
                <div><Label>Ish tugashi</Label><Input type="time" value={settings.work_end} onChange={(e)=>setSettings({...settings, work_end:e.target.value})} /></div>
                <div><Label>Kechikish (daq)</Label><Input type="number" value={settings.late_threshold_min} onChange={(e)=>setSettings({...settings, late_threshold_min:parseInt(e.target.value)||10})} /></div>
              </div>
              <div className="flex items-center justify-between"><Label>Geolocation majburiy</Label><Switch checked={settings.enforce_geo} onCheckedChange={(v)=>setSettings({...settings, enforce_geo:v})} /></div>
              <div className="flex items-center justify-between"><Label>QR majburiy</Label><Switch checked={settings.enforce_qr} onCheckedChange={(v)=>setSettings({...settings, enforce_qr:v})} /></div>
              <Button onClick={saveSettings}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
            </CardContent></Card>)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrgAttendance;
