import { useState } from "react";
import SectionLayout from "@/components/SectionLayout";
import { Heart, Apple, Dumbbell, Brain, Moon, Cross, Droplets, Shield, ChevronRight, BookOpen } from "lucide-react";

import healthNutrition from "@/assets/health-nutrition.jpg";
import healthExercise from "@/assets/health-exercise.jpg";
import healthMental from "@/assets/health-mental.jpg";
import healthSleep from "@/assets/health-sleep.jpg";
import healthFirstaid from "@/assets/health-firstaid.jpg";
import healthVitamins from "@/assets/health-vitamins.jpg";
import healthWater from "@/assets/health-water.jpg";
import healthPrevention from "@/assets/health-prevention.jpg";

const healthCategories = [
  {
    id: "nutrition",
    title: "To'g'ri ovqatlanish",
    icon: Apple,
    image: healthNutrition,
    color: "from-medical-green to-medical-teal",
    description: "Sog'lom ovqatlanish asoslari va foydali parhezlar",
    tips: [
      { title: "Kundalik ratsion", text: "Har kuni kamida 5 porsiya meva va sabzavot iste'mol qiling. JSST tavsiyasiga ko'ra, kattalar uchun kuniga 400g meva-sabzavot tavsiya etiladi." },
      { title: "Oqsillar", text: "Tana uchun zarur aminokislotalarni olish uchun go'sht, baliq, tuxum, dukkaklilar va sut mahsulotlarini muntazam iste'mol qiling." },
      { title: "Sog'lom yog'lar", text: "Zaytun moyi, yong'oq, avokado va baliq yog'lari omega-3 yog' kislotalari bilan boy bo'lib, yurak salomatligi uchun foydali." },
      { title: "Tuz va shakar", text: "Kuniga 5g dan ortiq tuz va 25g dan ortiq shakar iste'mol qilmaslik tavsiya etiladi (JSST)." },
    ],
  },
  {
    id: "exercise",
    title: "Jismoniy mashqlar",
    icon: Dumbbell,
    image: healthExercise,
    color: "from-medical-orange to-medical-red",
    description: "Muntazam jismoniy faollik va mashq dasturlari",
    tips: [
      { title: "Haftada 150 daqiqa", text: "JSST kattalar uchun haftada kamida 150 daqiqa o'rtacha intensivlikdagi aerobik faollikni tavsiya etadi." },
      { title: "Ertalabki mashqlar", text: "Har kuni 15-20 daqiqa ertalabki mashq qilish qon aylanishini yaxshilaydi va energiya beradi." },
      { title: "Yurish", text: "Kuniga 10,000 qadam yurish yurak-qon tomir kasalliklari xavfini 30% ga kamaytiradi." },
      { title: "Cho'zilish", text: "Har kuni 10 daqiqa cho'zilish mashqlari muskul elastikligini saqlaydi va og'riqlarni kamaytiradi." },
    ],
  },
  {
    id: "mental",
    title: "Ruhiy salomatlik",
    icon: Brain,
    image: healthMental,
    color: "from-medical-purple to-medical-blue",
    description: "Stress boshqarish va psixologik farovonlik",
    tips: [
      { title: "Meditatsiya", text: "Kuniga 10-15 daqiqa meditatsiya qilish stress va tashvish darajasini sezilarli kamaytiradi." },
      { title: "Ijtimoiy aloqalar", text: "Yaqinlar bilan muntazam muloqot depressiya xavfini kamaytiradi va hayot sifatini oshiradi." },
      { title: "Nafas mashqlari", text: "4-7-8 nafas olish texnikasi: 4 soniya nafas oling, 7 soniya ushlab turing, 8 soniya chiqaring." },
      { title: "Tabiatda yurish", text: "Haftada kamida 2 soat tabiatda bo'lish ruhiy salomatlikni yaxshilaydi (Buyuk Britaniya tadqiqotlari)." },
    ],
  },
  {
    id: "sleep",
    title: "Uyqu gigiyenasi",
    icon: Moon,
    image: healthSleep,
    color: "from-indigo-500 to-purple-600",
    description: "Sifatli uyqu va dam olish sirlari",
    tips: [
      { title: "7-9 soat uyqu", text: "Kattalar uchun tuniga 7-9 soat uyqu tavsiya etiladi. Kam uyqu immun tizimini zaiflashtirad." },
      { title: "Uyqu tartibi", text: "Har kuni bir xil vaqtda yotib, bir xil vaqtda turing. Bu biologik soatingizni tartibga soladi." },
      { title: "Ekranlardan uzoqlashing", text: "Uxlashdan 1 soat oldin telefon va kompyuterdan foydalanishni to'xtating." },
      { title: "Xona sharoiti", text: "Uyqu xonasi salqin (18-20°C), qorong'i va jimjit bo'lishi kerak." },
    ],
  },
  {
    id: "firstaid",
    title: "Birinchi yordam",
    icon: Cross,
    image: healthFirstaid,
    color: "from-medical-red to-red-700",
    description: "Shoshilinch tibbiy yordam ko'rsatish qoidalari",
    tips: [
      { title: "Yurak massaji (CPR)", text: "Ko'krak qafasining o'rtasiga 5-6 sm chuqurlikda, daqiqada 100-120 marta bosing." },
      { title: "Qon ketganda", text: "Yaraga toza mato bosing va ustidan bog'lang. Oyoq-qo'lni yurak darajasidan yuqoriroq ko'taring." },
      { title: "Kuyishda", text: "Kuygan joyni 10-20 daqiqa salqin (sovuq emas!) suv ostida ushlab turing." },
      { title: "Bo'g'ilganda", text: "Geymlix usuli: orqadan quchoqlab, qorin sohasiga tez va kuchli bosim bering." },
    ],
  },
  {
    id: "vitamins",
    title: "Vitaminlar",
    icon: Heart,
    image: healthVitamins,
    color: "from-medical-teal to-medical-green",
    description: "Zarur vitaminlar, minerallar va ularning manbalari",
    tips: [
      { title: "Vitamin D", text: "Suyak salomatligi uchun muhim. Quyosh nuri, baliq yog'i va tuxum sardig'idan olinadi. Kuniga 600-800 IU tavsiya etiladi." },
      { title: "Vitamin C", text: "Immun tizimini mustahkamlaydi. Sitrus mevalari, qalampir va kivi dan boy. Kuniga 75-90 mg tavsiya etiladi." },
      { title: "Temir", text: "Qon kamligini oldini oladi. Qizil go'sht, ismaloq va dukkaklilardan olinadi." },
      { title: "Omega-3", text: "Miya va yurak salomatligi uchun. Yog'li baliq (salmon, sardina), zig'ir urug'i va yong'oqdan olinadi." },
    ],
  },
  {
    id: "water",
    title: "Suv ichish",
    icon: Droplets,
    image: healthWater,
    color: "from-sky-500 to-blue-600",
    description: "To'g'ri suv ichish odatlari va gidratatsiya",
    tips: [
      { title: "Kunlik norma", text: "Kattalar uchun kuniga 2-3 litr suv ichish tavsiya etiladi. Issiq havoda va jismoniy faollik paytida ko'proq." },
      { title: "Ertalab suv", text: "Uyg'onganingizdan so'ng 1-2 stakan iliq suv ichish moddalar almashinuvini tezlashtiradi." },
      { title: "Ovqatdan oldin", text: "Ovqatdan 30 daqiqa oldin suv ichish hazm qilishni yaxshilaydi va ortiqcha ovqatlanishni kamaytiradi." },
      { title: "Dehidratatsiya belgilari", text: "Bosh og'rig'i, charchoq, qorong'i siydik va quruq og'iz — suv yetishmaslik belgilari." },
    ],
  },
  {
    id: "prevention",
    title: "Profilaktika",
    icon: Shield,
    image: healthPrevention,
    color: "from-primary to-secondary",
    description: "Kasalliklarni oldini olish va tekshiruvlar",
    tips: [
      { title: "Yillik tekshiruv", text: "Yilda kamida 1 marta to'liq tibbiy tekshiruvdan o'ting. Qon tahlili, qon bosimi va boshqa asosiy ko'rsatkichlarni tekshiring." },
      { title: "Emlash", text: "Emlash jadvaliga rioya qiling. Grippga qarshi yillik emlash, ayniqsa, keksalar va surunkali kasallik bor odamlar uchun muhim." },
      { title: "Gigiyena", text: "Qo'llarni muntazam yuvish infeksion kasalliklarning 50% dan ko'prog'ini oldini oladi (JSST)." },
      { title: "Tish salomatligi", text: "Kuniga 2 marta tish yuvish va 6 oyda 1 marta stomatologga borish tavsiya etiladi." },
    ],
  },
];

const HealthPage = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <SectionLayout
      title="Salomatlik bo'limi"
      subtitle="5,000+ salomatlik haqida ma'lumotlar"
      icon={<Heart className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Featured categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {healthCategories.slice(0, 4).map((cat, idx) => (
          <div
            key={cat.id}
            className="group relative rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer animate-fade-up"
            style={{ animationDelay: `${idx * 100}ms` }}
            onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-60`} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                    <cat.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-primary-foreground">{cat.title}</h3>
                    <p className="text-primary-foreground/80 text-sm">{cat.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {expandedCategory === cat.id && (
              <div className="p-5 bg-card space-y-3 animate-fade-up">
                {cat.tips.map((tip) => (
                  <div key={tip.title} className="flex gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{tip.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expandedCategory !== cat.id && (
              <div className="p-4 bg-card flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{cat.tips.length} ta maslahat</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Secondary categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthCategories.slice(4).map((cat, idx) => (
          <div
            key={cat.id}
            className="group rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer animate-fade-up"
            style={{ animationDelay: `${(idx + 4) * 100}ms` }}
            onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-50`} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2">
                  <cat.icon className="w-5 h-5 text-primary-foreground" />
                  <h3 className="font-heading font-bold text-primary-foreground">{cat.title}</h3>
                </div>
              </div>
            </div>

            {expandedCategory === cat.id && (
              <div className="p-4 bg-card space-y-2 animate-fade-up">
                {cat.tips.map((tip) => (
                  <div key={tip.title} className="p-2.5 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-xs text-foreground">{tip.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.text}</p>
                  </div>
                ))}
              </div>
            )}

            {expandedCategory !== cat.id && (
              <div className="p-3 bg-card">
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Health facts banner */}
      <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
        <h3 className="font-heading text-xl font-bold mb-4">💡 Foydali faktlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { stat: "70%", label: "Kasalliklarning 70% ni sog'lom turmush tarzi orqali oldini olish mumkin" },
            { stat: "8 soat", label: "Yetarli uyqu immun tizimini 3 barobar mustahkamlaydi" },
            { stat: "30 daqiqa", label: "Kuniga 30 daqiqa yurish yurak xavfini 35% kamaytiradi" },
            { stat: "2.5 litr", label: "Kuniga 2.5 litr suv ichish moddalar almashinuvini tezlashtiradi" },
          ].map((fact) => (
            <div key={fact.stat} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-2xl font-bold mb-1">{fact.stat}</div>
              <p className="text-sm text-primary-foreground/80">{fact.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionLayout>
  );
};

export default HealthPage;
