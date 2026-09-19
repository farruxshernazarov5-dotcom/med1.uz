import { BadgeCheck, Building2 } from "lucide-react";
import authenticPortrait from "@/assets/yunusova-aziza-authentic.png.asset.json";
import creativePortrait from "@/assets/yunusova-aziza-creative.jfif.asset.json";

interface VerifiedAuthorProfileProps {
  author: string;
  affiliation: string;
  compact?: boolean;
  portrait?: "authentic" | "creative";
  portraitUrl?: string;
}

const VerifiedAuthorProfile = ({ author, affiliation, compact = false, portrait = "authentic", portraitUrl }: VerifiedAuthorProfileProps) => {
  const selectedPortrait = portraitUrl ?? (portrait === "creative" ? creativePortrait.url : authenticPortrait.url);

  return (
    <section className={`overflow-hidden rounded-md border border-border bg-card shadow-card ${compact ? "p-4" : "p-5 md:p-6"}`} aria-label="Tasdiqlangan muallif">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <img
          src={selectedPortrait}
          alt={`${author} — Med1.uz tasdiqlagan muallif portreti`}
          className="aspect-[4/5] w-28 shrink-0 rounded-md border border-border object-cover object-top sm:w-32"
          width={768}
          height={768}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`${compact ? "text-lg" : "text-xl md:text-2xl"} font-heading font-bold text-foreground`}>{author}</h2>
            <span
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              title="Muallif va nashr ma’lumotlari Med1.uz tomonidan tasdiqlangan"
            >
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Med1.uz tasdiqlagan
            </span>
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {affiliation}
          </p>
        </div>
      </div>
    </section>
  );
};

export default VerifiedAuthorProfile;