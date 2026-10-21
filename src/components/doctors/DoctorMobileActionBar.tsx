import { Calendar, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onBook?: () => void;
  bookHref?: string;
  phone?: string | null;
  contactTarget?: string;
}

/** Sticky phone action bar above the bottom navigation: booking + contact always one tap away. */
export default function DoctorMobileActionBar({ onBook, bookHref, phone, contactTarget = "consult" }: Props) {
  const scrollToContact = () => document.getElementById(contactTarget)?.scrollIntoView({ behavior: "smooth", block: "center" });
  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg gap-2">
        {bookHref ? (
          <Button asChild className="flex-1 min-h-11 gap-2"><a href={bookHref}><Calendar className="h-4 w-4" /> Qabulga yozilish</a></Button>
        ) : onBook ? (
          <Button onClick={onBook} className="flex-1 min-h-11 gap-2"><Calendar className="h-4 w-4" /> Qabulga yozilish</Button>
        ) : null}
        <Button variant="outline" onClick={scrollToContact} className="min-h-11 gap-2"><MessageCircle className="h-4 w-4" /> Bog‘lanish</Button>
        {phone && (
          <Button asChild variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Qo‘ng‘iroq qilish"><a href={`tel:${phone}`}><Phone className="h-4 w-4" /></a></Button>
        )}
      </div>
    </div>
  );
}
