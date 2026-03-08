import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Search, Plus, X, Loader2, Stethoscope } from "lucide-react";
import type { PatientInfo } from "./types";

const COMMON_SYMPTOMS = [
  "Bosh og'rig'i", "Isitma", "Yo'tal", "Burun bitishi", "Tomoq og'rig'i",
  "Ko'ngil aynishi", "Qorin og'rig'i", "Diareya", "Charchoq", "Bel og'rig'i",
  "Bo'g'im og'rig'i", "Toshma", "Ko'z qizarishi", "Quloq og'rig'i",
  "Nafas qisilishi", "Ko'krak og'rig'i", "Bosh aylanishi", "Uyqu buzilishi",
  "Ishtaha yo'qolishi", "Terlash", "Qon bosimi oshishi", "Yurak urishi tezlashishi",
  "Mushak og'rig'i", "Chanqash", "Tez-tez siydik ajratish",
];

const BODY_PARTS: { name: string; symptoms: string[] }[] = [
  { name: "🧠 Bosh", symptoms: ["Bosh og'rig'i", "Bosh aylanishi", "Migren"] },
  { name: "👁 Ko'z", symptoms: ["Ko'z qizarishi", "Ko'rish xiralashishi", "Ko'z og'rig'i"] },
  { name: "👂 Quloq", symptoms: ["Quloq og'rig'i", "Eshitish pasayishi", "Quloq shovqini"] },
  { name: "👃 Burun", symptoms: ["Burun bitishi", "Burundan qon ketishi"] },
  { name: "🫁 Ko'krak", symptoms: ["Ko'krak og'rig'i", "Nafas qisilishi", "Yurak urishi tezlashishi"] },
  { name: "🫄 Qorin", symptoms: ["Qorin og'rig'i", "Ko'ngil aynishi", "Diareya", "Qabziyat"] },
  { name: "🦴 Suyak/Bo'g'im", symptoms: ["Bo'g'im og'rig'i", "Bel og'rig'i", "Mushak og'rig'i"] },
  { name: "🩹 Teri", symptoms: ["Toshma", "Qichishish", "Shish"] },
];

interface Props {
  onAnalyze: (info: PatientInfo) => void;
  isLoading: boolean;
}

const SymptomInput = ({ onAnalyze, isLoading }: Props) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [duration, setDuration] = useState("");
  const [painLevel, setPainLevel] = useState([3]);
  const [existingConditions, setExistingConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const addCustomSymptom = () => {
    const trimmed = customSymptom.trim();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms((prev) => [...prev, trimmed]);
      setCustomSymptom("");
    }
  };

  const filteredSymptoms = searchQuery
    ? COMMON_SYMPTOMS.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    : COMMON_SYMPTOMS;

  const handleSubmit = () => {
    if (selectedSymptoms.length === 0) return;
    onAnalyze({
      symptoms: selectedSymptoms,
      age,
      gender,
      duration,
      painLevel: painLevel[0],
      existingConditions,
      allergies,
    });
  };

  return (
    <div className="space-y-6">
      {/* Selected symptoms */}
      {selectedSymptoms.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tanlangan simptomlar ({selectedSymptoms.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1">
                {s}
                <button onClick={() => toggleSymptom(s)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Body parts map */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Tana qismlari bo'yicha tanlash</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BODY_PARTS.map((part) => (
            <button
              key={part.name}
              onClick={() => setActiveBodyPart(activeBodyPart === part.name ? null : part.name)}
              className={`p-3 rounded-lg text-sm text-left transition-colors border ${
                activeBodyPart === part.name
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/50 border-transparent hover:bg-muted"
              }`}
            >
              {part.name}
            </button>
          ))}
        </div>
        {activeBodyPart && (
          <div className="mt-3 flex flex-wrap gap-2">
            {BODY_PARTS.find((p) => p.name === activeBodyPart)?.symptoms.map((s) => (
              <Badge
                key={s}
                variant={selectedSymptoms.includes(s) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSymptom(s)}
              >
                {selectedSymptoms.includes(s) ? "✓ " : "+ "}{s}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Symptom search + list */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Simptomlar ro'yxatidan tanlash</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Simptom qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {filteredSymptoms.map((s) => (
            <Badge
              key={s}
              variant={selectedSymptoms.includes(s) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => toggleSymptom(s)}
            >
              {selectedSymptoms.includes(s) ? "✓ " : ""}{s}
            </Badge>
          ))}
        </div>
      </div>

      {/* Custom symptom */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Boshqa simptom qo'shish</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Simptomni yozing..."
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomSymptom()}
          />
          <Button variant="outline" size="icon" onClick={addCustomSymptom}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Patient info */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Bemor ma'lumotlari</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Yosh</label>
            <Input type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Jins</label>
            <div className="flex gap-2">
              {[{ value: "male", label: "Erkak" }, { value: "female", label: "Ayol" }].map((g) => (
                <Button
                  key={g.value}
                  variant={gender === g.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setGender(g.value)}
                >
                  {g.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Davomiyligi</label>
            <Input placeholder="3 kun" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Og'riq darajasi: <strong>{painLevel[0]}/10</strong></label>
          <Slider value={painLevel} onValueChange={setPainLevel} max={10} min={1} step={1} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Yengil</span><span>O'rtacha</span><span>Kuchli</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Mavjud kasalliklar (ixtiyoriy)</label>
          <Textarea placeholder="Masalan: Qandli diabet, gipertoniya..." value={existingConditions} onChange={(e) => setExistingConditions(e.target.value)} rows={2} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Allergiyalar (ixtiyoriy)</label>
          <Input placeholder="Masalan: penitsillin" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={selectedSymptoms.length === 0 || isLoading}
        className="w-full bg-hero-gradient text-primary-foreground h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Tahlil qilinmoqda...</>
        ) : (
          <><Stethoscope className="w-5 h-5 mr-2" /> AI Tahlilni boshlash</>
        )}
      </Button>
    </div>
  );
};

export default SymptomInput;
