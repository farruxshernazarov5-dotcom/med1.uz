import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Megaphone } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RoleGrid, RoleStoryDialog } from '@/components/mobile/MobileRoleCenter';
import type { MobileRole } from '@/data/mobileRoleCatalog';
import { hapticTap } from '@/lib/nativeApp';
import classifiedsImage from '@/assets/mobile-features/classifieds-1.webp';

const HIDDEN = /^\/(?:auth|app-bridge|reset-password|forgot-password|dashboard|admin|hms|check-in|payme)/;

/** Click Business-style vertical tab on the left edge: 10 roles + classifieds board, on web and in the app. */
export function BusinessEdgeTab() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<MobileRole | null>(null);
  if (HIDDEN.test(pathname)) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => { void hapticTap(); setOpen(true); }}
        aria-label="Med ALL Business: rollar va e’lonlar"
        className="fixed left-0 top-[38%] z-40 flex items-center gap-1.5 rounded-r-2xl border border-l-0 border-border bg-card px-2 py-3 text-xs font-bold shadow-lg transition-transform active:scale-95 [writing-mode:vertical-rl] rotate-180"
      >
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-primary">Med ALL</span>
        <span className="text-accent">Business</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[92vw] max-w-md overflow-y-auto p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
          <SheetHeader className="text-left">
            <SheetTitle>Med ALL Business</SheetTitle>
            <SheetDescription>E’lonlar doskasi va 10 ta yo‘nalish bo‘yicha ro‘yxatdan o‘tish.</SheetDescription>
          </SheetHeader>

          <div className="relative mt-4 overflow-hidden rounded-lg border border-border">
            <img src={classifiedsImage} alt="" loading="lazy" className="h-40 w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3 text-primary-foreground">
              <p className="font-bold">E’lonlar doskasi</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button asChild variant="secondary" size="sm" onClick={() => setOpen(false)}><Link to="/mobile-classifieds?tab=medical"><Megaphone />Tibbiy</Link></Button>
                <Button asChild variant="secondary" size="sm" onClick={() => setOpen(false)}><Link to="/mobile-classifieds?tab=business"><BriefcaseBusiness />Biznes</Link></Button>
              </div>
            </div>
          </div>
          <Button asChild variant="link" className="w-full" onClick={() => setOpen(false)}><Link to="/mobile-classifieds">Barcha e’lonlar <ArrowRight /></Link></Button>

          <h3 className="mb-2 mt-2 font-bold">Rolingizni tanlang</h3>
          <RoleGrid onPick={(r) => { setOpen(false); setRole(r); }} />
        </SheetContent>
      </Sheet>
      <RoleStoryDialog role={role} onClose={() => setRole(null)} />
    </>
  );
}
