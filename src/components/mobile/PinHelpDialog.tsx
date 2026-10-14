import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const sections = [
  { t: "PIN nima?", b: "Med ALL PIN — telefoningizdagi ilovani begonalardan himoya qiluvchi 5 xonali shaxsiy kod. U hisob parolingizdan alohida va faqat shu telefonda saqlanadi." },
  { t: "Qanday o‘rnatiladi?", b: "Profil → Xavfsizlik → Ilova qulfi → “PIN-kod”. 5 ta raqam kiriting va tasdiqlash uchun yana bir marta tering. Keyin xohlasangiz barmoq izi / Face ID ni ham yoqing." },
  { t: "Qanday PIN mumkin emas?", b: "Bir xil raqamlar (11111, 00000), ketma-ket raqamlar (12345, 54321) va oson takrorlanuvchi kodlar (12121) qabul qilinmaydi." },
  { t: "Qanday tiklanadi?", b: "Qulf ekranida “Kodni unutdim” ni bosing — hisobdan chiqasiz va qulf o‘chadi. Hisobingizga parol bilan qayta kiring va yangi PIN o‘rnating." },
  { t: "Xavfsizlik", b: "5 marta xato kiritilsa, ilova 10 daqiqaga bloklanadi. PIN shifrlangan holda telefon xavfsiz xotirasida saqlanadi." },
];

export const PinHelpDialog = ({ className }: { className?: string }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon" className={className} aria-label="PIN haqida yordam"><CircleHelp className="h-5 w-5" /></Button>
    </DialogTrigger>
    <DialogContent className="z-[260] max-h-[85dvh] max-w-sm overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Med ALL PIN haqida</DialogTitle>
        <DialogDescription>Eslatma: PIN-kodni hech kimga aytmang.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.t} className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-semibold">{s.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.b}</p>
          </div>
        ))}
      </div>
      <DialogClose asChild><Button className="w-full">Tushunarli</Button></DialogClose>
    </DialogContent>
  </Dialog>
);
