import { useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import s1 from "@/assets/ai_doctor_cover.webp";
import s2 from "@/assets/ai_vitals_cover.webp";
import s3 from "@/assets/ai_laboratory_cover.webp";
import s4 from "@/assets/ai_baby_care_cover.webp";
import partnershipLogo from "@/assets/click_med_all_logo_header.webp";

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
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; if(previous instanceof HTMLElement) previous.focus(); };
  }, []);
  useEffect(() => { const next = slides[i + 1]; if(next) { const image = new Image(); image.src = next.img; } }, [i]);
  const finish = () => { try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } onDone(); };
  const s = slides[i];
  const last = i === slides.length - 1;
  return (
    <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-y-auto bg-background" role="dialog" aria-modal="true" aria-label="Click × MED ALL tanishuv" onKeyDown={event => { if(event.key==='Escape') finish(); if(event.key==='Tab') { const controls=event.currentTarget.querySelectorAll<HTMLButtonElement>('button'); const first=controls[0]; const lastControl=controls[controls.length-1]; if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastControl?.focus();}else if(!event.shiftKey&&document.activeElement===lastControl){event.preventDefault();first?.focus();} } }}>
      <header className="flex shrink-0 items-center justify-between gap-3 bg-card px-5 py-5"><img src={partnershipLogo} alt="Click × MED ALL hamkorligi" width={700} height={90} fetchPriority="high" className="h-auto w-64 max-w-[80%] rounded bg-card p-1" /><Button ref={closeRef} variant="ghost" size="icon" aria-label="Tanishtiruvni yopish" onClick={finish}><X/></Button></header>
      <div className="relative mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-hidden">
        <img key={s.img} src={s.img} alt={s.title} width={768} height={512} fetchPriority="high" loading="eager" decoding="async" className="h-full min-h-48 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        <Button variant="secondary" size="sm" onClick={finish} className="absolute right-4 top-4">O'tkazib yuborish</Button>
      </div>
      <div className="mx-auto w-full max-w-md px-6 pb-8 pt-2 text-center">
        <h2 className="text-2xl font-semibold">{s.title}</h2>
        <p className="mt-2 text-muted-foreground">{s.text}</p>
        <div className="my-3 flex justify-center gap-2">
          {slides.map((_, k) => (
            <Button key={k} variant="ghost" size="icon" aria-label={`${k + 1}-sahifa`} aria-pressed={k===i} onClick={() => setI(k)} className="h-6 w-6 p-0"><span className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-primary" : "w-2 bg-muted"}`} /></Button>
          ))}
        </div>
        <div className="flex gap-2">{i > 0 && <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" aria-label="Oldingi sahifa" onClick={() => setI(i-1)}><ArrowLeft/></Button>}<Button className="h-12 w-full" onClick={() => (last ? finish() : setI(i + 1))}>{last ? "Boshlash" : "Keyingi"}</Button></div>
      </div>
    </div>
  );
}
