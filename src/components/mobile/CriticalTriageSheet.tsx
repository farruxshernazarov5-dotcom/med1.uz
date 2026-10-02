import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ambulance, Building2, Phone, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { hapticTap } from "@/lib/nativeApp";

export const CriticalTriageSheet = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => {
      void hapticTap();
      setOpen(true);
    };
    window.addEventListener("med1:critical-triage", show);
    return () => window.removeEventListener("med1:critical-triage", show);
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerContent className="lg:hidden max-h-[90dvh] rounded-t-3xl border-destructive bg-card">
        <DrawerHeader className="relative text-left">
          <div className="flex items-center gap-3 pr-10">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
              <ShieldAlert />
            </span>
            <div>
              <DrawerTitle className="text-destructive">Shoshilinch xavf belgisi</DrawerTitle>
              <DrawerDescription>AI jiddiy xavf ehtimolini aniqladi.</DrawerDescription>
            </div>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="Ogohlantirishni yopish"><X /></Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <Button variant="destructive" className="h-14 w-full text-base" asChild>
            <a href="tel:103"><Phone /> 103 tez yordamga qo‘ng‘iroq qilish</a>
          </Button>
          <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-destructive"><Ambulance /> Yordam kelguncha</h3>
            <ol className="mt-3 space-y-2 text-sm text-foreground">
              <li>1. Bemorni xavfsiz va qulay holatga yotqizing.</li>
              <li>2. Nafas olishi va hushini muntazam tekshiring.</li>
              <li>3. Ovqat, ichimlik yoki dori bermang.</li>
              <li>4. 103 operatorining ko‘rsatmalariga qat’iy amal qiling.</li>
            </ol>
          </section>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/mobile-services" onClick={() => setOpen(false)}><Building2 /> 24/7 statsionarlarni ko‘rish</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">AI xulosasi tez yordam yoki shifokor ko‘rigini almashtirmaydi.</p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};