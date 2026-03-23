import { cn } from "@/lib/utils";
import { Shield, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  pulse?: number | null;
  systolic?: number | null;
  diastolic?: number | null;
  spo2?: number | null;
  bmi?: number | null;
}

const calculateScore = (p: Props): { score: number; level: string; color: string; icon: any; details: string[] } => {
  let total = 0;
  let count = 0;
  const details: string[] = [];

  if (p.pulse) {
    count++;
    if (p.pulse >= 60 && p.pulse <= 100) { total += 100; details.push("✅ Puls normal"); }
    else if (p.pulse >= 50 && p.pulse <= 110) { total += 70; details.push("⚠️ Puls biroz me'yordan tashqari"); }
    else { total += 30; details.push("🔴 Puls xavfli darajada"); }
  }

  if (p.systolic && p.diastolic) {
    count++;
    if (p.systolic <= 120 && p.diastolic <= 80) { total += 100; details.push("✅ Qon bosimi normal"); }
    else if (p.systolic <= 140 && p.diastolic <= 90) { total += 65; details.push("⚠️ Qon bosimi biroz yuqori"); }
    else { total += 25; details.push("🔴 Qon bosimi xavfli darajada"); }
  }

  if (p.spo2) {
    count++;
    if (p.spo2 >= 95) { total += 100; details.push("✅ Kislorod darajasi normal"); }
    else if (p.spo2 >= 90) { total += 60; details.push("⚠️ Kislorod darajasi past"); }
    else { total += 20; details.push("🔴 Kislorod darajasi xavfli"); }
  }

  if (p.bmi) {
    count++;
    if (p.bmi >= 18.5 && p.bmi < 25) { total += 100; details.push("✅ BMI normal"); }
    else if (p.bmi >= 16 && p.bmi < 30) { total += 60; details.push("⚠️ BMI me'yordan tashqari"); }
    else { total += 25; details.push("🔴 BMI xavfli darajada"); }
  }

  if (count === 0) return { score: 0, level: "Ma'lumot yo'q", color: "text-muted-foreground", icon: Shield, details: ["Kamida bitta ko'rsatkichni kiriting"] };

  const score = Math.round(total / count);
  if (score >= 85) return { score, level: "A'lo", color: "text-green-500", icon: CheckCircle2, details };
  if (score >= 65) return { score, level: "Yaxshi", color: "text-amber-500", icon: TrendingUp, details };
  return { score, level: "Nazorat talab qiladi", color: "text-red-500", icon: AlertTriangle, details };
};

const HealthScoreCard = (props: Props) => {
  const { score, level, color, icon: Icon, details } = calculateScore(props);
  const hasData = (props.pulse || props.systolic || props.spo2 || props.bmi);

  if (!hasData) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
          score >= 85 ? "bg-gradient-to-br from-green-500 to-emerald-400" :
          score >= 65 ? "bg-gradient-to-br from-amber-500 to-yellow-400" :
          "bg-gradient-to-br from-red-500 to-rose-400"
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Umumiy sog'liq bahosi</h3>
          <p className="text-xs text-muted-foreground">Barcha ko'rsatkichlar asosida</p>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" className="stroke-muted" />
            <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 314} 314`}
              className={cn(
                score >= 85 ? "stroke-green-500" :
                score >= 65 ? "stroke-amber-500" : "stroke-red-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", color)}>{score}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>
        <p className={cn("text-sm font-semibold mt-2", color)}>{level}</p>
      </div>

      <div className="space-y-1.5">
        {details.map((d, i) => (
          <p key={i} className="text-xs text-muted-foreground">{d}</p>
        ))}
      </div>
    </div>
  );
};

export default HealthScoreCard;
