import { useState } from "react";
import { ArrowRight, Layers } from "lucide-react";

import catAllergy from "@/assets/cat-allergy.webp";
import catNeurology from "@/assets/cat-neurology.webp";
import catInfectious from "@/assets/cat-infectious.webp";
import catCardiology from "@/assets/cat-cardiology.webp";
import catSurgery from "@/assets/cat-surgery.webp";
import catPediatrics from "@/assets/cat-pediatrics.webp";
import catEye from "@/assets/cat-eye.webp";
import catDental from "@/assets/cat-dental.webp";
import catOncology from "@/assets/cat-oncology.webp";
import catGastro from "@/assets/cat-gastro.webp";
import anatomyImg from "@/assets/medicine-anatomy.webp";
import researchImg from "@/assets/medicine-research.webp";
import pillsImg from "@/assets/medicine-pills.webp";

type Category = {
  title: string;
  desc: string;
  image: string;
  count: string;
};

type Group = {
  id: string;
  label: string;
  color: string;
  gradient: string;
  categories: Category[];
};

const groups: Group[] = [
  {
    id: "A",
    label: "A bo'lim",
    color: "bg-rose-500",
    gradient: "from-rose-500 to-pink-600",
    categories: [
      { title: "Allergik reaktsiya", desc: "Allergik kasalliklar va immunitet buzilishlari", image: catAllergy, count: "120+" },
      { title: "Tanlangan kasalliklar", desc: "Ko'p uchraydigan va muhim kasalliklar to'plami", image: researchImg, count: "95+" },
      { title: "Dermatologiya", desc: "Teri, tirnoq va soch kasalliklari", image: catAllergy, count: "85+" },
      { title: "Nerv tizimi", desc: "Nerv tizimi va miya kasalliklari", image: catNeurology, count: "110+" },
      { title: "Andrologiya", desc: "Erkaklar salomatligi va reproduktiv tizim", image: anatomyImg, count: "70+" },
      { title: "LOR", desc: "Quloq, burun va tomoq kasalliklari", image: catAllergy, count: "80+" },
      { title: "Jinsiy kasalliklar", desc: "Jinsiy yo'l bilan yuqadigan infektsiyalar", image: catInfectious, count: "65+" },
    ],
  },
  {
    id: "B",
    label: "B bo'lim",
    color: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-600",
    categories: [
      { title: "Yuqumli kasalliklar", desc: "Infektsion va yuqumli kasalliklar", image: catInfectious, count: "130+" },
      { title: "Ginekologiya", desc: "Ayollar salomatligi va reproduktiv tizim", image: researchImg, count: "90+" },
      { title: "Endokrinologiya", desc: "Gormonlar va ichki sekretsiya bezlari", image: pillsImg, count: "75+" },
      { title: "Gastroenterologiya", desc: "Oshqozon-ichak trakti kasalliklari", image: catGastro, count: "100+" },
      { title: "Onkologiya", desc: "O'smalar va saraton kasalliklari", image: catOncology, count: "85+" },
      { title: "Parazitologiya", desc: "Parazitar kasalliklar va gijjalar", image: catInfectious, count: "60+" },
      { title: "Ortopediya", desc: "Suyak-bo'g'im tizimi kasalliklari", image: catSurgery, count: "70+" },
    ],
  },
  {
    id: "C",
    label: "C bo'lim",
    color: "bg-violet-500",
    gradient: "from-violet-500 to-purple-600",
    categories: [
      { title: "Mammologiya", desc: "Ko'krak bezi kasalliklari va diagnostikasi", image: researchImg, count: "55+" },
      { title: "Revmatologiya", desc: "Bo'g'im va biriktiruvchi to'qima kasalliklari", image: anatomyImg, count: "65+" },
      { title: "Qon kasalliklari", desc: "Gematologiya va qon tizimi buzilishlari", image: catCardiology, count: "70+" },
      { title: "Pulmonologiya", desc: "O'pka va nafas yo'llari kasalliklari", image: catAllergy, count: "80+" },
      { title: "Pediatriya", desc: "Bolalar kasalliklari va profilaktikasi", image: catPediatrics, count: "110+" },
      { title: "Virusologiya", desc: "Virusli kasalliklar va ularning tarqalishi", image: catInfectious, count: "75+" },
      { title: "Onkoginekologiya", desc: "Ayollar reproduktiv tizimi o'smalari", image: catOncology, count: "50+" },
    ],
  },
  {
    id: "D",
    label: "D bo'lim",
    color: "bg-amber-500",
    gradient: "from-amber-500 to-orange-600",
    categories: [
      { title: "Travmatologiya", desc: "Shikastlanishlar va jarohatlarga yordam", image: catSurgery, count: "90+" },
      { title: "Stomatologiya", desc: "Tish va og'iz bo'shlig'i kasalliklari", image: catDental, count: "85+" },
      { title: "Jarrohlik", desc: "Xirurgik amaliyotlar va operatsiyalar", image: catSurgery, count: "100+" },
      { title: "Oftalmologiya", desc: "Ko'z kasalliklari va ko'rish buzilishlari", image: catEye, count: "75+" },
      { title: "Yurak-qon tomir", desc: "Kardiologik kasalliklar va profilaktika", image: catCardiology, count: "95+" },
      { title: "Urologiya", desc: "Siydik yo'llari va buyrak kasalliklari", image: anatomyImg, count: "70+" },
      { title: "Proktologiya", desc: "To'g'ri ichak va anal soha kasalliklari", image: catGastro, count: "60+" },
    ],
  },
];

const DiseaseClassification = () => {
  const [activeGroup, setActiveGroup] = useState("A");

  const currentGroup = groups.find((g) => g.id === activeGroup)!;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Layers className="w-6 h-6 text-primary" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Kasalliklar <span className="text-gradient">tasnifi</span>
          </h2>
        </div>
        <p className="text-muted-foreground mb-8 ml-9">
          28 ta soha bo'yicha to'liq tibbiy ma'lumotlar
        </p>

        {/* Group Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`relative px-6 py-3 rounded-2xl font-heading font-semibold text-sm transition-all duration-300 ${
                activeGroup === group.id
                  ? `bg-gradient-to-r ${group.gradient} text-white shadow-lg scale-105`
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    activeGroup === group.id
                      ? "bg-white/20 text-white"
                      : `${group.color} text-white`
                  }`}
                >
                  {group.id}
                </span>
                {group.label}
              </span>
            </button>
          ))}
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {currentGroup.categories.map((cat, i) => (
            <div
              key={cat.title}
              className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="relative h-44 overflow-hidden">
                <img loading="lazy" decoding="async"
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span
                    className={`bg-gradient-to-r ${currentGroup.gradient} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider`}
                  >
                    {currentGroup.id} bo'lim
                  </span>
                </div>
                <div className="absolute bottom-3 right-4">
                  <span className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {cat.count} atama
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-heading font-semibold text-foreground text-base mb-1.5">
                  {cat.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cat.desc}
                </p>
                <div className="flex items-center text-primary text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Batafsil <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiseaseClassification;
