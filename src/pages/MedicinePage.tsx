import SectionLayout from "@/components/SectionLayout";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const sampleTerms: Record<string, string[]> = {
  A: ["Allergiya", "Anesteziologiya", "Antibiotiklar", "Antioksidantlar", "Aritmiya"],
  B: ["Bakteriya", "Bioximiya", "Bronxit", "Buyrак kasalliklari"],
  C: ["Cardiology", "CT scan"],
  D: ["Dermatologiya", "Diabеt", "Diagnostika", "Dori vositalari"],
};

const MedicinePage = () => {
  const [activeLetter, setActiveLetter] = useState("A");

  return (
    <SectionLayout
      title="Tibbiyot bo'limi"
      subtitle="20,000+ tibbiy atamalar va entsiklopedik ma'lumotlar"
      icon={<BookOpen className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Search */}
      <div className="max-w-xl mb-10">
        <div className="flex items-center bg-card rounded-xl border border-border shadow-card p-1">
          <Search className="w-5 h-5 text-muted-foreground ml-3" />
          <input
            type="text"
            placeholder="Tibbiy atamani qidirish (A-Z)..."
            className="flex-1 px-3 py-2.5 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Alphabet */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {alphabet.map((letter) => (
          <button
            key={letter}
            onClick={() => setActiveLetter(letter)}
            className={`w-10 h-10 rounded-lg font-heading font-semibold text-sm transition-all ${
              activeLetter === letter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Terms */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h3 className="font-heading text-xl font-semibold text-foreground mb-4">
          "{activeLetter}" harfi bo'yicha atamalar
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(sampleTerms[activeLetter] || ["Ma'lumotlar yuklanmoqda..."]).map((term) => (
            <div
              key={term}
              className="p-4 rounded-xl bg-accent/50 hover:bg-accent cursor-pointer transition-colors border border-transparent hover:border-primary/20"
            >
              <span className="font-medium text-foreground">{term}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionLayout>
  );
};

export default MedicinePage;
