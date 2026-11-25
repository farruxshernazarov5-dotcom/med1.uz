import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateKey } from "@/lib/doctorAvailability";

export default function DoctorDatePicker({ value, onChange, dates }: { value: string; onChange: (date: string) => void; dates?: string[] }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button variant="outline" className="w-full min-w-0 justify-start gap-2 text-sm"><CalendarDays className="h-4 w-4 shrink-0" />{selected ? format(selected, "d MMMM yyyy", { locale: uz }) : "Sanani tanlang"}</Button></PopoverTrigger>
    <PopoverContent align="start" className="z-[80] w-auto max-w-[calc(100vw-2rem)] p-0 pointer-events-auto">
      <Calendar mode="single" locale={uz} selected={selected} defaultMonth={selected} disabled={d => dates ? !dates.includes(dateKey(d)) : dateKey(d) < dateKey(new Date())}
        onSelect={d => { if (d) { onChange(dateKey(d)); setOpen(false); } }} className="pointer-events-auto" initialFocus />
    </PopoverContent>
  </Popover>;
}