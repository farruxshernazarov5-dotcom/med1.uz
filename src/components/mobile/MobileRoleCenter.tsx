import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, CircleHelp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { MOBILE_ROLES, type MobileRole } from '@/data/mobileRoleCatalog';
import { hapticTap } from '@/lib/nativeApp';

const SEEN = 'med1_role_center_seen_v1';

/** Full-screen 3-frame story for one role (shared by the home section and the Business tab). */
export function RoleStoryDialog({ role, onClose }: { role: MobileRole | null; onClose: () => void }) {
  const nav = useNavigate();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!role) return;
    setFrame(0);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setFrame((i) => (i + 1) % 3), 4600);
    return () => clearInterval(t);
  }, [role?.id]);
  return (
    <Dialog open={!!role} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="fixed inset-0 left-0 top-0 z-[85] h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 p-0 sm:left-1/2 sm:top-1/2 sm:h-[90vh] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl [&>button]:hidden">
        {role && (
          <>
            <img src={role.image} alt="" width={600} height={1800} className="absolute inset-0 h-[300%] w-full object-cover transition-transform duration-700" style={{ transform: `translateY(-${frame * 33.333333}%)` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/25 via-transparent to-primary/90" />
            <div className="relative flex h-full flex-col p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] text-primary-foreground">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 rounded-full ${frame === i ? 'w-7 bg-background' : 'w-2 bg-background/50'}`} />)}</div>
                <Button variant="secondary" size="icon" className="h-11 w-11" onClick={onClose} aria-label="Yopish"><X /></Button>
              </div>
              <div className="mt-auto rounded-lg border border-primary-foreground/20 bg-primary/65 p-4 backdrop-blur-md">
                <p className="text-xs font-bold">{frame + 1} / 3 · {role.title}</p>
                <DialogTitle className="mt-2 text-3xl font-bold text-primary-foreground">{role.phrases[frame]}</DialogTitle>
                <DialogDescription className="mt-2 text-sm font-medium text-primary-foreground/90">{role.features[frame]}</DialogDescription>
                <div className="mt-3 flex flex-wrap gap-1.5">{role.plans.map((p) => <span key={p} className="rounded-full border border-primary-foreground/25 bg-primary/40 px-2 py-1 text-[11px]">{p}</span>)}</div>
                <div className="mt-4 grid grid-cols-[auto_1fr_auto] gap-2">
                  <Button variant="secondary" size="icon" onClick={() => setFrame((frame + 2) % 3)} aria-label="Oldingi"><ChevronLeft /></Button>
                  <Button className="bg-background text-foreground" onClick={() => { onClose(); nav(role.path); }}>Boshlash <ArrowRight /></Button>
                  <Button variant="secondary" size="icon" onClick={() => setFrame((frame + 1) % 3)} aria-label="Keyingi"><ChevronRight /></Button>
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs"><Check className="h-4 w-4" />Rol faqat ro‘yxatdan o‘tishda xavfsiz biriktiriladi.</p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Photo tile grid of the 10 roles. */
export function RoleGrid({ onPick }: { onPick: (r: MobileRole) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MOBILE_ROLES.map((r) => (
        <button key={r.id} type="button" onClick={() => { void hapticTap(); onPick(r); }} className="group relative h-32 overflow-hidden rounded-lg border border-border text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src={r.image} alt="" loading="lazy" className="absolute inset-0 h-[300%] w-full object-cover object-top transition-transform duration-500 group-active:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-2.5 text-primary-foreground">
            <span className="flex items-center gap-1.5 font-bold"><r.icon className="h-4 w-4" />{r.title}</span>
            <span className="mt-0.5 block text-[11px] leading-tight text-primary-foreground/85">{r.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function MobileRoleCenter() {
  const [role, setRole] = useState<MobileRole | null>(null);
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN)) { setRole(MOBILE_ROLES[0]); localStorage.setItem(SEEN, '1'); }
    } catch { /* storage unavailable */ }
  }, []);
  return (
    <section className="border-y border-border bg-card px-4 py-6 lg:hidden" aria-labelledby="role-center-title">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-primary">Med ALL imkoniyatlari</p>
          <h2 id="role-center-title" className="text-xl font-bold">Rolingizga mos markaz</h2>
          <p className="mt-1 text-sm text-muted-foreground">10 ta yo‘nalishdan o‘zingizga mosini tanlang.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setRole(MOBILE_ROLES[0])} aria-label="Rollar yo‘riqnomasini ochish"><CircleHelp /></Button>
      </div>
      <RoleGrid onPick={setRole} />
      <RoleStoryDialog role={role} onClose={() => setRole(null)} />
    </section>
  );
}
