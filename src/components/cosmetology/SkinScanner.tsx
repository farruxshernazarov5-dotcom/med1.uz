import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Scan, Upload, Camera, Loader2, Droplets, Zap, Palette, Heart, X,
  AlertTriangle, Sun, Glasses, Move, CheckCircle2, Info, Sparkles,
} from "lucide-react";

const SKIN_TYPES = [
  { value: "dry", label: "Quruq", icon: Droplets, desc: "Tarang, po'stloq" },
  { value: "oily", label: "Yog'li", icon: Zap, desc: "Yaltiroq, keng teshiklar" },
  { value: "combination", label: "Aralash", icon: Palette, desc: "T-zona yog'li" },
  { value: "sensitive", label: "Sezgir", icon: Heart, desc: "Qizarish, irritatsiya" },
];

const CONCERNS = [
  "Akne / toshmalar", "Pigmentatsiya", "Ajinlar", "Qora doqlar",
  "Kengaygan teshiklar", "Quruqlik", "Yog'lilik", "Qizarish",
  "Teri elastikligi pasayishi", "Quyosh dog'lari", "Qora nuqtalar", "Teri qurilishi",
];

const PHOTO_TIPS = [
  { icon: Sun, text: "Yaxshi yoritilgan xonada suratga oling", color: "text-amber-500" },
  { icon: Glasses, text: "Ko'zoynak va aksessuarlarni olib tashlang", color: "text-blue-500" },
  { icon: Move, text: "Yuzingizni to'g'ridan-to'g'ri kameraga qarating", color: "text-emerald-500" },
  { icon: Camera, text: "Soch yuzni yopmasin, peshonani oching", color: "text-purple-500" },
];

interface Props {
  skinType: string;
  setSkinType: (v: string) => void;
  age: string;
  setAge: (v: string) => void;
  selectedConcerns: string[];
  toggleConcern: (c: string) => void;
  loading: boolean;
  onAnalyze: (mode: string, msg?: string, photoBase64?: string) => void;
}

const SkinScanner = ({ skinType, setSkinType, age, setAge, selectedConcerns, toggleConcern, loading, onAnalyze }: Props) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fayl hajmi 10MB dan oshmasligi kerak", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
      setShowTips(false);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileRef.current) fileRef.current.value = "";
    setShowTips(true);
  };

  const startScan = () => {
    if (!photoBase64) {
      toast({
        title: "📸 Yuz fotosurati kerak!",
        description: "Aniq tahlil uchun yuzingizning rasmini yuklang. Rasmsiz tahlil noto'g'ri natija berishi mumkin.",
        variant: "destructive",
      });
      return;
    }

    const msg = `AI Teri Skanerini ishga tushiring. Foydalanuvchi yuz fotosuratini yuklagan — AI Computer Vision tahlili amalga oshirilsin.\nTeri turi: ${skinType || "avtomatik aniqlang"}\nYosh: ${age || "noma'lum"}\nMuammolar: ${selectedConcerns.join(", ") || "ko'rsatilmagan"}\n\nBirinchi navbatda rasmni tahlil qiling:\n1. Yuz aniqlandi mi? (Face Detection)\n2. Rasm sifati yetarlimi?\n3. Yoritish yetarlimi?\n\nKeyin teri holatini batafsil tahlil qiling:\n1. Teri turi (avtomatik aniqlash)\n2. Akne va toshmalar darajasi (0-10)\n3. Pigmentatsiya darajasi (0-10)\n4. Ajinlar darajasi (0-10)\n5. Teri namligi (past/o'rta/yuqori)\n6. Teshiklar kengligi (tor/o'rta/keng)\n7. Teri elastikligi (past/o'rta/yuqori)\n8. Quyosh zarari darajasi\n9. Umumiy teri sog'ligi bali (1-100)\n\nHar bir ko'rsatkich uchun emoji indikator va progress bar ko'rsating.\nOxirida tavsiya etilgan muolajalar, mahsulotlar va kosmetolog ko'rigi kerakligi haqida xulosa bering.`;
    onAnalyze("skin-scan", msg, photoBase64);
  };

  return (
    <div className="space-y-6">
      {/* Photo Guide Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scan className="w-5 h-5 text-primary" />
            </div>
            AI Teri Skaneri
            <Badge variant="secondary" className="ml-auto text-[10px]">v2.1</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Face Photo Section */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Yuz fotosuratini yuklang
              <Badge variant="destructive" className="text-[10px] ml-1">Majburiy</Badge>
            </Label>

            {/* Photo Tips */}
            {showTips && (
              <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    To'g'ri natija uchun quyidagilarga amal qiling:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PHOTO_TIPS.map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                      <tip.icon className={`w-4 h-4 flex-shrink-0 ${tip.color}`} />
                      <span className="text-xs text-foreground">{tip.text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <strong>Muhim:</strong> Rasmsiz tahlil qilish imkonsiz. AI faqat haqiqiy fotosuratni tahlil qiladi.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 items-start">
              {photoPreview ? (
                <div className="relative group">
                  <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-lg">
                    <img src={photoPreview} alt="Yuz" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" variant="destructive" className="w-8 h-8" onClick={removePhoto}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-background shadow">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              ) : (
                <label className="w-36 h-36 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/20 group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Rasm yuklang</span>
                  <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhoto} />
                </label>
              )}
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {photoBase64
                    ? "✅ Rasm muvaffaqiyatli yuklandi. Endi AI tahlil boshlashingiz mumkin."
                    : "Yuz fotosuratini yuklang — AI teriningiz holatini batafsil tahlil qiladi."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-1" /> Galereyadan
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (fileRef.current) {
                      fileRef.current.setAttribute("capture", "user");
                      fileRef.current.click();
                    }
                  }}>
                    <Camera className="w-4 h-4 mr-1" /> Selfie
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Skin type */}
          <div>
            <Label className="text-base font-medium mb-3 block">Teri turingiz (ixtiyoriy — AI avtomatik aniqlaydi)</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SKIN_TYPES.map((st) => (
                <button key={st.value} onClick={() => setSkinType(skinType === st.value ? "" : st.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${skinType === st.value ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:border-primary/30"}`}>
                  <st.icon className={`w-6 h-6 mx-auto mb-2 ${skinType === st.value ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-medium text-sm text-foreground">{st.label}</p>
                  <p className="text-xs text-muted-foreground">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <Label>Yoshingiz</Label>
            <Input type="number" placeholder="Masalan: 28" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 max-w-xs" />
          </div>

          {/* Concerns */}
          <div>
            <Label className="text-base font-medium mb-3 block">Teri muammolari (ixtiyoriy)</Label>
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map((c) => (
                <Badge key={c} variant={selectedConcerns.includes(c) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3 transition-all hover:scale-105" onClick={() => toggleConcern(c)}>
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          {/* Scan Button */}
          <Button
            size="lg"
            className={`w-full text-base h-14 transition-all ${photoBase64 ? "bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg" : ""}`}
            onClick={startScan}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI tahlil qilmoqda...
              </>
            ) : photoBase64 ? (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                📸 AI Teri Skanerini Boshlash
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Avval yuz fotosuratini yuklang
              </>
            )}
          </Button>

          {!photoBase64 && (
            <p className="text-center text-xs text-muted-foreground">
              ⚠️ Foto yuklanmagan. Aniq natija olish uchun yuzingizning aniq fotosuratini yuklang.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SkinScanner;
