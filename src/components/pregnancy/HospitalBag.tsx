import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Info, Plus, Briefcase, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; must?: boolean; tip?: string };
type Section = { id: string; title: string; emoji: string; items: Item[] };

export const BAG_SECTIONS: Section[] = [
  { id: "docs", title: "Hujjatlar", emoji: "📄", items: [
    { id: "passport", name: "Pasport (asli va nusxasi)", must: true },
    { id: "exchange", name: "Almashinuv kartasi", must: true, tip: "Ayollar konsultatsiyasidan oling — 22-haftadan beriladi." },
    { id: "tests", name: "Analiz natijalari (qog'ozda)", must: true, tip: "OIV, sifilis, gepatit B/C, qon guruhi va rezus." },
    { id: "contract", name: "Tug'ruq shartnomasi yoki polis" },
    { id: "partner", name: "Hamroh uchun flyuorografiya va analizlar", tip: "Hamkorlikdagi tug'ruq uchun kerak." },
    { id: "phone", name: "Telefon + quvvatlagich (uzun kabel)", must: true },
  ]},
  { id: "labor", title: "To'lg'oq paytida", emoji: "⏱️", items: [
    { id: "water", name: "Gazsiz suv (0.5 l × 2)", must: true },
    { id: "lip", name: "Lab balzami", tip: "Nafas mashqlarida lablar quriydi." },
    { id: "socks", name: "Issiq paypoq" },
    { id: "hair", name: "Soch rezinkasi" },
    { id: "snack", name: "Yengil gazak (hamroh uchun)" },
  ]},
  { id: "mom", title: "Ona uchun", emoji: "🤱", items: [
    { id: "gown", name: "Oldi ochiladigan tungi ko'ylak (2 ta)", must: true },
    { id: "robe", name: "Xalat", must: true },
    { id: "slippers", name: "Yuviladigan shippak", must: true },
    { id: "pads", name: "Tug'ruqdan keyingi prokladkalar (20+)", must: true },
    { id: "pants", name: "Bir martalik ichki kiyim (5 ta)", must: true },
    { id: "bra", name: "Emizish byusgalteri + vkladishlar", must: true },
    { id: "towel", name: "Sochiq (2 ta)", must: true },
    { id: "hygiene", name: "Gigiena: tish cho'tkasi, pasta, sovun, taroq", must: true },
    { id: "nipple", name: "Ko'krak uchi kremi (lanolin)" },
    { id: "cup", name: "Krujka, qoshiq, likopcha" },
  ]},
  { id: "baby", title: "Chaqaloq uchun", emoji: "👶", items: [
    { id: "diapers", name: "Yangi tug'ilganlar tagliklari (0–5 kg)", must: true },
    { id: "wipes", name: "Nam salfetkalar (spirtsiz)", must: true },
    { id: "bodysuit", name: "Bodi yoki raspashonka (3–4 ta)", must: true },
    { id: "hat", name: "Paxta qalpoqcha (2 ta)", must: true },
    { id: "mittens", name: "Tirnalishga qarshi qo'lqop", must: false },
    { id: "swaddle", name: "Yo'rgak (2–3 ta)", must: true },
    { id: "cream", name: "Taglik kremi" },
  ]},
  { id: "discharge", title: "Uyga chiqish uchun", emoji: "🚗", items: [
    { id: "outfit", name: "Chaqaloq uchun chiqish to'plami (mavsumga mos)", must: true },
    { id: "carseat", name: "Avtokreslo (0+ guruh)", must: true, tip: "Taksi yoki mashinada faqat avtokreslo xavfsiz." },
    { id: "momclothes", name: "Ona uchun keng kiyim" },
  ]},
];

const ALL = BAG_SECTIONS.flatMap((s) => s.items);

export default function HospitalBag({ userId, week }: { userId: string; week: number }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<Item[]>([]);
  const [rowId, setRowId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>("docs");
  const [tip, setTip] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    supabase.from("health_records").select("id,value").eq("user_id", userId).eq("record_type", "pregnancy_bag")
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setRowId(data.id);
        const d = ((data as any).value ?? {}) as any;
        setDone(new Set(d.done ?? []));
        setCustom(d.custom ?? []);
      });
  }, [userId]);

  const save = async (nd: Set<string>, nc: Item[]) => {
    const payload = { done: [...nd], custom: nc };
    if (rowId) await supabase.from("health_records").update({ value: payload } as any).eq("id", rowId);
    else {
      const { data } = await supabase.from("health_records").insert({ user_id: userId, record_type: "pregnancy_bag", value: payload } as any).select("id").single();
      if (data) setRowId(data.id);
    }
  };

  const toggle = (id: string) => {
    const n = new Set(done); n.has(id) ? n.delete(id) : n.add(id); setDone(n); save(n, custom);
  };
  const addCustom = () => {
    if (!newItem.trim()) return;
    const nc = [...custom, { id: `c_${Date.now()}`, name: newItem.trim().slice(0, 80) }];
    setCustom(nc); setNewItem(""); save(done, nc);
  };
  const removeCustom = (id: string) => {
    const nc = custom.filter((c) => c.id !== id); const nd = new Set(done); nd.delete(id);
    setCustom(nc); setDone(nd); save(nd, nc);
  };

  const all = useMemo(() => [...ALL, ...custom], [custom]);
  const checked = all.filter((i) => done.has(i.id)).length;
  const pct = Math.round((checked / all.length) * 100);
  const mustLeft = ALL.filter((i) => i.must && !done.has(i.id)).length;
  const urgent = week >= 34 && mustLeft > 0;
  const r = 34, c = 2 * Math.PI * r;

  const sections = [...BAG_SECTIONS, ...(custom.length ? [{ id: "custom", title: "O'zim qo'shganlar", emoji: "✨", items: custom }] : [])];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
              <circle cx="40" cy="40" r={r} className="fill-none stroke-muted" strokeWidth="8" />
              <circle cx="40" cy="40" r={r} className="fill-none stroke-primary transition-all duration-700" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{pct}%</span>
          </div>
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-lg font-bold"><Briefcase className="h-5 w-5 text-primary" /> Tug'ruqxona sumkasi</h3>
            <p className="text-sm text-muted-foreground">{checked} / {all.length} tayyor · 34-haftagacha yig'ing</p>
            <p className={cn("mt-1 text-sm font-medium", urgent ? "text-destructive" : mustLeft ? "text-primary" : "text-primary")}>
              {mustLeft ? `${mustLeft} ta majburiy narsa qoldi${urgent ? " — vaqt keldi!" : ""}` : "Barcha majburiy narsalar tayyor ✅"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 Sumkani 3 ga bo'ling: <b>to'lg'oq</b>, <b>tug'ruqdan keyin</b> va <b>uyga chiqish</b>. Hujjatlarni alohida shaffof papkada saqlang — qabulxonada birinchi so'raladi.
      </div>

      {sections.map((s) => {
        const sd = s.items.filter((i) => done.has(i.id)).length;
        const isOpen = open === s.id;
        return (
          <Card key={s.id} className="overflow-hidden">
            <button onClick={() => setOpen(isOpen ? null : s.id)} className="flex w-full items-center gap-3 p-4 text-left">
              <span className="text-2xl">{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.title}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(sd / s.items.length) * 100}%` }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{sd}/{s.items.length}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="divide-y divide-border border-t border-border">
                {s.items.map((i) => {
                  const on = done.has(i.id);
                  return (
                    <div key={i.id}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button onClick={() => toggle(i.id)} aria-label={i.name}
                          className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            on ? "border-primary bg-primary text-primary-foreground scale-110" : "border-muted-foreground/40")}>
                          {on && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <span onClick={() => toggle(i.id)} className={cn("flex-1 cursor-pointer text-sm", on && "text-muted-foreground line-through")}>{i.name}</span>
                        {i.tip && <button onClick={() => setTip(tip === i.id ? null : i.id)} aria-label="Ma'lumot"><Info className="h-4 w-4 text-muted-foreground" /></button>}
                        {i.must && <Badge variant="secondary" className="text-[10px]">Majburiy</Badge>}
                        {s.id === "custom" && <button onClick={() => removeCustom(i.id)} aria-label="O'chirish"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>}
                      </div>
                      {tip === i.id && <p className="px-12 pb-3 text-xs text-muted-foreground">{i.tip}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      <div className="flex gap-2">
        <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustom()} placeholder="O'z narsangizni qo'shing…" />
        <Button onClick={addCustom}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
