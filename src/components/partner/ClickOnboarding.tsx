import { useState } from "react";
import { Button } from "@/components/ui/button";
import s1 from "@/assets/click-onb-1.jpg";
import s2 from "@/assets/click-onb-2.jpg";
import s3 from "@/assets/click-onb-3.jpg";
import s4 from "@/assets/click-onb-4.jpg";
import partnershipLogo from "@/assets/click-med-all-partnership.png";

const KEY = "med1.clickOnboarding.v3";
const slides = [
  { img: s1, title: "Click × MED ALL", text: "Med AI va shaxsiy profilingiz — bir joyda." },
  { img: s1, title: "Med AI shifokor yordamchisi", text: "Shikoyatingizni yozing — AI 24/7 javob beradi va mutaxassisni tavsiya qiladi." },
  { img: s2, title: "Vital AI: puls va stress", text: "Telefon kamerasi orqali yurak ritmi, nafas va stressni tekshiring." },
  { img: s3, title: "Tahlillarni AI o'qiydi", text: "Laboratoriya natijasini rasmga oling — tushunarli xulosa oling." },
  { img: s4, title: "Oila uchun AI xizmatlar", text: "Homiladorlik, bola parvarishi, dietolog va farmatsevt AI bir joyda." },
];

export function clickOnboardingSeen() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return true; }
}

export default function ClickOnboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const finish = () => { try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } onDone(); };
  const s = slides[i];
  const last = i === slides.length - 1;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Click × MED ALL tanishuv">
      {i === 0 && <div className="flex shrink-0 justify-center bg-card px-6 pb-3 pt-14"><img src={partnershipLogo} alt="Click × MED ALL hamkorligi" width={1536} height={512} className="h-24 w-full max-w-sm object-contain" /></div>}
      <div className="relative flex-1 overflow-hidden">
        <img key={s.img} src={s.img} alt={s.title} width={768} height={1024} className="h-full w-full object-cover animate-fade-in" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        <Button variant="secondary" size="sm" onClick={finish} className="absolute right-4 top-4">O'tkazib yuborish</Button>
      </div>
      <div className="mx-auto w-full max-w-md px-6 pb-8 pt-2 text-center">
        <h2 className="text-2xl font-semibold">{s.title}</h2>
        <p className="mt-2 text-muted-foreground">{s.text}</p>
        <div className="my-5 flex justify-center gap-2">
          {slides.map((_, k) => (
            <Button key={k} variant="ghost" size="icon" aria-label={`${k + 1}-sahifa`} aria-pressed={k===i} onClick={() => setI(k)} className="h-6 w-6 p-0"><span className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-primary" : "w-2 bg-muted"}`} /></Button>
          ))}
        </div>
        <Button className="h-12 w-full" onClick={() => (last ? finish() : setI(i + 1))}>{last ? "Boshlash" : "Keyingi"}</Button>
      </div>
    </div>
  );
}
