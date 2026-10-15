import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Flame, Trash2, Settings2, Sparkles as Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Macro = { kcal: number; protein: number; fat: number; carbs: number };
type Scan = { items: (Macro & { name: string; grams: number })[]; total: Macro; health_score: number; verdict: string; tips: string[]; alternatives?: string[] };
type Meal = { id: string; recorded_at: string; value: { name: string } & Macro };
type Body = { weight: number; height: number; age: number; sex: "m" | "f"; activity: number };

const DEFAULT_BODY: Body = { weight: 70, height: 172, age: 30, sex: "m", activity: 1.45 };

/** Mifflin–St Jeor daily targets adjusted by goal. */
function targets(b: Body, goal: string): Macro {
  const bmr = 10 * b.weight + 6.25 * b.height - 5 * b.age + (b.sex === "m" ? 5 : -161);
  let kcal = bmr * b.activity;
  if (goal === "weight_loss") kcal -= 450; else if (goal === "muscle" || goal === "strength") kcal += 300;
  const protein = b.weight * (goal === "muscle" || goal === "strength" ? 2 : goal === "weight_loss" ? 1.8 : 1.4);
  const fat = (kcal * 0.27) / 9;
  const carbs = Math.max(0, (kcal - protein * 4 - fat * 9) / 4);
  return { kcal: Math.round(kcal), protein: Math.round(protein), fat: Math.round(fat), carbs: Math.round(carbs) };
}

async function toDataUrl(file: File) {
  const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
  const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas"); c.width = img.naturalWidth * k; c.height = img.naturalHeight * k;
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
  return c.toDataURL("image/jpeg", 0.82);
}

const Ring = ({ value, max }: { value: number; max: number }) => {
  const r = 52, C = 2 * Math.PI * r, p = Math.min(1, value / Math.max(1, max));
  return (
    <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90">
      <circle cx="64" cy="64" r={r} className="fill-none stroke-muted" strokeWidth="12" />
      <circle cx="64" cy="64" r={r} className="fill-none stroke-primary transition-all duration-700" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
    </svg>
  );
};

const FoodScanner = ({ goal }: { goal: string }) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState<Scan | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [body, setBody] = useState<Body>(DEFAULT_BODY);
  const [setup, setSetup] = useState(false);
  const goalT = useMemo(() => targets(body, goal), [body, goal]);

  const load = async () => {
    if (!user) return;
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const [{ data: m }, { data: b }] = await Promise.all([
      supabase.from("health_records").select("id, recorded_at, value").eq("user_id", user.id).eq("record_type", "nutrition_meal").gte("recorded_at", since.toISOString()).order("recorded_at", { ascending: false }),
      supabase.from("health_records").select("value").eq("user_id", user.id).eq("record_type", "nutrition_profile").order("recorded_at", { ascending: false }).limit(1),
    ]);
    setMeals((m as unknown as Meal[]) ?? []);
    if (b?.[0]?.value) setBody({ ...DEFAULT_BODY, ...(b[0].value as Partial<Body>) });
  };
  useEffect(() => { void load(); }, [user?.id]);

  const eaten = meals.reduce<Macro>((a, m) => ({ kcal: a.kcal + (+m.value.kcal || 0), protein: a.protein + (+m.value.protein || 0), fat: a.fat + (+m.value.fat || 0), carbs: a.carbs + (+m.value.carbs || 0) }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });

  const analyze = async (file?: File) => {
    if (!file) return;
    if (!user) { toast.error("Skanerlash uchun tizimga kiring"); return; }
    setBusy(true); setScan(null);
    try {
      const image = await toDataUrl(file); setPreview(image);
      const { data, error } = await supabase.functions.invoke("ai-food-scan", { body: { image, goal } });
      if (error || data?.error) throw new Error(data?.error || "Tahlil xatosi");
      setScan(data as Scan);
      if (data.credits > 0) toast.success(`${data.credits} Med Coin yechildi · Qabullar → AI xulosalariga saqlandi`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Xatolik"); }
    finally { setBusy(false); }
  };

  const addMeal = async () => {
    if (!scan || !user) return;
    const name = scan.items.map((i) => i.name).join(", ").slice(0, 120) || "Ovqat";
    await supabase.from("health_records").insert({ user_id: user.id, record_type: "nutrition_meal", recorded_at: new Date().toISOString(), value: { name, ...scan.total } });
    setScan(null); setPreview(null); toast.success("Kunlik ratsionga qo‘shildi"); void load();
  };
  const removeMeal = async (id: string) => { await supabase.from("health_records").delete().eq("id", id); void load(); };
  const saveBody = async () => {
    if (user) await supabase.from("health_records").insert({ user_id: user.id, record_type: "nutrition_profile", recorded_at: new Date().toISOString(), value: body });
    setSetup(false);
  };

  const left = goalT.kcal - eaten.kcal;
  const bars: [string, keyof Macro, string][] = [["Oqsil", "protein", "g"], ["Yog‘", "fat", "g"], ["Uglevod", "carbs", "g"]];

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Flame className="h-5 w-5 text-primary" /> Ovqatlanish nazorati va AI skaner</h2>
        <Button variant="ghost" size="sm" onClick={() => setSetup(true)}><Settings2 className="mr-1 h-4 w-4" /> Sozlash</Button>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-[auto_1fr]">
        <div className="relative mx-auto flex items-center justify-center">
          <Ring value={eaten.kcal} max={goalT.kcal} />
          <div className="absolute text-center">
            <p className="text-3xl font-extrabold tabular-nums text-foreground">{Math.round(eaten.kcal)}</p>
            <p className="text-xs text-muted-foreground">/ {goalT.kcal} kkal</p>
            <p className={`text-[11px] font-semibold ${left >= 0 ? "text-primary" : "text-destructive"}`}>{left >= 0 ? `${left} qoldi` : `${-left} ortiqcha`}</p>
          </div>
        </div>
        <div className="space-y-3">
          {bars.map(([l, k, u]) => (
            <div key={k}>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="font-semibold tabular-nums text-foreground">{Math.round(eaten[k])}/{goalT[k]} {u}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (eaten[k] / Math.max(1, goalT[k])) * 100)}%` }} /></div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button onClick={() => camRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Camera className="mr-1 h-4 w-4" />} Ovqatni skanerlash</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}><ImagePlus className="mr-1 h-4 w-4" /> Galereyadan / yorliq</Button>
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void analyze(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void analyze(e.target.files?.[0]); e.target.value = ""; }} />
          <p className="text-[11px] text-muted-foreground">Taom, ichimlik yoki qadoqdagi “Ozuqaviy qiymat” yorlig‘ini suratga oling — AI kaloriya, oqsil, yog‘ va uglevodni aniqlab, maqsadingizga mos tavsiya beradi.</p>
        </div>
      </div>

      {(busy || scan) && (
        <div className="grid gap-4 border-t border-border p-5 md:grid-cols-[180px_1fr]">
          {preview && (
            <div className="relative overflow-hidden rounded-2xl">
              <img src={preview} alt="Skanerlangan ovqat" className="h-44 w-full object-cover md:h-full" />
              {busy && <div className="absolute inset-0 bg-primary/10"><div className="absolute inset-x-0 h-1 animate-[scan_1.6s_ease-in-out_infinite] bg-primary shadow-[0_0_16px_hsl(var(--primary))]" /></div>}
            </div>
          )}
          {busy ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> AI ovqatni aniqlamoqda…</p> : scan && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-extrabold text-foreground">{scan.total.kcal} kkal</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${scan.health_score >= 7 ? "bg-primary/10 text-primary" : scan.health_score >= 4 ? "bg-muted text-foreground" : "bg-destructive/10 text-destructive"}`}>Sog‘lomlik {scan.health_score}/10</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {bars.map(([l, k]) => <div key={k} className="rounded-xl bg-muted/60 p-2"><p className="text-[10px] text-muted-foreground">{l}</p><p className="font-bold text-foreground">{scan.total[k]} g</p></div>)}
              </div>
              <ul className="space-y-1 text-sm">{scan.items.map((i, n) => <li key={n} className="flex justify-between gap-2"><span className="text-foreground">{i.name} <span className="text-muted-foreground">~{i.grams} g</span></span><span className="tabular-nums text-muted-foreground">{i.kcal} kkal</span></li>)}</ul>
              <p className="text-sm font-medium text-foreground">{scan.verdict}</p>
              {scan.tips?.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{scan.tips.map((t, n) => <li key={n}>{t}</li>)}</ul>}
              {scan.alternatives?.length ? <p className="flex items-start gap-1 text-xs text-muted-foreground"><Leaf className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> Muqobil: {scan.alternatives.join(", ")}</p> : null}
              {scan.items.length > 0 && <Button onClick={() => void addMeal()} className="w-full">Kunlik ratsionga qo‘shish</Button>}
              <p className="text-[11px] text-muted-foreground">Qiymatlar taxminiy. Bu tibbiy tashxis yoki dietolog maslahati o‘rnini bosmaydi.</p>
            </div>
          )}
        </div>
      )}

      {meals.length > 0 && (
        <div className="border-t border-border p-5">
          <p className="mb-2 text-sm font-semibold text-foreground">Bugungi ovqatlar</p>
          <ul className="space-y-2">{meals.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-foreground">{new Date(m.recorded_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })} · {m.value.name}</span>
              <span className="tabular-nums text-muted-foreground">{Math.round(m.value.kcal)} kkal</span>
              <Button size="icon" variant="ghost" aria-label="O‘chirish" onClick={() => void removeMeal(m.id)}><Trash2 className="h-4 w-4" /></Button>
            </li>))}</ul>
        </div>
      )}

      <Dialog open={setup} onOpenChange={setSetup}>
        <DialogContent>
          <DialogTitle>Kunlik me’yorni hisoblash</DialogTitle>
          <DialogDescription>Ma’lumotlar asosida kaloriya va makro me’yori (Mifflin–St Jeor) hisoblanadi.</DialogDescription>
          <div className="grid grid-cols-2 gap-3">
            {([["weight", "Vazn (kg)"], ["height", "Bo‘y (sm)"], ["age", "Yosh"]] as const).map(([k, l]) => (
              <div key={k}><Label className="text-xs">{l}</Label><Input type="number" value={body[k]} onChange={(e) => setBody({ ...body, [k]: +e.target.value || 0 })} /></div>
            ))}
            <div><Label className="text-xs">Jins</Label>
              <div className="mt-1 grid grid-cols-2 gap-1">{(["m", "f"] as const).map((x) => <Button key={x} size="sm" variant={body.sex === x ? "default" : "outline"} onClick={() => setBody({ ...body, sex: x })}>{x === "m" ? "Erkak" : "Ayol"}</Button>)}</div>
            </div>
          </div>
          <div><Label className="text-xs">Faollik</Label>
            <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-4">{([[1.2, "Kam"], [1.45, "O‘rta"], [1.65, "Faol"], [1.85, "Juda faol"]] as const).map(([v, l]) => <Button key={v} size="sm" variant={body.activity === v ? "default" : "outline"} onClick={() => setBody({ ...body, activity: v })}>{l}</Button>)}</div>
          </div>
          <p className="text-sm text-foreground">Me’yor: <b>{goalT.kcal} kkal</b> · O {goalT.protein} g · Y {goalT.fat} g · U {goalT.carbs} g</p>
          <Button onClick={() => void saveBody()}>Saqlash</Button>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default FoodScanner;
