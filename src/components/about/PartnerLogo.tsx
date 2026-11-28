import type { CSSProperties } from "react";
import type { PartnerBrand } from "@/data/paymentGuides";
import hambiIcon from "@/assets/hambi-med1-partnership.png";
import { cn } from "@/lib/utils";

const tokenByBrand: Record<PartnerBrand, string> = {
  hambi: "--brand-hambi",
  "click-super": "--brand-click",
  click: "--brand-click",
  payme: "--brand-payme",
  uzum: "--brand-uzum",
  anor: "--brand-anor",
  nasiya: "--brand-uzum",
};

const ClickMark = () => (
  <svg viewBox="0 0 40 40" className="h-8 w-8 shrink-0" aria-hidden="true">
    <path fill="currentColor" fillRule="evenodd" d="M39.4 20.2C39.4 27.8 27.3 40 19.7 40S0 27.8 0 20.2 12.1.3 19.7.3s19.7 12.2 19.7 19.9Zm-11.8 0c0 3-4.9 7.9-7.9 7.9s-7.9-5-7.9-7.9 4.9-8 7.9-8 7.9 5 7.9 8Z" clipRule="evenodd" />
  </svg>
);

const UzumMark = ({ nasiya = false }: { nasiya?: boolean }) => (
  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full font-heading text-xl font-black", nasiya ? "bg-[hsl(var(--brand-nasiya-bg))] text-[hsl(var(--brand-uzum))]" : "bg-[hsl(var(--brand-uzum-bg))] text-[hsl(var(--brand-uzum))]")} aria-hidden="true">U</span>
);

const PaymeMark = () => (
  <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0" aria-hidden="true">
    <path d="M7 5h12c7 0 11 4 11 10s-4 10-11 10h-5v7H7V5Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    <path d="M14 12h5c2 0 3 1 3 3s-1 3-3 3h-5v-6Z" fill="currentColor" />
  </svg>
);

const AnorMark = () => (
  <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0" aria-hidden="true">
    <path d="M18 3 33 30h-8l-2.4-5H13l-2.3 5H3L18 3Zm0 10-2.5 6h5L18 13Z" fill="currentColor" />
  </svg>
);

export default function PartnerLogo({ brand, className, compact = false }: { brand: PartnerBrand; className?: string; compact?: boolean }) {
  const style = { color: `hsl(var(${tokenByBrand[brand]}))` } as CSSProperties;
  return (
    <div className={cn("inline-flex min-w-0 items-center gap-2.5", className)} style={style} role="img" aria-label={brand === "click-super" ? "Click Super App" : brand === "uzum" ? "Uzum Bank" : brand === "nasiya" ? "Uzum Nasiya" : brand === "anor" ? "ANORBANK" : brand === "hambi" ? "Hambi" : brand === "payme" ? "Payme" : "Click"}>
      {brand === "hambi" && <img src={hambiIcon} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" width={36} height={36} />}
      {(brand === "click" || brand === "click-super") && <ClickMark />}
      {brand === "payme" && <PaymeMark />}
      {brand === "uzum" && <UzumMark />}
      {brand === "nasiya" && <UzumMark nasiya />}
      {brand === "anor" && <AnorMark />}
      <div className="min-w-0 leading-none">
        {brand === "hambi" && <span className="font-heading text-2xl font-extrabold tracking-tight">hambi</span>}
        {brand === "click" && <span className="font-heading text-2xl font-extrabold tracking-tight">Click</span>}
        {brand === "click-super" && <><span className="font-heading text-2xl font-extrabold tracking-tight">Click</span><span className={cn("mt-1 block font-bold uppercase tracking-[0.16em]", compact ? "text-[8px]" : "text-[10px]")}>Super App</span></>}
        {brand === "payme" && <span className="font-heading text-2xl font-extrabold tracking-tight">payme</span>}
        {brand === "uzum" && <span className="font-heading text-xl font-extrabold tracking-tight">uzum bank</span>}
        {brand === "nasiya" && <span className="font-heading text-xl font-extrabold tracking-tight">uzum nasiya</span>}
        {brand === "anor" && <span className="font-heading text-xl font-extrabold tracking-tight">ANORBANK</span>}
      </div>
    </div>
  );
}
