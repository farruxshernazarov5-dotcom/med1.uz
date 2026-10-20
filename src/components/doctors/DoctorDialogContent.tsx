import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Full-screen mobile consultation surface, following the keyboard's visual viewport. */
const DoctorDialogContent = forwardRef<ElementRef<typeof DialogContent>, ComponentPropsWithoutRef<typeof DialogContent>>(
  ({ className, style, ...props }, ref) => {
    const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
    useEffect(() => {
      const vv = window.visualViewport;
      const update = () => setViewport(window.innerWidth < 640 && vv ? { height: vv.height, top: vv.offsetTop } : null);
      update();
      vv?.addEventListener("resize", update);
      vv?.addEventListener("scroll", update);
      window.addEventListener("resize", update);
      return () => {
        vv?.removeEventListener("resize", update);
        vv?.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    }, []);
    return <DialogContent ref={ref} {...props}
      style={{ ...style, ...(viewport ? { height: viewport.height, top: viewport.top } : {}) }}
      className={cn(className, "max-sm:left-0 max-sm:top-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:z-[60] max-sm:pt-[max(1rem,env(safe-area-inset-top))] max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:px-4 max-sm:[&>button:last-child]:top-[max(1rem,env(safe-area-inset-top))] max-sm:[&>button:last-child]:h-10 max-sm:[&>button:last-child]:w-10 max-sm:[&>div:first-child]:pr-10")} />;
  },
);
DoctorDialogContent.displayName = "DoctorDialogContent";
export default DoctorDialogContent;
