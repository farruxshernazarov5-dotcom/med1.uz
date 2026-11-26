import { useState } from "react";
import type { CreateEventWithPromptOptions } from "@ebarooni/capacitor-calendar";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCalendarEvent } from "@/lib/calendarEvent";
import { toast } from "@/hooks/use-toast";
import { isNativeApp } from "@/lib/nativeApp";

export default function CalendarEventButton({ event, compact = false }: { event: () => CreateEventWithPromptOptions; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  return <Button variant="outline" size={compact ? "icon" : "default"} disabled={busy} aria-label="Telefon kalendariga qo‘shish" title="Telefon kalendariga qo‘shish" onClick={async () => {
    setBusy(true);
    try { await openCalendarEvent(event()); toast({ title: isNativeApp() ? "Kalendar oynasida Saqlashni bosing" : "Kalendar fayli yuklandi", description: isNativeApp() ? "Qabulni ko‘chirsangiz yoki bekor qilsangiz, telefon kalendarini ham yangilang." : "Yuklangan .ics faylini kalendar ilovasida ochib saqlang." }); }
    catch (e) { toast({ title: "Kalendar ochilmadi", description: e instanceof Error ? e.message : "Qayta urinib ko‘ring", variant: "destructive" }); }
    finally { setBusy(false); }
  }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}{!compact && "Telefon kalendariga qo‘shish"}</Button>;
}