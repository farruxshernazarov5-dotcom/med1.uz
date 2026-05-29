import { useState } from "react";
import SectionLayout from "@/components/SectionLayout";
import { Heart, Apple, Dumbbell, Brain, Moon, Cross, Droplets, Shield, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { healthCategoriesData } from "@/data/healthTips";

import healthNutrition from "@/assets/health-nutrition.webp";
import healthExercise from "@/assets/health-exercise.webp";
import healthMental from "@/assets/health-mental.webp";
import healthSleep from "@/assets/health-sleep.webp";
import healthFirstaid from "@/assets/health-firstaid.webp";
import healthVitamins from "@/assets/health-vitamins.webp";
import healthWater from "@/assets/health-water.webp";
import healthPrevention from "@/assets/health-prevention.webp";

const iconMap: Record<string, any> = {
  nutrition: Apple,
  exercise: Dumbbell,
  mental: Brain,
  sleep: Moon,
  firstaid: Cross,
  vitamins: Heart,
  water: Droplets,
  prevention: Shield,
};

const imageMap: Record<string, string> = {
  nutrition: healthNutrition,
  exercise: healthExercise,
  mental: healthMental,
  sleep: healthSleep,
  firstaid: healthFirstaid,
  vitamins: healthVitamins,
  water: healthWater,
  prevention: healthPrevention,
};

const TIPS_PER_PAGE = 10;

const totalTips = healthCategoriesData.reduce((sum, cat) => sum + cat.tips.length, 0);

const HealthPage = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [pages, setPages] = useState<Record<string, number>>({});

  const getPage = (catId: string) => pages[catId] || 0;
  const setPage = (catId: string, page: number) => setPages((prev) => ({ ...prev, [catId]: page }));

  const getPaginatedTips = (catId: string) => {
    const cat = healthCategoriesData.find((c) => c.id === catId);
    if (!cat) return { tips: [], totalPages: 0, currentPage: 0 };
    const page = getPage(catId);
    const totalPages = Math.ceil(cat.tips.length / TIPS_PER_PAGE);
    const tips = cat.tips.slice(page * TIPS_PER_PAGE, (page + 1) * TIPS_PER_PAGE);
    return { tips, totalPages, currentPage: page };
  };

  const renderPagination = (catId: string, totalPages: number, currentPage: number) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 pt-3 border-t border-border mt-3">
        <button
          onClick={(e) => { e.stopPropagation(); setPage(catId, currentPage - 1); }}
          disabled={currentPage === 0}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setPage(catId, i); }}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                i === currentPage ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setPage(catId, currentPage + 1); }}
          disabled={currentPage === totalPages - 1}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <SectionLayout
      title="Salomatlik bo'limi"
      subtitle={`${totalTips}+ salomatlik haqida maslahatlar`}
      icon={<Heart className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-8">
        {healthCategoriesData.map((cat) => {
          const Icon = iconMap[cat.id];
          return (
            <button
              key={cat.id}
              onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                expandedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-foreground hover:border-primary/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.title}
              <span className="text-xs opacity-70">({cat.tips.length})</span>
            </button>
          );
        })}
      </div>

      {/* Featured categories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {healthCategoriesData.slice(0, 4).map((cat, idx) => {
          const Icon = iconMap[cat.id];
          const { tips, totalPages, currentPage } = getPaginatedTips(cat.id);
          return (
            <div
              key={cat.id}
              className="group relative rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer animate-fade-up"
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
            >
              <div className="relative h-48 overflow-hidden">
                <img src={imageMap[cat.id]} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-60`} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-primary-foreground">{cat.title}</h3>
                      <p className="text-primary-foreground/80 text-sm">{cat.tips.length} ta maslahat</p>
                    </div>
                  </div>
                </div>
              </div>

              {expandedCategory === cat.id ? (
                <div className="p-5 bg-card space-y-3 animate-fade-up" onClick={(e) => e.stopPropagation()}>
                  {tips.map((tip) => (
                    <div key={tip.title} className="flex gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{tip.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                  {renderPagination(cat.id, totalPages, currentPage)}
                </div>
              ) : (
                <div className="p-4 bg-card flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{cat.description}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secondary categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthCategoriesData.slice(4).map((cat, idx) => {
          const Icon = iconMap[cat.id];
          const { tips, totalPages, currentPage } = getPaginatedTips(cat.id);
          return (
            <div
              key={cat.id}
              className="group rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer animate-fade-up"
              style={{ animationDelay: `${(idx + 4) * 100}ms` }}
              onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
            >
              <div className="relative h-36 overflow-hidden">
                <img src={imageMap[cat.id]} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-50`} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                    <h3 className="font-heading font-bold text-primary-foreground">{cat.title}</h3>
                  </div>
                  <p className="text-primary-foreground/80 text-xs mt-1">{cat.tips.length} ta maslahat</p>
                </div>
              </div>

              {expandedCategory === cat.id ? (
                <div className="p-4 bg-card space-y-2 animate-fade-up" onClick={(e) => e.stopPropagation()}>
                  {tips.map((tip) => (
                    <div key={tip.title} className="p-2.5 rounded-lg bg-muted/50">
                      <h4 className="font-semibold text-xs text-foreground">{tip.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{tip.text}</p>
                    </div>
                  ))}
                  {renderPagination(cat.id, totalPages, currentPage)}
                </div>
              ) : (
                <div className="p-3 bg-card">
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Health facts banner */}
      <div className="mt-12 rounded-2xl bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground">
        <h3 className="font-heading text-xl font-bold mb-4">💡 Foydali faktlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { stat: `${totalTips}+`, label: "Jami salomatlik maslahatlari 8 ta bo'limda jamlangan" },
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
