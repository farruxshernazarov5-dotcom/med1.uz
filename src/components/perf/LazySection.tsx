import { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  /** Placeholder balandligi (CLS oldini olish uchun) */
  minHeight?: number;
  /** Ekranga qancha qolganda yuklansin */
  rootMargin?: string;
  className?: string;
}

/**
 * Blokni faqat ekranga yaqinlashganda render qiladi.
 * Bosh sahifadagi og'ir bloklar uchun — birinchi yuklanishni sezilarli tezlashtiradi.
 */
const LazySection = ({ children, minHeight = 200, rootMargin = "300px", className }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} style={visible ? undefined : { minHeight }}>
      {visible ? children : null}
    </div>
  );
};

export default LazySection;
