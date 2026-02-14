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
      { title: "Tolali ovqatlar", text: "Kuniga 25-30g tola iste'mol qiling. Non, guruch, makaron o'rniga to'liq donli mahsulotlarni tanlang. Tola hazm qilishni yaxshilaydi." },
      { title: "Fermentlangan mahsulotlar", text: "Yogurt, kefir, kimchi va kislokapusta ichak mikroflorasini yaxshilaydi va immun tizimini mustahkamlaydi." },
      { title: "Qahva va choy", text: "Kuniga 3-4 piyola yashil choy antioksidantlar bilan boy. Qahva 2-3 piyoladan oshmasin, chunki ortiqcha kofein uyquga ta'sir qiladi." },
      { title: "Parhez turlari", text: "O'rta er dengizi parhezi (meva, sabzavot, baliq, zaytun moyi) yurak kasalliklari xavfini 30% ga kamaytiradi (NEJM tadqiqoti)." },
      { title: "Ovqat vaqti", text: "Kechki ovqatni uxlashdan 3 soat oldin yeng. Kech ovqatlanish oshqozon refluksi va semirish xavfini oshiradi." },
      { title: "Kaloriya balansi", text: "O'rtacha faol erkak uchun 2,500 kkal, ayol uchun 2,000 kkal kundalik norma. Vaznni nazorat qilish uchun kaloriya hisoblang." },
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
      { title: "Kuch mashqlari", text: "Haftada 2-3 marta kuch mashqlari (squat, push-up, plank) suyak zichligini oshiradi va muskullarni mustahkamlaydi." },
      { title: "Suzish", text: "Suzish barcha muskullarni ishlatadi, bo'g'imlarga kam yuk tushadi. Haftada 2-3 marta 30 daqiqa suzish tavsiya etiladi." },
      { title: "Yoga", text: "Yoga moslashuvchanlikni oshiradi, stressni kamaytiradi va muvozanatni yaxshilaydi. Yangi boshlovchilar uchun hatha yoga tavsiya etiladi." },
      { title: "Velosiped haydash", text: "Kuniga 30 daqiqa velosiped haydash 300-500 kkal yoqadi va yurak-qon tomir tizimini mustahkamlaydi." },
      { title: "Interval mashqlar (HIIT)", text: "20-30 daqiqalik yuqori intensivlikdagi interval mashqlar moddalar almashinuvini 24-48 soatga tezlashtiradi." },
      { title: "Uzoq o'tirmaslik", text: "Har 30-60 daqiqada o'rningizdan turing va 2-3 daqiqa yuring. Uzoq o'tirish yurak kasalliklari xavfini oshiradi." },
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
      { title: "Kundalik yozish", text: "Har kuni 10 daqiqa his-tuyg'ularingizni yozib boring. Bu tashvishni kamaytiradi va o'z-o'zini anglashni kuchaytiradi." },
      { title: "Minnatdorlik amaliyoti", text: "Har kuni 3 ta minnatdor bo'lgan narsani yozing. Bu pozitiv fikrlashni shakllantiradi va baxt darajasini oshiradi." },
      { title: "Ekran vaqtini cheklash", text: "Ijtimoiy tarmoqlarda kuniga 30 daqiqadan ortiq vaqt o'tkazish tashvish va depressiya belgilarini oshiradi." },
      { title: "Musiqa terapiyasi", text: "Sevimli musiqa tinglash kortizol (stress gormoni) darajasini kamaytiradi va endorfin ishlab chiqarishni oshiradi." },
      { title: "Uyqu va ruhiy salomatlik", text: "Kam uyqu depressiya xavfini 5 barobar oshiradi. Ruhiy salomatlik uchun 7-8 soat sifatli uyqu zarur." },
      { title: "Professional yordam", text: "Ikki haftadan ortiq davom etgan tushkunlik, bezovtalik yoki uyqu buzilishi bo'lsa, psixolog yoki psixiatrga murojaat qiling." },
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
      { title: "7-9 soat uyqu", text: "Kattalar uchun tuniga 7-9 soat uyqu tavsiya etiladi. Kam uyqu immun tizimini zaiflashtiradi." },
      { title: "Uyqu tartibi", text: "Har kuni bir xil vaqtda yotib, bir xil vaqtda turing. Bu biologik soatingizni tartibga soladi." },
      { title: "Ekranlardan uzoqlashing", text: "Uxlashdan 1 soat oldin telefon va kompyuterdan foydalanishni to'xtating. Ko'k yorug'lik melatonin ishlab chiqarishni kamaytiradi." },
      { title: "Xona sharoiti", text: "Uyqu xonasi salqin (18-20°C), qorong'i va jimjit bo'lishi kerak." },
      { title: "Kofeindan saqlaning", text: "Uxlashdan 6 soat oldin kofe, choy va energetik ichimliklar ichmang. Kofein yarim hayoti 5-6 soat." },
      { title: "Tushdan oldingi dam", text: "15-20 daqiqalik kunduzi uyqu energiyani tiklaydi, lekin 30 daqiqadan oshmasin — aks holda tungi uyquga xalaqit beradi." },
      { title: "Uyqu oldidan ritual", text: "Uxlashdan 30 daqiqa oldin kitob o'qish, iliq dush qabul qilish yoki yengil cho'zilish mashqlari qiling." },
      { title: "Spirtli ichimliklar", text: "Alkogol uyquga tez kirishga yordam bersa-da, uyqu sifatini buzadi va tez-tez uyg'onishga olib keladi." },
      { title: "Uyqu buzilishi belgilari", text: "Muntazam uxlay olmaslik, xurrak otish, tungi nafas to'xtashi — shifokorga murojaat qilish kerak." },
      { title: "Bolalar uyqusi", text: "1-2 yosh: 11-14 soat, 3-5 yosh: 10-13 soat, 6-12 yosh: 9-12 soat, 13-18 yosh: 8-10 soat uyqu zarur." },
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
      { title: "Yurak massaji (CPR)", text: "Ko'krak qafasining o'rtasiga 5-6 sm chuqurlikda, daqiqada 100-120 marta bosing. Har 30 bosimdan keyin 2 marta nafas bering." },
      { title: "Qon ketganda", text: "Yaraga toza mato bosing va ustidan bog'lang. Oyoq-qo'lni yurak darajasidan yuqoriroq ko'taring." },
      { title: "Kuyishda", text: "Kuygan joyni 10-20 daqiqa salqin (sovuq emas!) suv ostida ushlab turing. Moy yoki pasta surmang!" },
      { title: "Bo'g'ilganda", text: "Geymlix usuli: orqadan quchoqlab, qorin sohasiga tez va kuchli bosim bering." },
      { title: "Suyak sinishi", text: "Singan joyni harakatlantiramng. Shinalar yordamida mahkamlang va zudlik bilan kasalxonaga olib boring." },
      { title: "Ilon chaqqanda", text: "Yaranni yuving, harakatsiz ushlab turing. Zaharni so'rib chiqarishga urinmang! Tez tibbiy yordam chaqiring." },
      { title: "Elektr toki urganda", text: "Avval tokni o'chiring! Jabrlanuvchini quruq material bilan ajrating. Nafas va yurak urishi tekshiring." },
      { title: "Hushidan ketganda", text: "Bemorni yon tomoniga yotqizing (tiklangan holat). Boshini orqaga egib, havo yo'lini oching. 103 ga qo'ng'iroq qiling." },
      { title: "Allergik shok (anafilaksiya)", text: "Epinefrin (adrenalin) in'yeksiyasini son mushagiga uring. Bemorni yotqizing, oyoqlarini ko'taring. Tez yordam chaqiring." },
      { title: "Zaharlanishda", text: "Qustirishga urinmang! Zahar moddani aniqlang va tez tibbiy yordam chaqiring. Idish-tovoqni saqlab qo'ying." },
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
      { title: "Temir", text: "Qon kamligini oldini oladi. Qizil go'sht, ismaloq va dukkaklilardan olinadi. Vitamin C bilan birga iste'mol qilsangiz yaxshiroq so'riladi." },
      { title: "Omega-3", text: "Miya va yurak salomatligi uchun. Yog'li baliq (salmon, sardina), zig'ir urug'i va yong'oqdan olinadi." },
      { title: "Vitamin B12", text: "Nerv tizimi va qon hujayralarini hosil qilish uchun zarur. Go'sht, baliq, sut va tuxumda topiladi. Vegetarianlar qo'shimcha qabul qilishi kerak." },
      { title: "Kalsiy", text: "Suyak va tish salomatligi uchun muhim. Sut, pishloq, brokoli va bodomdan olinadi. Kattalar uchun kuniga 1000 mg tavsiya etiladi." },
      { title: "Magniy", text: "300 dan ortiq ferment reaksiyasida ishtirok etadi. Yong'oq, shokolad, avokado va bananlardan olinadi. Muskullarni bo'shashtiradi." },
      { title: "Rux (sink)", text: "Immun tizimi va yara bitishi uchun muhim. Go'sht, qovoq urug'i va dukkaklilardan olinadi. Kuniga 8-11 mg tavsiya etiladi." },
      { title: "Foliy kislota (B9)", text: "Homilador ayollar uchun juda muhim — nerv naychasi nuqsonlarini 70% ga kamaytiradi. Yashil bargli sabzavotlarda ko'p." },
      { title: "Probiotiklar", text: "Ichak mikroflorasini yaxshilaydigan foydali bakteriyalar. Yogurt, kefir, kislokapusta va miso ichida topiladi." },
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
      { title: "Mevali suv", text: "Oddiy suvga limon, bodring, yalpiz yoki rezavor mevalar qo'shib ichish ta'mini yaxshilaydi va vitaminlar qo'shadi." },
      { title: "Choy va kofe hisobga kiradimi?", text: "Ha, lekin kofeinsiz suyuqliklar afzalroq. Kofeinsiz o'simlik choylari (romashka, yalpiz) suv o'rnini bosishi mumkin." },
      { title: "Sport paytida suv", text: "Mashqdan 2 soat oldin 500ml, mashq paytida har 15-20 daqiqada 150-200ml suv iching." },
      { title: "Gazlangan ichimliklar", text: "Shirin gazli ichimliklar o'rniga toza suv iching. 1 litr kola 110g shakar saqlaydi — bu kunlik normadan 4 baravar ko'p!" },
      { title: "Issiq havoda suv", text: "30°C dan yuqori haroratda suv iste'molini 1.5-2 barobar oshiring. Issiq urishdan saqlaning." },
      { title: "Bolalar uchun suv", text: "1-3 yosh: 1.3 litr, 4-8 yosh: 1.7 litr, 9-13 yosh: 2.1-2.4 litr kunlik suv normasi." },
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
      { title: "Qon bosimi nazorati", text: "40 yoshdan keyin qon bosimini muntazam tekshiring. Normal ko'rsatkich: 120/80 mmHg. Yuqori bosim insult xavfini oshiradi." },
      { title: "Qandli diabet skriningi", text: "45 yoshdan keyin yoki xavf omillari bo'lsa qon qandini tekshiring. Och qoringa norma: 3.9-5.6 mmol/l." },
      { title: "Ko'z tekshiruvi", text: "40 yoshdan keyin yilda 1 marta ko'z tekshiruvi — glaukoma va kataraktani erta aniqlash muhim." },
      { title: "Tana vazni indeksi (BMI)", text: "BMI = vazn(kg) / bo'y(m)². Normal: 18.5-24.9. 25 dan yuqori — ortiqcha vazn, 30 dan yuqori — semizlik." },
      { title: "Xolesterin tekshiruvi", text: "20 yoshdan keyin har 5 yilda bir marta lipid profili tekshiring. Umumiy xolesterin 5.2 mmol/l dan past bo'lishi kerak." },
      { title: "Teri tekshiruvi", text: "Xollarni muntazam kuzating: shakli, rangi yoki o'lchami o'zgarsa dermatologga murojaat qiling. Erta aniqlash melanomani davolash imkonini beradi." },
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
