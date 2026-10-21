import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIServiceUsageGuide from "@/components/AIServiceUsageGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send, Bot, User, Pill, AlertTriangle, Plus, X, Loader2, Camera, ImagePlus, ScanLine,
  FileText, Repeat, Baby, HeartPulse, Utensils, Thermometer, Square, Trash2, ShieldAlert,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { consumeAiStream } from "@/lib/aiStream";
import { responseLangForText } from "@/lib/aiLang";

type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
interface Message { role: "user" | "assistant"; content: string | Part[] }

type ScanMode = "package" | "prescription" | "expiry";
const SCAN_MODES: { id: ScanMode; label: string; desc: string; icon: typeof Pill; prompt: string }[] = [
  { id: "package", label: "Dori qadog‘i", desc: "Quti, blister yoki flakon", icon: Pill, prompt: "Rasmdagi dorini aniqlang va u haqida to‘liq ma’lumot bering: nomi, INN, dozasi, nima uchun ishlatiladi, qabul tartibi, nojo‘ya ta’sirlar, qarshi ko‘rsatmalar, O‘zbekistondagi analoglar." },
  { id: "prescription", label: "Retsept", desc: "Shifokor yozgan varaq", icon: FileText, prompt: "Rasmdagi retseptni o‘qing: har bir dori nomi, dozasi va qabul chastotasini jadvalda bering, ular orasidagi o‘zaro ta’sirni tekshiring." },
  { id: "expiry", label: "Yaroqlilik", desc: "Muddat va seriya", icon: ShieldAlert, prompt: "Rasmdagi dorining yaroqlilik muddati, seriya raqami va saqlash shartlarini o‘qing. Muddati o‘tgan bo‘lsa aniq ogohlantiring." },
];

const QUICK_TOOLS: { label: string; icon: typeof Pill; build: (med: string) => string }[] = [
  { label: "Analoglar", icon: Repeat, build: (m) => `${m || "Bu dori"} ning O‘zbekistonda mavjud arzon analoglari va taxminiy narxlari` },
  { label: "Homiladorlik", icon: Baby, build: (m) => `${m || "Bu dori"} homiladorlik va emizish davrida xavfsizmi?` },
  { label: "Bolalarga", icon: Thermometer, build: (m) => `${m || "Bu dori"} bolalarga beriladimi, qaysi yoshdan va qanday shaklda? (umumiy ma’lumot)` },
  { label: "Ovqat va alkogol", icon: Utensils, build: (m) => `${m || "Bu dori"} ni ovqat, qahva yoki alkogol bilan birga ichsa bo‘ladimi?` },
  { label: "Nojo‘ya ta’sir", icon: HeartPulse, build: (m) => `${m || "Bu dori"} ning eng ko‘p uchraydigan va xavfli nojo‘ya ta’sirlari` },
];

/** Downscale to ≤1280px JPEG so scans upload quickly on mobile data. */
async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image(); el.onload = () => resolve(el); el.onerror = reject; el.src = url;
    });
    const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

const textOf = (c: Message["content"]) => (typeof c === "string" ? c : c.filter((p): p is Extract<Part, { type: "text" }> => p.type === "text").map((p) => p.text).join("\n"));
const imageOf = (c: Message["content"]) => (typeof c === "string" ? null : c.find((p): p is Extract<Part, { type: "image_url" }> => p.type === "image_url")?.image_url.url ?? null);

const AIFarmatsevtPage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState("scan");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState<string[]>([]);
  const [newMed, setNewMed] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>("package");
  const [preview, setPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  const addMedication = (name = newMed) => {
    const v = name.trim().slice(0, 60);
    if (v && !medications.includes(v)) setMedications((m) => [...m, v].slice(0, 20));
    setNewMed("");
  };

  const send = async (content: Message["content"]) => {
    if (isLoading) return;
    const userMessage: Message = { role: "user", content };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setIsLoading(true);
    setTab("chat");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-farmatsevt`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        // Only the latest scan image is sent; earlier images are replaced by their text to keep requests small.
        body: JSON.stringify({
          messages: history.map((m, i) => (i === history.length - 1 ? m : { role: m.role, content: textOf(m.content) || "(rasm)" })),
          medications,
          lang: responseLangForText(textOf(content)),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = response.status === 429 ? "Juda ko‘p so‘rovlar. Biroz kuting."
          : response.status === 402 ? "Med Coin yetarli emas. Balansni to‘ldiring."
          : response.status === 401 ? "Davom etish uchun tizimga kiring."
          : response.status === 403 ? (body?.error || "Tarifingiz bu xizmatni o‘z ichiga olmaydi.")
          : "AI xizmati vaqtincha javob bermadi.";
        toast.error(msg);
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
        return;
      }
      let assistant = "";
      await consumeAiStream(response, (delta) => {
        assistant += delta;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && next.length > history.length) next[next.length - 1] = { role: "assistant", content: assistant };
          else next.push({ role: "assistant", content: assistant });
          return next;
        });
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") toast.error(navigator.onLine ? "Xatolik yuz berdi. Qaytadan urinib ko‘ring." : "Internet aloqasi yo‘q.");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const sendText = (text = input) => { if (text.trim()) void send(text.trim().slice(0, 2000)); };

  const onPick = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Faqat rasm yuklang"); return; }
    try { setPreview(await compressImage(file)); } catch { toast.error("Rasmni o‘qib bo‘lmadi"); }
  };

  const analyzeScan = () => {
    if (!preview) return;
    const mode = SCAN_MODES.find((m) => m.id === scanMode)!;
    void send([{ type: "text", text: mode.prompt }, { type: "image_url", image_url: { url: preview } }]);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-background to-secondary/15 p-5 sm:p-8 mb-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Pill className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-4xl font-bold leading-tight">{t("ai.services.ai-farmatsevt.title")}</h1>
                <p className="text-sm text-muted-foreground mt-1">Dori qutisi yoki retseptni skanerlang — Med AI nomi, dozasi, analoglari va xavflarini tushuntiradi.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[{ i: ScanLine, l: "Skaner" }, { i: AlertTriangle, l: "O‘zaro ta’sir" }, { i: Repeat, l: "Analoglar" }].map(({ i: I, l }) => (
                <div key={l} className="rounded-xl bg-background/70 border p-2 sm:p-3 text-center">
                  <I className="h-4 w-4 mx-auto text-primary" /><p className="text-[11px] sm:text-xs font-medium mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <AIServiceUsageGuide
            serviceName={t("ai.services.ai-farmatsevt.title")}
            steps={[
              { title: t("aiPages.ai-farmatsevt.s1t"), desc: t("aiPages.ai-farmatsevt.s1d") },
              { title: t("aiPages.ai-farmatsevt.s2t"), desc: t("aiPages.ai-farmatsevt.s2d") },
              { title: t("aiPages.ai-farmatsevt.s3t"), desc: t("aiPages.ai-farmatsevt.s3d") },
            ]}
          />

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="scan" className="min-h-10 gap-1.5"><ScanLine className="h-4 w-4" /> Skaner</TabsTrigger>
              <TabsTrigger value="meds" className="min-h-10 gap-1.5"><Pill className="h-4 w-4" /> Dorilarim{medications.length > 0 && ` (${medications.length})`}</TabsTrigger>
              <TabsTrigger value="chat" className="min-h-10 gap-1.5"><Bot className="h-4 w-4" /> Suhbat</TabsTrigger>
            </TabsList>

            <TabsContent value="scan" className="mt-4">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {SCAN_MODES.map((m) => (
                      <button key={m.id} type="button" onClick={() => setScanMode(m.id)} aria-pressed={scanMode === m.id}
                        className={`rounded-xl border p-3 text-left transition min-h-20 ${scanMode === m.id ? "border-primary bg-primary/10" : "hover:border-primary/40"}`}>
                        <m.icon className="h-5 w-5 text-primary" />
                        <p className="text-xs font-semibold mt-1.5">{m.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight hidden min-[400px]:block">{m.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="relative aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/30 bg-muted/30 overflow-hidden flex items-center justify-center">
                    {preview ? (
                      <>
                        <img src={preview} alt="Skanerlanayotgan dori" className="h-full w-full object-contain" />
                        <button type="button" onClick={() => setPreview(null)} aria-label="Rasmni olib tashlash" className="absolute top-2 right-2 h-10 w-10 rounded-full bg-background/90 flex items-center justify-center"><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <div className="text-center px-6">
                        <ScanLine className="h-12 w-12 mx-auto text-primary/60" />
                        <p className="text-sm font-medium mt-2">Dori nomi aniq ko‘rinsin</p>
                        <p className="text-xs text-muted-foreground mt-1">Yorug‘ joyda, yaltirashsiz, qutini to‘liq kadrga sig‘diring</p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-6 rounded-xl border border-primary/40" />
                  </div>

                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Kamera" onChange={(e) => { void onPick(e.target.files?.[0]); e.target.value = ""; }} />
                  <input ref={galleryRef} type="file" accept="image/*" className="hidden" aria-label="Galereya" onChange={(e) => { void onPick(e.target.files?.[0]); e.target.value = ""; }} />

                  {preview ? (
                    <Button onClick={analyzeScan} disabled={isLoading} className="w-full min-h-12 gap-2 text-base">
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />} Med AI bilan tahlil qilish
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => cameraRef.current?.click()} className="min-h-12 gap-2"><Camera className="h-5 w-5" /> Suratga olish</Button>
                      <Button variant="outline" onClick={() => galleryRef.current?.click()} className="min-h-12 gap-2"><ImagePlus className="h-5 w-5" /> Galereyadan</Button>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground text-center">Rasm faqat tahlil uchun yuboriladi va saqlanmaydi.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meds" className="mt-4">
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2"><CardTitle className="text-base flex items-center gap-2"><Pill className="h-5 w-5" /> Ichayotgan dorilarim</CardTitle></CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
                  <div className="flex gap-2">
                    <Input value={newMed} onChange={(e) => setNewMed(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMedication()} placeholder={t("aiForms.pharmacist.drugPlaceholder")} className="flex-1 min-h-11" />
                    <Button size="icon" className="h-11 w-11" onClick={() => addMedication()} aria-label="Qo‘shish"><Plus className="h-4 w-4" /></Button>
                  </div>
                  {medications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">O‘zaro ta’sirni tekshirish uchun kamida 2 ta dori qo‘shing</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {medications.map((med) => (
                        <span key={med} className="inline-flex items-center gap-1 rounded-full bg-muted pl-3 pr-1 py-1 text-sm">
                          {med}
                          <button type="button" className="h-8 w-8 rounded-full hover:bg-background flex items-center justify-center" onClick={() => setMedications((m) => m.filter((x) => x !== med))} aria-label={`${med} ni olib tashlash`}><X className="h-3.5 w-3.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <Button disabled={medications.length < 2 || isLoading} onClick={() => sendText(`Bu dorilar orasidagi o‘zaro ta’sirni tekshiring va xavf darajasini jadvalda ko‘rsating: ${medications.join(", ")}`)} variant="destructive" className="w-full min-h-11 gap-2">
                    <AlertTriangle className="h-4 w-4" /> O‘zaro ta’sirni tekshirish
                  </Button>
                  <div className="pt-3 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Tezkor vositalar {medications[0] ? `— ${medications[0]}` : ""}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {QUICK_TOOLS.map((q) => (
                        <Button key={q.label} variant="outline" size="sm" className="min-h-11 justify-start gap-2 text-xs" disabled={isLoading} onClick={() => sendText(q.build(medications[0] ?? ""))}>
                          <q.icon className="h-4 w-4 text-primary shrink-0" /> {q.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base flex items-center gap-2"><Bot className="h-5 w-5" /> Farmatsevt bilan suhbat</CardTitle>
                  {messages.length > 0 && (
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setMessages([])} disabled={isLoading}><Trash2 className="h-3.5 w-3.5" /> Tozalash</Button>
                  )}
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-2">
                  <div className="h-[55vh] sm:h-[500px] overflow-y-auto pr-1 mb-3">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-10 px-4">
                        <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-2">Salom! Men Med AI farmatsevtman.</p>
                        <p className="text-sm">Dori nomini yozing yoki “Skaner” bo‘limida qutini suratga oling.</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {["Paratsetamol dozasi", "Antibiotik qoidalari", "Ibuprofen va bosim dorisi"].map((q) => (
                            <button key={q} type="button" onClick={() => sendText(q)} className="text-xs rounded-full border px-3 py-2 hover:border-primary/50">{q}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, i) => {
                          const img = imageOf(msg.content);
                          return (
                            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                              {msg.role === "assistant" && <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>}
                              <div className={`min-w-0 max-w-[85%] rounded-2xl px-3 py-2.5 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
                                {img && <img src={img} alt="Yuborilgan rasm" className="mb-2 max-h-40 rounded-lg object-cover" />}
                                {msg.role === "assistant" ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_table]:block [&_table]:overflow-x-auto [&_table]:text-xs">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{textOf(msg.content)}</ReactMarkdown>
                                  </div>
                                ) : <p className="text-sm break-words">{textOf(msg.content)}</p>}
                              </div>
                              {msg.role === "user" && <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="h-4 w-4 text-primary" /></div>}
                            </div>
                          );
                        })}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2 pl-10"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Med AI tahlil qilmoqda…</p>
                        )}
                        <div ref={scrollRef} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => { setTab("scan"); setTimeout(() => cameraRef.current?.click(), 50); }} aria-label="Dorini skanerlash"><Camera className="h-4 w-4" /></Button>
                    <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendText()} placeholder={t("aiForms.pharmacist.chatPlaceholder")} disabled={isLoading} className="flex-1 min-h-11" />
                    {isLoading ? (
                      <Button className="h-11 w-11 shrink-0" size="icon" variant="outline" onClick={() => abortRef.current?.abort()} aria-label="To‘xtatish"><Square className="h-4 w-4" /></Button>
                    ) : (
                      <Button className="h-11 w-11 shrink-0" size="icon" onClick={() => sendText()} disabled={!input.trim()} aria-label="Yuborish"><Send className="h-4 w-4" /></Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-4 p-3 rounded-xl border border-medical-orange/30 bg-medical-orange/10 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-medical-orange mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Bu ma’lumot faqat ma’lumot maqsadida, tashxis yoki retsept emas. Dorini qabul qilishdan oldin shifokor yoki farmatsevt bilan maslahatlashing. Shoshilinch holatda — 103.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AIFarmatsevtPage;
