import { BadgeCheck, Building2 } from "lucide-react";
import authenticPortrait from "@/assets/yunusova-aziza-authentic.png.asset.json";
import creativePortrait from "@/assets/yunusova-aziza-creative.jfif.asset.json";

interface VerifiedAuthorProfileProps {
  author: string;
  affiliation: string;
  compact?: boolean;
}

const VerifiedAuthorProfile = ({ author, affiliation, compact = false }: VerifiedAuthorProfileProps) => (
  <section className={`overflow-hidden rounded-md border border-border bg-card shadow-card ${compact ? "p-4" : "p-5 md:p-6"}`} aria-label="Tasdiqlangan muallif">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-52">
        <img
          src={authenticPortrait.url}
          alt={`${author} — haqiqiy portret`}
          className="aspect-[4/5] w-full rounded-md border border-border object-cover object-top"
          width={961}
          height={1147}
        />
        <img
          src={creativePortrait.url}
          alt={`${author} — Med1.uz ilmiy nashr portreti`}
          className="aspect-[4/5] w-full rounded-md border border-border object-cover object-top"
          width={944}
          height={1128}
        />
      </div>

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

export default VerifiedAuthorProfile;