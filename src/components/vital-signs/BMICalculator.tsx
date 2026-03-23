import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Scale, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSave?: (bmi: number, height: number, weight: number) => void;
  onCalculated?: (bmi: number) => void;
  saving?: boolean;
}

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: "Kam vazn", color: "text-blue-500", bg: "bg-blue-500", advice: "Vazn oshirish tavsiya etiladi" };
  if (bmi < 25) return { label: "Normal", color: "text-green-500", bg: "bg-green-500", advice: "Sog'lom vazn darajasi" };
  if (bmi < 30) return { label: "Ortiqcha vazn", color: "text-amber-500", bg: "bg-amber-500", advice: "Vazn kamaytirishga harakat qiling" };
  return { label: "Semizlik", color: "text-red-500", bg: "bg-red-500", advice: "Shifokorga murojaat qiling" };
};

const BMICalculator = ({ onSave, onCalculated, saving }: Props) => {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const bmi = height && weight ? parseFloat(weight) / (parseFloat(height) / 100) ** 2 : null;
  const bmiRounded = bmi ? Math.round(bmi * 10) / 10 : null;
  const info = bmiRounded ? getBMICategory(bmiRounded) : null;

  const handleCalc = () => {
    if (bmiRounded) onCalculated?.(bmiRounded);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">BMI Kalkulyator</h3>
          <p className="text-xs text-muted-foreground">Tana massa indeksi</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground">Bo'y (sm)</Label>
          <Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="170" min={100} max={250} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Vazn (kg)</Label>
          <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" min={20} max={300} className="mt-1" />
        </div>
      </div>
      {bmiRounded && info && (
        <div className="bg-muted/50 rounded-xl p-4 mb-3 text-center">
          <p className="text-4xl font-bold text-foreground mb-1">{bmiRounded}</p>
          <p className="text-xs text-muted-foreground mb-2">BMI</p>
          <p className={cn("text-sm font-semibold", info.color)}>{info.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{info.advice}</p>
          <div className="w-full bg-muted rounded-full h-2 mt-3">
            <div className={cn("h-2 rounded-full transition-all", info.bg)} style={{ width: `${Math.min((bmiRounded / 40) * 100, 100)}%` }} />
          </div>
        </div>
      )}
      <Button
        size="sm"
        disabled={!bmiRounded || saving}
        onClick={() => onSave?.(bmiRounded!, parseFloat(height), parseFloat(weight))}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-400 text-white border-0"
      >
        <Save className="w-3.5 h-3.5 mr-1" /> Saqlash
      </Button>
    </div>
  );
};

export default BMICalculator;
