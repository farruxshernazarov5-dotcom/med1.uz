import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BookOpen, Handshake, ShieldCheck } from "lucide-react";
import { paymentGuides } from "@/data/paymentGuides";
import PartnerLogo from "./PartnerLogo";

export default function PaymentEcosystem() {
  return (
    <section id="hamkorlar" className="border-y border-border bg-muted/30 py-16 md:py-24" aria-labelledby="payment-ecosystem-title">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary">
            <Handshake className="h-4 w-4" /> Rasmiy hamkorlar
          </div>
          <h2 id="payment-ecosystem-title" className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">Ishonchli xizmatlar. Tushunarli to‘lovlar.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">MED ALL ilovasi foydalanuvchilari tanish bank, to‘lov va raqamli xizmatlar orqali tibbiy xizmatlardan qulay foydalanadi. Har bir hamkor uchun amaliy qo‘llanma tayyorladik.</p>
        </div>

        <div className="partner-marquee-stage relative mb-12 overflow-hidden rounded-3xl border border-border/80 py-6 shadow-sm" aria-label="Rasmiy hamkorlar logotiplari">
          <div className="pointer-events-none absolute inset-0 bg-grid-tech opacity-20" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background/90 to-transparent sm:w-20" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background/90 to-transparent sm:w-20" aria-hidden="true" />
          <div className="partner-marquee-track relative flex w-max gap-4 px-2">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-stretch gap-4" aria-hidden={dup === 1 || undefined}>
                {paymentGuides.map((guide) => (
                  <Link
                    key={`${dup}-${guide.slug}`}
                    to={`/payment-guides/${guide.slug}`}
                    tabIndex={dup === 1 ? -1 : undefined}
                    aria-label={dup === 0 ? `${guide.name} qo‘llanmasini ochish` : undefined}
                    className="group flex min-h-24 w-48 shrink-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-card/90 px-4 py-4 text-center shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-secondary/50 hover:bg-card hover:shadow-card sm:w-52"
                  >
                    <PartnerLogo brand={guide.brand} compact />
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><BadgeCheck className="h-3.5 w-3.5 text-secondary" /> Rasmiy hamkor</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-secondary"><BookOpen className="h-4 w-4" /> Foydalanuvchi qo‘llanmalari</p>
            <h3 className="font-heading text-2xl font-bold text-foreground">Qanday foydalaniladi?</h3>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">To‘lov tanlashdan chekni saqlashgacha — har bir bosqich oddiy tilda.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paymentGuides.map((guide) => (
            <article key={guide.slug} className="group flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-card-hover md:last:col-span-2 lg:last:col-span-1">
              <Link to={`/payment-guides/${guide.slug}`} className="flex w-full flex-col">
                <div className="relative overflow-hidden">
                  <img src={guide.image} alt={guide.imageAlt} loading="lazy" width={1280} height={832} className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-primary/70 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-primary-foreground/20 bg-primary/80 px-3 py-1 text-[11px] font-semibold text-primary-foreground backdrop-blur-sm">{guide.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <PartnerLogo brand={guide.brand} compact />
                    <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold text-secondary">{guide.availability}</span>
                  </div>
                  <h4 className="mb-2 font-heading text-xl font-bold text-foreground">{guide.name}: qanday foydalaniladi?</h4>
                  <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{guide.summary}</p>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-secondary">Qo‘llanmani o‘qish <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
          <p>Xizmat va to‘lov usullarining mavjudligi har bir to‘lov oynasida alohida ko‘rsatiladi. Hamkor nomlari va logotiplari tegishli egalariga mansub; ular xizmatdan foydalanish tartibini tushuntirish uchun ishlatildi.</p>
        </div>
      </div>
    </section>
  );
}
