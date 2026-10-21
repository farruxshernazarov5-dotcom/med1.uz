import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

// Existing results are preparation aids, not instructions to order new tests.
const tips = [
  { keys: ["kardiolog", "кардиолог"], symptoms: "Yurak urishining tezlashishi, qon bosimi o‘zgarishi, jismoniy zo‘riqishda hansirash", prepare: "Qon bosimi kundaligi, mavjud EKG va yurak tekshiruvlari", question: "Qon bosimini qanday kuzataman va qaysi jismoniy faollik mos?" },
  { keys: ["nevrolog", "невролог", "невропатолог"], symptoms: "Takroriy bosh og‘rig‘i, uvishish, bosh aylanishi", prepare: "Og‘riq kundaligi, mavjud MRT yoki KT xulosalari", question: "Alomatlarni nima kuchaytiradi va qachon qayta ko‘rinish kerak?" },
  { keys: ["ginekolog", "гинеколог"], symptoms: "Hayz sikli buzilishi, chanoq sohasida og‘riq, homiladorlikni rejalashtirish", prepare: "Hayz sanalari, mavjud UTT va oldingi tekshiruv xulosalari", question: "Qaysi tekshiruvlar zarur va keyingi nazorat qachon?" },
  { keys: ["pediatr", "педиатр"], symptoms: "Bolada takroriy kasallanish, o‘sish yoki ovqatlanish bo‘yicha xavotir", prepare: "Emlash kartasi, bolaning vazn va bo‘y ko‘rsatkichlari", question: "Uyda nimalarni kuzatish va qaysi belgida tez murojaat qilish kerak?" },
  { keys: ["stomatolog", "стоматолог", "dentist"], symptoms: "Tish og‘rig‘i, milk qonashi, chaynashdagi noqulaylik", prepare: "Mavjud tish suratlari, allergiyalar va oldingi muolajalar ro‘yxati", question: "Davolash variantlari, narxi va parvarish tartibi qanday?" },
  { keys: ["dermatolog", "дерматолог"], symptoms: "Toshma, qichishish, teri yoki xol ko‘rinishining o‘zgarishi", prepare: "Teri o‘zgarishlari suratlari, ishlatilgan kremlar ro‘yxati", question: "Qaysi vositalardan saqlanish va terini qanday parvarish qilish kerak?" },
  { keys: ["endokrinolog", "эндокринолог"], symptoms: "Kuchli chanqash, vazn o‘zgarishi, doimiy holsizlik", prepare: "Mavjud glyukoza va gormon tahlillari, vazn kundaligi", question: "Qaysi ko‘rsatkichlarni va qanchalik tez-tez nazorat qilish kerak?" },
  { keys: ["urolog", "уролог"], symptoms: "Siyishdagi og‘riq, tez-tez siyish, bel yonida noqulaylik", prepare: "Mavjud siydik tahlili va UTT xulosalari", question: "Qaytalanishning oldini olish uchun nima qilish kerak?" },
  { keys: ["lor", "лор", "otorino", "оторино"], symptoms: "Quloq og‘rig‘i, eshitish pasayishi, uzoq davom etuvchi burun bitishi", prepare: "Oldingi eshitish tekshiruvlari, qo‘llangan tomchilar ro‘yxati", question: "Eshitish yoki nafas olishni tekshirish zarurmi?" },
  { keys: ["oftalmolog", "офтальмолог", "окулист"], symptoms: "Ko‘rish xiralashishi, ko‘z qurishi, ko‘zdagi noqulaylik", prepare: "Ko‘zoynak yoki linza retsepti, oldingi ko‘z tekshiruvlari", question: "Ko‘zoynakni yangilash va ko‘z bosimini tekshirish kerakmi?" },
  { keys: ["gastroenterolog", "гастроэнтеролог"], symptoms: "Qorin og‘rig‘i, jig‘ildon qaynashi, ich kelishining o‘zgarishi", prepare: "Ovqatlanish kundaligi, mavjud UTT va endoskopiya xulosalari", question: "Qaysi ovqatlar alomatlarni kuchaytirishi mumkin?" },
  { keys: ["ortoped", "ортопед", "travmatolog", "травматолог"], symptoms: "Bo‘g‘im yoki bel og‘rig‘i, harakat cheklanishi, jarohatdan keyingi noqulaylik", prepare: "Mavjud rentgen yoki MRT, jarohat haqidagi hujjatlar", question: "Qanday yuklama va mashqlar xavfsiz?" },
  { keys: ["psixiatr", "psixolog", "психиатр", "психолог", "психотерап"], symptoms: "Uzoq davom etuvchi xavotir, tushkunlik, uyqu buzilishi", prepare: "Kayfiyat va uyqu kundaligi, qabul qilinayotgan dorilar ro‘yxati", question: "Yordam usullari va kuzatuv rejasi qanday bo‘ladi?" },
  { keys: ["terapevt", "терапевт"], symptoms: "Holsizlik, uzoq davom etuvchi yo‘tal, takroriy umumiy shikoyatlar", prepare: "Harorat kundaligi, mavjud umumiy tahlillar va kasallik tarixi", question: "Qaysi tekshiruvlar va boshqa mutaxassis maslahati zarur?" },
];
const generic = { symptoms: "Davom etayotgan yoki takrorlanayotgan shikoyatlar, profilaktik ko‘rik ehtiyoji", prepare: "Oldingi tekshiruvlar, kasallik tarixi va tibbiy hujjatlar", question: "Keyingi qadamlar, davolash variantlari va nazorat muddati qanday?" };

export default function DoctorAITips({ specialty }: { specialty?: string | null }) {
  const normalized = (specialty || "").toLocaleLowerCase();
  const tip = tips.find(t => t.keys.some(key => normalized.includes(key))) || generic;
  return (
    <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-6" aria-label="Med AI tavsiyasi">
      <h2 className="flex items-center gap-2 font-bold text-foreground"><Sparkles className="h-5 w-5 shrink-0 text-primary" />Med AI tavsiyasi</h2>
      <p className="mt-1 text-xs text-muted-foreground">{specialty || "Qabul"} uchun tayyorgarlik. Bu tibbiy tashxis emas.</p>
      <div className="mt-3 divide-y">
        {[["Qachon murojaat qilish kerak?", tip.symptoms], ["Qabulga nima tayyorlash kerak?", `${tip.prepare}. Dorilar va allergiyalar ro‘yxatini olib boring. Yangi tahlillarni faqat shifokor tavsiyasi bilan topshiring.`], ["Shifokorga qanday savollar berish kerak?", tip.question]].map(([title, text]) => (
          <details key={title} className="group">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-foreground">{title}</summary>
            <ul className="list-disc space-y-1 pb-3 pl-5 text-sm text-muted-foreground">{text.split(/, |\. /).map((item, i) => <li key={i}>{item}</li>)}</ul>
          </details>
        ))}
      </div>
      <nav className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap" aria-label="Med AI xizmatlari">
        {[["/symptom-checker", "Alomatlarni tekshirish"], ["/ai-doctor-chat", "AI shifokor bilan suhbat"], ["/ai-farmatsevt", "AI farmatsevt"]].map(([path, label]) => <Link key={path} to={path} className="flex min-h-11 items-center rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20">{label}</Link>)}
      </nav>
      <p className="mt-3 text-xs text-muted-foreground">To‘satdan kuchli ko‘krak og‘rig‘i, nafas yetishmasligi yoki hushdan ketishda qabulni kutmang — 103 ga qo‘ng‘iroq qiling.</p>
    </section>
  );
}
