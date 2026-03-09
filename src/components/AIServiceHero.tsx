import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Sparkles, Activity } from "lucide-react";

interface AIServiceHeroProps {
  image: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features?: { icon: React.ReactNode; text: string }[];
}

const AIServiceHero = ({ image, title, subtitle, description, icon, gradient, features }: AIServiceHeroProps) => {
  return (
    <section className="relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={image} alt={title} className="w-full h-full object-cover" loading="eager" />
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-85`} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-white/20">
            {icon}
            <span>{subtitle}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white mb-3 leading-tight drop-shadow-lg">
            {title}
          </h1>

          {/* Description */}
          <p className="text-white/90 text-sm md:text-base lg:text-lg mb-6 max-w-2xl leading-relaxed drop-shadow">
            {description}
          </p>

          {/* Feature chips */}
          {features && features.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10"
                >
                  {f.icon}
                  {f.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIServiceHero;
